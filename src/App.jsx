import { useState, useEffect, useRef } from "react";

const C = {
  bg: "#06090F",
  bgSurface: "#0C1018",
  bgCard: "#111827",
  text: "#E8ECF1",
  textSoft: "#94A3B8",
  textMuted: "#475569",
  accent: "#4ECDC4",
  accentDim: "rgba(78,205,196,0.1)",
  accentBorder: "rgba(78,205,196,0.25)",
  purple: "#A78BFA",
  amber: "#FBBF24",
  coral: "#FB7185",
  green: "#34D399",
  border: "rgba(255,255,255,0.06)",
  borderLight: "rgba(255,255,255,0.1)",
};

const font = {
  display: "'Instrument Serif', 'Playfair Display', Georgia, serif",
  body: "'DM Sans', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

function useInView(threshold = 0.12) {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) setVis(true);
    }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, vis];
}

function Reveal({ children, delay = 0, style = {} }) {
  const [ref, vis] = useInView(0.08);
  return (
    <div ref={ref} style={{
      opacity: vis ? 1 : 0,
      transform: vis ? "translateY(0)" : "translateY(20px)",
      transition: `opacity 0.6s ease ${delay}s, transform 0.6s ease ${delay}s`,
      ...style,
    }}>
      {children}
    </div>
  );
}

