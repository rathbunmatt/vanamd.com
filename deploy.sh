#!/bin/bash
# =============================================================================
# Deploy vanamd.com to AWS
# S3 (static hosting) → CloudFront (HTTPS/CDN) → Route 53 (DNS)
#
# Prerequisites:
#   - AWS CLI configured with credentials that have access to S3, CloudFront,
#     ACM, and Route 53
#   - npm installed (for building the Vite project)
#
# Usage:
#   chmod +x deploy.sh
#   ./deploy.sh
#
# The script is idempotent — safe to re-run. It will skip steps that are
# already complete and update what's changed.
# =============================================================================

set -euo pipefail

DOMAIN="vanamd.com"
BUCKET="vanamd.com"
REGION="us-east-1"  # ACM certs for CloudFront MUST be in us-east-1
DIST_DIR="./dist"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
err()  { echo -e "${RED}[✗]${NC} $1"; exit 1; }

echo ""
echo "========================================="
echo "  Deploying $DOMAIN"
echo "========================================="
echo ""

# --- Preflight checks ---
aws sts get-caller-identity > /dev/null 2>&1 || err "AWS CLI not configured"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
log "AWS Account: $ACCOUNT_ID"

# --- Build ---
echo ""
echo "--- Build ---"
if [ ! -d "node_modules" ]; then
  npm install
fi
npm run build
[ -d "$DIST_DIR" ] || err "Build output not found: $DIST_DIR"
log "Build complete"

# =============================================================================
# STEP 1: Create S3 bucket
# =============================================================================
echo ""
echo "--- Step 1: S3 Bucket ---"

if aws s3api head-bucket --bucket "$BUCKET" 2>/dev/null; then
  log "Bucket '$BUCKET' already exists"
else
  # us-east-1 doesn't use LocationConstraint
  aws s3api create-bucket --bucket "$BUCKET" --region "$REGION"
  log "Created bucket '$BUCKET'"
fi

# Block all public access (CloudFront will access via OAC)
aws s3api put-public-access-block \
  --bucket "$BUCKET" \
  --public-access-block-configuration \
  "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
log "Public access blocked (CloudFront-only access)"

# =============================================================================
# STEP 2: Upload built files
# =============================================================================
echo ""
echo "--- Step 2: Upload Content ---"

# Sync all built assets
aws s3 sync "$DIST_DIR" "s3://$BUCKET" \
  --delete \
  --exclude "*.html" \
  --cache-control "max-age=31536000, immutable"
log "Uploaded static assets (long cache)"

# Upload HTML with short cache
aws s3 cp "$DIST_DIR/index.html" "s3://$BUCKET/index.html" \
  --content-type "text/html; charset=utf-8" \
  --cache-control "max-age=300, s-maxage=86400"
log "Uploaded index.html"

# Upload robots.txt and sitemap.xml with appropriate types
if [ -f "$DIST_DIR/robots.txt" ]; then
  aws s3 cp "$DIST_DIR/robots.txt" "s3://$BUCKET/robots.txt" \
    --content-type "text/plain; charset=utf-8" \
    --cache-control "max-age=86400"
  log "Uploaded robots.txt"
fi

if [ -f "$DIST_DIR/sitemap.xml" ]; then
  aws s3 cp "$DIST_DIR/sitemap.xml" "s3://$BUCKET/sitemap.xml" \
    --content-type "application/xml; charset=utf-8" \
    --cache-control "max-age=86400"
  log "Uploaded sitemap.xml"
fi

# =============================================================================
# STEP 3: ACM Certificate
# =============================================================================
echo ""
echo "--- Step 3: ACM Certificate ---"

# Check if a certificate already exists for this domain
EXISTING_CERT=$(aws acm list-certificates \
  --region "$REGION" \
  --query "CertificateSummaryList[?DomainName=='$DOMAIN'].CertificateArn" \
  --output text)

if [ -n "$EXISTING_CERT" ] && [ "$EXISTING_CERT" != "None" ]; then
  CERT_ARN="$EXISTING_CERT"
  CERT_STATUS=$(aws acm describe-certificate \
    --certificate-arn "$CERT_ARN" \
    --region "$REGION" \
    --query 'Certificate.Status' \
    --output text)
  log "Certificate already exists: $CERT_ARN (Status: $CERT_STATUS)"
else
  CERT_ARN=$(aws acm request-certificate \
    --domain-name "$DOMAIN" \
    --subject-alternative-names "www.$DOMAIN" \
    --validation-method DNS \
    --region "$REGION" \
    --query 'CertificateArn' \
    --output text)
  log "Requested certificate: $CERT_ARN"
  CERT_STATUS="PENDING_VALIDATION"

  # Wait for ACM to generate validation records
  warn "Waiting for validation records to be generated..."
  sleep 10
fi

# =============================================================================
# STEP 4: DNS Validation
# =============================================================================
echo ""
echo "--- Step 4: DNS Validation ---"

# Get hosted zone ID
ZONE_ID=$(aws route53 list-hosted-zones-by-name \
  --dns-name "$DOMAIN" \
  --query "HostedZones[0].Id" \
  --output text | sed 's|/hostedzone/||')
log "Hosted Zone: $ZONE_ID"