// ============ NAV ============
function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);
  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      padding: "0 clamp(16px, 4vw, 40px)", height: 56,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      background: scrolled ? "rgba(6,9,15,0.88)" : "transparent",
      backdropFilter: scrolled ? "blur(20px)" : "none",
      borderBottom: scrolled ? `1px solid ${C.border}` : "1px solid transparent",
      transition: "all 0.3s",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 26, height: 26, borderRadius: 6,
          background: `linear-gradient(135deg, ${C.accent}, #2AA89A)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: font.mono, fontSize: 12, fontWeight: 700, color: C.bg,
        }}>V</div>
        <span style={{ fontFamily: font.mono, fontSize: 14, fontWeight: 600, color: C.text, letterSpacing: "-0.02em" }}>
          VanaMD
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        <a href="https://github.com/rathbunmatt/vanamd-dev" target="_blank" rel="noopener noreferrer" style={{
          color: C.textSoft, fontSize: 13, textDecoration: "none",
          fontFamily: font.body, cursor: "pointer",
        }}>GitHub</a>
        <a href="#direction" style={{
          color: C.textSoft, fontSize: 13, textDecoration: "none",
          fontFamily: font.body, cursor: "pointer",
        }}>Direction</a>
        <a href="#follow" style={{
          color: C.accent, fontSize: 13, textDecoration: "none",
          fontFamily: font.body, cursor: "pointer", fontWeight: 500,
        }}>Follow the Build</a>
      </div>
    </nav>
  );
}

// ============ HERO ============
function Hero() {
  return (
    <section style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "120px 24px 80px", textAlign: "center",
      position: "relative", overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", top: "-20%", left: "50%", transform: "translateX(-50%)",
        width: "120vw", height: "80vh",
        background: `radial-gradient(ellipse at center, rgba(78,205,196,0.05) 0%, transparent 60%)`,
        pointerEvents: "none",
      }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 680 }}>
        <Reveal>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "5px 14px", borderRadius: 20,
            border: `1px solid ${C.accentBorder}`, background: C.accentDim,
            marginBottom: 32, fontSize: 12, fontFamily: font.mono,
            color: C.accent, letterSpacing: "0.02em",
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.accent }} />
            Building in the open
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <h1 style={{
            fontFamily: font.display,
            fontSize: "clamp(36px, 5.5vw, 60px)", fontWeight: 400,
            color: C.text, lineHeight: 1.1, letterSpacing: "-0.03em",
            margin: "0 0 24px",
          }}>
            Git solved knowledge management{" "}
            <span style={{ color: C.textSoft }}>for code.</span><br />
            We're building it{" "}
            <span style={{ color: C.accent }}>for everything else.</span>
          </h1>
        </Reveal>

        <Reveal delay={0.14}>
          <p style={{
            fontFamily: font.body, fontSize: "clamp(16px, 2vw, 18px)",
            color: C.textSoft, lineHeight: 1.65, maxWidth: 540,
            margin: "0 auto 40px",
          }}>
            VanaMD is a collaborative knowledge base backed by Git versioning
            and Markdown — a format humans can write and AI can read without conversion.
            We're early. Here's where we are.
          </p>
        </Reveal>

        <Reveal delay={0.2}>
          <a href="#thesis" style={{
            fontFamily: font.body, fontSize: 14, color: C.textSoft,
            textDecoration: "none", borderBottom: `1px solid ${C.borderLight}`,
            paddingBottom: 2,
          }}>
            Read the thesis ↓
          </a>
        </Reveal>
      </div>
    </section>
  );
}

// ============ THESIS ============
function Thesis() {
  return (
    <section id="thesis" style={{
      padding: "80px 24px 100px", maxWidth: 720, margin: "0 auto",
    }}>
      <Reveal>
        <p style={{
          fontFamily: font.mono, fontSize: 11, color: C.accent,
          letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14,
        }}>The thesis</p>
      </Reveal>

      <Reveal delay={0.05}>
        <h2 style={{
          fontFamily: font.display,
          fontSize: "clamp(24px, 3.5vw, 34px)", fontWeight: 400,
          color: C.text, lineHeight: 1.3, letterSpacing: "-0.02em",
          margin: "0 0 28px",
        }}>
          What if the rest of your organization's knowledge had the same discipline Git gives code?
        </h2>
      </Reveal>

      <div style={{
        fontFamily: font.body, fontSize: 15, color: C.textSoft,
        lineHeight: 1.8, display: "flex", flexDirection: "column", gap: 20,
      }}>
        <Reveal delay={0.1}>
          <p>
            Git repositories are the best-designed knowledge management system in
            existence. Versioning, ownership, review workflows, structured format,
            full history. The reason engineers don't spend hours searching for information
            is that Git imposed a discipline wikis and shared drives never did.
          </p>
        </Reveal>
        <Reveal delay={0.14}>
          <p>
            Meanwhile, organizational knowledge — policies, processes, runbooks,
            institutional wisdom — lives across a dozen tools in proprietary formats.
            That was tolerable when only humans needed to read it. Humans can infer,
            navigate ambiguity, fill gaps with tribal knowledge.
          </p>
        </Reveal>
        <Reveal delay={0.18}>
          <p>
            AI can't. It processes exactly what it's given. And what it's given,
            in most organizations, is fragmented, contradictory, and locked in
            formats that require lossy conversion before an LLM can read a word of it.
          </p>
        </Reveal>
        <Reveal delay={0.22}>
          <p style={{ color: C.text }}>
            VanaMD brings Git's discipline to the rest of the organization's knowledge.
            A collaborative editor non-technical people can use. Markdown in Git underneath
            so it's natively readable by AI. Compliance tracking for regulated industries.
            The format is the interface — agents read the files directly, the same way
            they read code.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

// ============ WHAT WE'RE BUILDING ============
function WhatWereBuilding() {
  const layers = [
    {
      label: "Write",
      title: "Collaborative editor",
      desc: "Rich editing with real-time collaboration. Writers never see Git or Markdown.",
      status: "Building on Outline (51K GitHub stars)",
      color: C.accent,
    },
    {
      label: "Version",
      title: "Git-backed versioning",
      desc: "Every change tracked, attributable, reversible. True branching and merging on knowledge.",
      status: "Bidirectional sync engine working",
      color: C.purple,
    },
    {
      label: "Discover",
      title: "Knowledge health",
      desc: "Staleness detection, gap analysis, contradiction flagging. AI-assisted, human-validated.",
      status: "Health scoring and link analysis live",
      color: C.amber,
    },
    {
      label: "Comply",
      title: "Compliance tracking",
      desc: "Attestation, audit trails, policy lifecycle. For healthcare, financial services, government.",
      status: "Frontmatter schema and CLI built",
      color: C.green,
    },
    {
      label: "Connect",
      title: "AI reads it directly",
      desc: "Every document is clean Markdown. An auto-generated llms.txt tells agents what's available. The format is the interface.",
      status: "llms.txt generation and compliance CLI working",
      color: C.coral,
    },
  ];

  return (
    <section style={{ padding: "0 24px 100px", maxWidth: 720, margin: "0 auto" }}>
      <Reveal>
        <p style={{
          fontFamily: font.mono, fontSize: 11, color: C.accent,
          letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14,
        }}>What we're building</p>
      </Reveal>
      <Reveal delay={0.05}>
        <h2 style={{
          fontFamily: font.display,
          fontSize: "clamp(24px, 3.5vw, 34px)", fontWeight: 400,
          color: C.text, lineHeight: 1.3, letterSpacing: "-0.02em",
          margin: "0 0 36px",
        }}>
          Five layers. One knowledge base.
        </h2>
      </Reveal>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {layers.map((l, i) => (
          <Reveal key={i} delay={0.08 + i * 0.05}>
            <div style={{
              background: C.bgSurface, borderRadius: 10, padding: "20px 24px",
              border: `1px solid ${C.border}`,
              display: "grid", gridTemplateColumns: "1fr auto", gap: 16,
              alignItems: "start",
            }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <span style={{
                    fontFamily: font.mono, fontSize: 9, color: l.color,
                    letterSpacing: "0.06em", fontWeight: 600, textTransform: "uppercase",
                  }}>{l.label}</span>
                  <span style={{
                    fontFamily: font.body, fontSize: 15, fontWeight: 500, color: C.text,
                  }}>{l.title}</span>
                </div>
                <p style={{
                  fontFamily: font.body, fontSize: 13, color: C.textSoft, lineHeight: 1.5,
                }}>{l.desc}</p>
              </div>
              <div style={{
                fontFamily: font.mono, fontSize: 10, color: C.textMuted,
                textAlign: "right", lineHeight: 1.5, maxWidth: 180,
                paddingTop: 4,
              }}>
                {l.status}
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

// ============ DIRECTION ============
function Direction() {
  return (
    <section id="direction" style={{ padding: "0 24px 100px", maxWidth: 720, margin: "0 auto" }}>
      <Reveal>
        <p style={{
          fontFamily: font.mono, fontSize: 11, color: C.accent,
          letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14,
        }}>Direction</p>
      </Reveal>
      <Reveal delay={0.05}>
        <h2 style={{
          fontFamily: font.display,
          fontSize: "clamp(24px, 3.5vw, 34px)", fontWeight: 400,
          color: C.text, lineHeight: 1.3, letterSpacing: "-0.02em",
          margin: "0 0 36px",
        }}>
          Where this is headed
        </h2>
      </Reveal>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {[
          {
            phase: "Now",
            title: "Foundation",
            items: [
              "Open-source core editor",
              "Git sync engine",
              "Knowledge health scoring",
              "Compliance metadata",
              "llms.txt for AI discovery",
            ],
            accent: C.accent,
            active: true,
          },
          {
            phase: "Next",
            title: "Team features",
            items: [
              "SSO & team management",
              "Import from existing wikis",
              "AI-powered discovery",
              "Review workflows",
              "Hosted SaaS option",
            ],
            accent: C.purple,
            active: false,
          },
          {
            phase: "Later",
            title: "Enterprise",
            items: [
              "Attestation tracking",
              "Audit trail export",
              "Explication assistant",
              "Knowledge graph",
              "Advanced access controls",
            ],
            accent: C.amber,
            active: false,
          },
        ].map((p, i) => (
          <Reveal key={i} delay={0.08 + i * 0.06}>
            <div style={{
              background: C.bgSurface, borderRadius: 12, padding: "24px 20px",
              border: `1px solid ${p.active ? C.accentBorder : C.border}`,
              height: "100%", position: "relative", overflow: "hidden",
            }}>
              {p.active && <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: 2,
                background: p.accent,
              }} />}
              <span style={{
                fontFamily: font.mono, fontSize: 10, color: p.accent,
                letterSpacing: "0.06em", fontWeight: 600, textTransform: "uppercase",
              }}>{p.phase}</span>
              <h3 style={{
                fontFamily: font.body, fontSize: 16, fontWeight: 600,
                color: C.text, margin: "10px 0 14px",
              }}>{p.title}</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {p.items.map((item, j) => (
                  <div key={j} style={{
                    display: "flex", alignItems: "center", gap: 8,
                  }}>
                    <div style={{
                      width: 5, height: 5, borderRadius: "50%",
                      background: p.active ? p.accent : C.textMuted,
                      flexShrink: 0, opacity: p.active ? 1 : 0.5,
                    }} />
                    <span style={{
                      fontFamily: font.body, fontSize: 13,
                      color: p.active ? C.textSoft : C.textMuted,
                    }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

// ============ PRODUCT PREVIEW ============
function ProductPreview() {
  return (
    <section style={{ padding: "0 24px 100px", maxWidth: 880, margin: "0 auto" }}>
      <Reveal>
        <p style={{
          fontFamily: font.mono, fontSize: 11, color: C.accent,
          letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14,
          textAlign: "center",
        }}>How it works</p>
      </Reveal>
      <Reveal delay={0.05}>
        <h2 style={{
          fontFamily: font.display,
          fontSize: "clamp(24px, 3.5vw, 34px)", fontWeight: 400,
          color: C.text, lineHeight: 1.3, letterSpacing: "-0.02em",
          margin: "0 0 40px", textAlign: "center",
        }}>
          Collaborative editing on the surface. Git underneath.
        </h2>
      </Reveal>

      <Reveal delay={0.1}>
        <div style={{
          background: C.bgSurface, borderRadius: 16,
          border: `1px solid ${C.border}`, overflow: "hidden",
          boxShadow: "0 24px 80px rgba(0,0,0,0.4)",
        }}>
          {/* Window chrome */}
          <div style={{
            padding: "10px 16px", borderBottom: `1px solid ${C.border}`,
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <div style={{ display: "flex", gap: 6 }}>
              {["#FF5F57", "#FEBC2E", "#28C840"].map(c => (
                <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />
              ))}
            </div>
            <div style={{
              flex: 1, margin: "0 48px", padding: "4px 12px",
              background: "rgba(255,255,255,0.04)", borderRadius: 6,
              fontFamily: font.mono, fontSize: 11, color: C.textMuted, textAlign: "center",
            }}>
              app.vanamd.com
            </div>
          </div>

          {/* Mock layout */}
          <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", minHeight: 320 }}>
            {/* Sidebar */}
            <div style={{ borderRight: `1px solid ${C.border}`, padding: "16px 0" }}>
              <div style={{ padding: "0 12px 12px", fontFamily: font.mono, fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Collections
              </div>
              {[
                { name: "Engineering", active: true, children: ["Runbooks", "Architecture", "Onboarding"] },
                { name: "Policies", active: false, children: [] },
                { name: "Product", active: false, children: [] },
              ].map((item, i) => (
                <div key={i}>
                  <div style={{
                    padding: "7px 12px", display: "flex", alignItems: "center", gap: 8,
                    background: item.active ? "rgba(78,205,196,0.06)" : "transparent",
                    borderRight: item.active ? `2px solid ${C.accent}` : "2px solid transparent",
                  }}>
                    <span style={{ fontFamily: font.body, fontSize: 13, color: item.active ? C.text : C.textSoft }}>
                      {item.name}
                    </span>
                  </div>
                  {item.active && item.children.map((ch, j) => (
                    <div key={j} style={{
                      padding: "5px 12px 5px 28px",
                      fontFamily: font.body, fontSize: 12, color: j === 0 ? C.accent : C.textMuted,
                    }}>
                      {ch}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Editor */}
            <div style={{ padding: "28px 36px" }}>
              <div style={{ marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontFamily: font.mono, fontSize: 9, color: C.green, background: "rgba(52,211,153,0.12)", padding: "2px 8px", borderRadius: 4 }}>
                  PUBLISHED
                </span>
                <span style={{ fontFamily: font.mono, fontSize: 9, color: C.textMuted }}>
                  Last edited 2 hours ago by jane.smith
                </span>
              </div>
              <h2 style={{
                fontFamily: font.display, fontSize: 26, fontWeight: 400,
                color: C.text, margin: "12px 0 16px", letterSpacing: "-0.01em",
              }}>
                Incident Response Procedure
              </h2>
              <div style={{ fontFamily: font.body, fontSize: 14, color: C.textSoft, lineHeight: 1.8 }}>
                <p style={{ marginBottom: 12 }}>
                  <span style={{ color: C.text, fontWeight: 500 }}>1. Detection & Triage</span> — When an alert fires,
                  the on-call engineer assesses severity using the
                  <span style={{ color: C.accent }}> severity matrix</span>.
                </p>
                <p style={{ marginBottom: 12 }}>
                  <span style={{ color: C.text, fontWeight: 500 }}>2. Escalation</span> — For SEV-1 incidents, page the
                  incident commander and open a bridge call...
                </p>
              </div>
              <span style={{
                display: "inline-block", width: 2, height: 18,
                background: C.accent, borderRadius: 1,
                animation: "blink 1s step-end infinite",
              }} />
            </div>
          </div>
        </div>
      </Reveal>

      {/* What's underneath */}
      <Reveal delay={0.2}>
        <div style={{
          marginTop: 24, padding: "20px 24px", borderRadius: 10,
          background: C.bgSurface, border: `1px solid ${C.border}`,
          fontFamily: font.mono, fontSize: 12, color: C.textMuted,
          lineHeight: 1.8,
        }}>
          <span style={{ color: C.textSoft }}>$ git log --oneline</span><br />
          <span style={{ color: C.accent }}>a3f2c1d</span> Update incident-response-procedure.md (jane.smith)<br />
          <span style={{ color: C.accent }}>8e1b4a7</span> Add escalation contact list (mike.chen)<br />
          <span style={{ color: C.accent }}>c5d9f3e</span> Create severity matrix (jane.smith)<br />
          <br />
          <span style={{ color: C.textSoft }}>$ cat llms.txt</span><br />
          # VanaMD Knowledge Base<br />
          <span style={{ color: C.textSoft }}># Auto-generated index for AI agents</span><br />
          <br />
          engineering/runbooks/incident-response.md: Incident Response Procedure<br />
          engineering/runbooks/severity-matrix.md: Severity Classification Matrix<br />
          engineering/architecture/service-map.md: Service Dependency Map<br />
        </div>
      </Reveal>

      <style>{`@keyframes blink { 50% { opacity: 0; } }`}</style>
    </section>
  );
}

// ============ CTA ============
function FollowTheBuild() {
  return (
    <section id="follow" style={{
      padding: "60px 24px 100px", maxWidth: 540, margin: "0 auto", textAlign: "center",
    }}>
      <Reveal>
        <h2 style={{
          fontFamily: font.display,
          fontSize: "clamp(24px, 3.5vw, 34px)", fontWeight: 400,
          color: C.text, lineHeight: 1.3, letterSpacing: "-0.02em",
          margin: "0 0 12px",
        }}>
          Follow the build
        </h2>
      </Reveal>
      <Reveal delay={0.06}>
        <p style={{
          fontFamily: font.body, fontSize: 15, color: C.textSoft,
          lineHeight: 1.65, maxWidth: 420, margin: "0 auto 32px",
        }}>
          We're building VanaMD in the open. Get occasional updates on
          progress, architecture decisions, and what we're learning.
        </p>
      </Reveal>
      <Reveal delay={0.12}>
        <div style={{
          display: "flex", gap: 0, justifyContent: "center",
          maxWidth: 380, margin: "0 auto 40px",
        }}>
          <input
            type="email"
            placeholder="you@company.com"
            style={{
              flex: 1, padding: "12px 16px",
              background: C.bgSurface, border: `1px solid ${C.border}`,
              borderRight: "none", borderRadius: "8px 0 0 8px",
              color: C.text, fontFamily: font.body, fontSize: 14, outline: "none",
            }}
          />
          <button style={{
            background: C.accent, color: C.bg, border: "none",
            padding: "12px 20px", borderRadius: "0 8px 8px 0",
            fontSize: 14, fontWeight: 600, fontFamily: font.body, cursor: "pointer",
          }}>Subscribe</button>
        </div>
      </Reveal>

      <Reveal delay={0.18}>
        <div style={{
          display: "flex", gap: 24, justifyContent: "center", flexWrap: "wrap",
        }}>
          {[
            { label: "GitHub", href: "https://github.com/rathbunmatt/vanamd-dev" },
            { label: "Read the thesis", href: "https://knowledge-substrate.com" },
            { label: "Contact", href: "mailto:matt.rathbun@gmail.com" },
          ].map(l => (
            <a key={l.label} href={l.href} target={l.href.startsWith("http") ? "_blank" : undefined} rel={l.href.startsWith("http") ? "noopener noreferrer" : undefined} style={{
              fontFamily: font.body, fontSize: 13, color: C.textMuted,
              textDecoration: "none", borderBottom: `1px solid ${C.border}`,
              paddingBottom: 2,
            }}>{l.label}</a>
          ))}
        </div>
      </Reveal>
    </section>
  );
}

// ============ FOOTER ============
function Footer() {
  return (
    <footer style={{
      padding: "24px", borderTop: `1px solid ${C.border}`,
      textAlign: "center",
    }}>
      <p style={{ fontFamily: font.mono, fontSize: 11, color: C.textMuted }}>
        VanaMD · Knowledge management built on Git for the AI era
      </p>
      <p style={{ fontFamily: font.mono, fontSize: 10, color: C.textMuted, marginTop: 6, opacity: 0.5 }}>
        Matt Rathbun · 2026
      </p>
    </footer>
  );
}

// ============ APP ============
export default function VanaMDSite() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body { background: ${C.bg}; color: ${C.text}; -webkit-font-smoothing: antialiased; }
        ::selection { background: ${C.accentDim}; color: ${C.accent}; }
        input::placeholder { color: ${C.textMuted}; }
        @media (max-width: 640px) {
          section [style*="grid-template-columns: repeat(3"] { grid-template-columns: 1fr !important; }
          section [style*="grid-template-columns: 200px"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <div style={{ minHeight: "100vh", background: C.bg, overflowX: "hidden" }}>
        <Nav />
        <Hero />
        <Thesis />
        <WhatWereBuilding />
        <ProductPreview />
        <Direction />
        <FollowTheBuild />
        <Footer />
      </div>
    </>
  );
}