if [ "$CERT_STATUS" != "ISSUED" ]; then
  # Get all validation records (apex + www SAN)
  VALIDATION_COUNT=$(aws acm describe-certificate \
    --certificate-arn "$CERT_ARN" \
    --region "$REGION" \
    --query 'length(Certificate.DomainValidationOptions)' \
    --output text)

  CHANGES="[]"
  for i in $(seq 0 $((VALIDATION_COUNT - 1))); do
    VALIDATION=$(aws acm describe-certificate \
      --certificate-arn "$CERT_ARN" \
      --region "$REGION" \
      --query "Certificate.DomainValidationOptions[$i].ResourceRecord")

    VNAME=$(echo "$VALIDATION" | python3 -c "import sys,json; print(json.load(sys.stdin)['Name'])")
    VVALUE=$(echo "$VALIDATION" | python3 -c "import sys,json; print(json.load(sys.stdin)['Value'])")

    CHANGES=$(echo "$CHANGES" | python3 -c "
import sys, json
changes = json.load(sys.stdin)
changes.append({
  'Action': 'UPSERT',
  'ResourceRecordSet': {
    'Name': '$VNAME',
    'Type': 'CNAME',
    'TTL': 300,
    'ResourceRecords': [{'Value': '$VVALUE'}]
  }
})
print(json.dumps(changes))
")
    log "DNS validation record queued: $VNAME"
  done

  # Add all CNAME validation records in one batch
  aws route53 change-resource-record-sets \
    --hosted-zone-id "$ZONE_ID" \
    --change-batch "{\"Changes\": $CHANGES}" > /dev/null
  log "All DNS validation records added"

  # Wait for validation
  warn "Waiting for certificate validation (2-10 minutes)..."
  ELAPSED=0
  while true; do
    sleep 15
    ELAPSED=$((ELAPSED + 15))
    STATUS=$(aws acm describe-certificate \
      --certificate-arn "$CERT_ARN" \
      --region "$REGION" \
      --query 'Certificate.Status' \
      --output text)
    echo "  ${ELAPSED}s... Status: $STATUS"
    if [ "$STATUS" = "ISSUED" ]; then
      break
    fi
    if [ $ELAPSED -gt 600 ]; then
      err "Certificate validation timed out after 10 minutes"
    fi
  done
  log "Certificate validated!"
else
  log "Certificate already validated"
fi

# =============================================================================
# STEP 5: CloudFront Origin Access Control
# =============================================================================
echo ""
echo "--- Step 5: CloudFront OAC ---"

OAC_NAME="${DOMAIN}-oac"
EXISTING_OAC=$(aws cloudfront list-origin-access-controls \
  --query "OriginAccessControlList.Items[?Name=='$OAC_NAME'].Id" \
  --output text 2>/dev/null)

if [ -n "$EXISTING_OAC" ] && [ "$EXISTING_OAC" != "None" ]; then
  OAC_ID="$EXISTING_OAC"
  log "OAC already exists: $OAC_ID"
else
  OAC_ID=$(aws cloudfront create-origin-access-control \
    --origin-access-control-config "{
      \"Name\": \"$OAC_NAME\",
      \"Description\": \"OAC for $DOMAIN\",
      \"SigningProtocol\": \"sigv4\",
      \"SigningBehavior\": \"always\",
      \"OriginAccessControlOriginType\": \"s3\"
    }" \
    --query 'OriginAccessControl.Id' \
    --output text)
  log "Created OAC: $OAC_ID"
fi

# =============================================================================
# STEP 6: CloudFront Distribution
# =============================================================================
echo ""
echo "--- Step 6: CloudFront Distribution ---"

# Check if distribution already exists for this domain
EXISTING_DIST=$(aws cloudfront list-distributions \
  --query "DistributionList.Items[?Aliases.Items[0]=='$DOMAIN'].[Id,DomainName]" \
  --output text 2>/dev/null)

if [ -n "$EXISTING_DIST" ] && [ "$EXISTING_DIST" != "None" ]; then
  CF_ID=$(echo "$EXISTING_DIST" | awk '{print $1}')
  CF_DOMAIN=$(echo "$EXISTING_DIST" | awk '{print $2}')
  log "Distribution already exists: $CF_ID ($CF_DOMAIN)"
else
  CALLER_REF="${DOMAIN}-$(date +%s)"

  DIST_OUTPUT=$(aws cloudfront create-distribution \
    --distribution-config "{
      \"CallerReference\": \"$CALLER_REF\",
      \"Aliases\": {
        \"Quantity\": 1,
        \"Items\": [\"$DOMAIN\"]
      },
      \"DefaultRootObject\": \"index.html\",
      \"Origins\": {
        \"Quantity\": 1,
        \"Items\": [{
          \"Id\": \"S3-$BUCKET\",
          \"DomainName\": \"$BUCKET.s3.$REGION.amazonaws.com\",
          \"OriginAccessControlId\": \"$OAC_ID\",
          \"S3OriginConfig\": {
            \"OriginAccessIdentity\": \"\"
          }
        }]
      },
      \"DefaultCacheBehavior\": {
        \"TargetOriginId\": \"S3-$BUCKET\",
        \"ViewerProtocolPolicy\": \"redirect-to-https\",
        \"AllowedMethods\": {
          \"Quantity\": 2,
          \"Items\": [\"GET\", \"HEAD\"]
        },
        \"CachePolicyId\": \"658327ea-f89d-4fab-a63d-7e88639e58f6\",
        \"Compress\": true
      },
      \"ViewerCertificate\": {
        \"ACMCertificateArn\": \"$CERT_ARN\",
        \"SSLSupportMethod\": \"sni-only\",
        \"MinimumProtocolVersion\": \"TLSv1.2_2021\"
      },
      \"CustomErrorResponses\": {
        \"Quantity\": 1,
        \"Items\": [{
          \"ErrorCode\": 403,
          \"ResponsePagePath\": \"/index.html\",
          \"ResponseCode\": \"200\",
          \"ErrorCachingMinTTL\": 300
        }]
      },
      \"Comment\": \"$DOMAIN static site\",
      \"Enabled\": true,
      \"HttpVersion\": \"http2and3\",
      \"IsIPV6Enabled\": true,
      \"PriceClass\": \"PriceClass_100\"
    }" \
    --query 'Distribution.[Id,DomainName]' \
    --output text)

  CF_ID=$(echo "$DIST_OUTPUT" | awk '{print $1}')
  CF_DOMAIN=$(echo "$DIST_OUTPUT" | awk '{print $2}')
  log "Created distribution: $CF_ID ($CF_DOMAIN)"
fi

# =============================================================================
# STEP 7: S3 Bucket Policy (allow CloudFront)
# =============================================================================
echo ""
echo "--- Step 7: S3 Bucket Policy ---"

aws s3api put-bucket-policy \
  --bucket "$BUCKET" \
  --policy "{
    \"Version\": \"2012-10-17\",
    \"Statement\": [{
      \"Sid\": \"AllowCloudFrontServicePrincipal\",
      \"Effect\": \"Allow\",
      \"Principal\": {
        \"Service\": \"cloudfront.amazonaws.com\"
      },
      \"Action\": \"s3:GetObject\",
      \"Resource\": \"arn:aws:s3:::$BUCKET/*\",
      \"Condition\": {
        \"StringEquals\": {
          \"AWS:SourceArn\": \"arn:aws:cloudfront::$ACCOUNT_ID:distribution/$CF_ID\"
        }
      }
    }]
  }"
log "Bucket policy set for CloudFront distribution $CF_ID"

# =============================================================================
# STEP 8: Route 53 DNS Records
# =============================================================================
echo ""
echo "--- Step 8: Route 53 DNS ---"

# CloudFront's hosted zone ID is always Z2FDTNDATAQYW2
aws route53 change-resource-record-sets \
  --hosted-zone-id "$ZONE_ID" \
  --change-batch "{
    \"Changes\": [
      {
        \"Action\": \"UPSERT\",
        \"ResourceRecordSet\": {
          \"Name\": \"$DOMAIN\",
          \"Type\": \"A\",
          \"AliasTarget\": {
            \"HostedZoneId\": \"Z2FDTNDATAQYW2\",
            \"DNSName\": \"$CF_DOMAIN\",
            \"EvaluateTargetHealth\": false
          }
        }
      },
      {
        \"Action\": \"UPSERT\",
        \"ResourceRecordSet\": {
          \"Name\": \"$DOMAIN\",
          \"Type\": \"AAAA\",
          \"AliasTarget\": {
            \"HostedZoneId\": \"Z2FDTNDATAQYW2\",
            \"DNSName\": \"$CF_DOMAIN\",
            \"EvaluateTargetHealth\": false
          }
        }
      }
    ]
  }" > /dev/null
log "DNS A and AAAA records pointed to CloudFront"

# =============================================================================
# STEP 9: Invalidate CloudFront cache
# =============================================================================
echo ""
echo "--- Step 9: CloudFront Invalidation ---"

aws cloudfront create-invalidation \
  --distribution-id "$CF_ID" \
  --paths '/*' > /dev/null
log "CloudFront cache invalidated"

# =============================================================================
# Done
# =============================================================================
echo ""
echo "========================================="
echo "  Deployment complete!"
echo "========================================="
echo ""
echo "  Domain:        https://$DOMAIN"
echo "  CloudFront:    https://$CF_DOMAIN"
echo "  Distribution:  $CF_ID"
echo "  Certificate:   $CERT_ARN"
echo "  S3 Bucket:     $BUCKET"
echo ""
echo "  DNS propagation may take 5-15 minutes."
echo "  CloudFront distribution deployment takes 5-10 minutes."
echo ""
echo "  To update the site later:"
echo "    npm run build"
echo "    aws s3 sync dist/ s3://$BUCKET --delete --exclude '*.html' --cache-control 'max-age=31536000, immutable'"
echo "    aws s3 cp dist/index.html s3://$BUCKET/index.html --content-type 'text/html; charset=utf-8' --cache-control 'max-age=300, s-maxage=86400'"
echo "    aws cloudfront create-invalidation --distribution-id $CF_ID --paths '/*'"
echo ""
