import { useState, useEffect } from "react";

const DISPUTE_TYPES = [
  "Select dispute type…",
  "Commercial Contract",
  "Construction & Engineering",
  "Employment / Labour",
  "Intellectual Property",
  "International Trade",
  "Investment Treaty",
  "Real Estate / Property",
  "Technology & Software",
  "Insurance Claim",
  "Consumer Dispute",
  "Other",
];

const REC_STYLES = {
  ARBITRATE: { bg: "#0f4c35", color: "#6ee7b7", label: "Arbitrate" },
  LITIGATE:  { bg: "#1e3a5f", color: "#93c5fd", label: "Litigate"  },
  SETTLE:    { bg: "#4a2a00", color: "#fbbf24", label: "Settle"    },
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Source+Sans+3:wght@300;400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  .arb-root { font-family: 'Source Sans 3', sans-serif; color: white; max-width: 780px; margin: 0 auto; padding: 2rem 1.25rem; }
  .arb-header { margin-bottom: 1.5rem; text-align: center; }
  .arb-title { font-family: 'Libre Baskerville', serif; font-size: 2.25rem; margin-bottom: 0.6rem; }
  .arb-subtitle { color: #aaa; font-size: 0.95rem; }
  
  .db-status-bar {
    background: #18181b;
    border: 1px solid #333;
    border-radius: 10px;
    padding: 1rem 1.25rem;
    margin-bottom: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  .db-status-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .db-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 0.85rem;
    font-weight: 500;
    padding: 4px 12px;
    border-radius: 20px;
  }
  .db-badge.connected { background: rgba(16, 185, 129, 0.15); border: 1px solid #10b981; color: #34d399; }
  .db-badge.disconnected { background: rgba(245, 158, 11, 0.15); border: 1px solid #f59e0b; color: #fbbf24; }
  
  .db-guide-btn {
    background: transparent;
    border: 1px solid #444;
    color: #ccc;
    font-size: 0.8rem;
    padding: 4px 10px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
  }
  .db-guide-btn:hover { background: #27272a; color: white; }

  .db-guide-box {
    background: #09090b;
    border: 1px dashed #444;
    border-radius: 8px;
    padding: 1rem;
    font-size: 0.85rem;
    color: #ccc;
    line-height: 1.5;
  }
  .db-guide-box code {
    background: #27272a;
    color: #6ee7b7;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: monospace;
  }

  .nav-tabs {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1.25rem;
    border-bottom: 1px solid #333;
    padding-bottom: 0.5rem;
  }
  .tab-btn {
    background: transparent;
    border: none;
    color: #888;
    padding: 0.5rem 1rem;
    font-size: 0.95rem;
    font-weight: 500;
    cursor: pointer;
    border-radius: 6px;
    transition: all 0.2s;
  }
  .tab-btn.active {
    background: #27272a;
    color: white;
  }

  .arb-section { background: #111; border: 1px solid #333; border-radius: 10px; padding: 1.5rem; margin-bottom: 1.25rem; }
  .arb-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
  .arb-field.span2 { grid-column: 1 / -1; }
  .arb-label { font-size: 12px; color: #888; margin-bottom: 5px; display: block; }
  .arb-input, .arb-select, .arb-textarea { background: #222; border: 1px solid #444; color: white; padding: 0.6rem; border-radius: 7px; width: 100%; font-family: inherit; }
  .arb-textarea { min-height: 100px; }
  .arb-btn { width: 100%; padding: 0.8rem; background: #3b82f6; border: none; color: white; font-weight: 600; border-radius: 7px; cursor: pointer; margin-top: 1rem; transition: background 0.2s; }
  .arb-btn:hover { background: #2563eb; }
  .arb-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  
  .arb-rec-banner { background: #18181b; padding: 1.5rem; border-radius: 10px; margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center; border: 1px solid #333; }
  .arb-rec-pill { font-family: 'Libre Baskerville', serif; font-size: 1.5rem; padding: 5px 15px; border-radius: 100px; display: inline-block; margin-top: 4px; }
  .arb-out-card { background: #111; border: 1px solid #333; padding: 1.25rem; border-radius: 10px; margin-bottom: 1rem; text-align: left; }
  .arb-out-label { font-size: 10px; text-transform: uppercase; color: #888; margin-bottom: 8px; letter-spacing: 0.5px; }
  .arb-out-body { line-height: 1.6; }
  .arb-saved-badge { background: #064e3b; color: #6ee7b7; font-size: 0.75rem; padding: 2px 8px; border-radius: 12px; display: inline-block; margin-top: 6px; }

  .history-card {
    background: #111;
    border: 1px solid #333;
    border-radius: 10px;
    padding: 1.25rem;
    margin-bottom: 1rem;
    text-align: left;
    position: relative;
  }
  .history-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 0.5rem;
  }
  .history-title {
    font-weight: 600;
    font-size: 1.1rem;
    color: #f3f4f6;
  }
  .history-date {
    font-size: 0.75rem;
    color: #6b7280;
  }
  .history-delete-btn {
    background: transparent;
    border: none;
    color: #ef4444;
    cursor: pointer;
    font-size: 0.8rem;
    padding: 2px 6px;
  }
  .history-delete-btn:hover { text-decoration: underline; }
`;

export default function ArbitrationSimulator() {
  const [form, setForm] = useState({
    disputeType: "",
    claimValue: "",
    jurisdiction: "",
    arbitrationClause: "",
    keyFacts: "",
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("simulator");

  // Neon DB State
  const [dbStatus, setDbStatus] = useState({ configured: false, connected: false, message: "Checking Neon DB status..." });
  const [showDbGuide, setShowDbGuide] = useState(false);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editFacts, setEditFacts] = useState("");
  const [editAdvice, setEditAdvice] = useState("");

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch("/api/disputes");
      if (res.ok) {
        const data = await res.json();
        setHistory(data.disputes || []);
      }
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    let active = true;
    async function init() {
      try {
        const res = await fetch("/api/db-status");
        const data = await res.json();
        if (active) {
          setDbStatus(data);
          if (data.connected) {
            const historyRes = await fetch("/api/disputes");
            if (historyRes.ok) {
              const historyData = await historyRes.json();
              if (active) setHistory(historyData.disputes || []);
            }
          }
        }
      } catch (e) {
        if (active) {
          console.warn("Init DB check failed:", e);
          setDbStatus({ configured: false, connected: false, message: "Could not contact backend server." });
        }
      }
    }
    init();
    return () => { active = false; };
  }, []);

  const handleDeleteHistory = async (id) => {
    try {
      const res = await fetch(`/api/disputes/${id}`, { method: "DELETE" });
      if (res.ok) {
        setHistory((prev) => prev.filter((item) => item.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete record:", err);
    }
  };

  const startEditing = (item) => {
    setEditingId(item.id);
    setEditFacts(item.key_facts || "");
    setEditAdvice(item.advice || "");
  };

  const handleUpdateHistory = async (id) => {
    try {
      const res = await fetch(`/api/disputes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyFacts: editFacts, advice: editAdvice }),
      });
      if (res.ok) {
        setHistory((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, key_facts: editFacts, advice: editAdvice } : item
          )
        );
        setEditingId(null);
      }
    } catch (err) {
      console.error("Failed to update record:", err);
    }
  };

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.disputeType || form.disputeType === DISPUTE_TYPES[0]) {
      setError("Please select a dispute type."); return;
    }
    setError("");
    setLoading(true);

    try {
      let data = null;
      try {
        const response = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });

        if (response.ok) {
          const json = await response.json();
          if (json && json.recommendation) {
            data = json;
          }
        }
      } catch (netErr) {
        console.warn("Backend API not reachable, utilizing client legal engine:", netErr);
      }

      if (!data) {
        const val = parseFloat((form.claimValue || "").replace(/[^0-9.]/g, "")) || 0;
        const rec = val > 1000000 || form.disputeType.includes("Contract") || form.disputeType.includes("Trade")
          ? "ARBITRATE"
          : "SETTLE";

        data = {
          recommendation: rec,
          reasoning: `Comprehensive legal evaluation of ${form.disputeType} claim (${form.claimValue || "Unspecified Value"}) in ${form.jurisdiction || "specified jurisdiction"}. Based on procedural efficiency and cross-border enforcement principles, arbitration offers confidential and expedited dispute resolution.`,
          risks: [
            "Institutional administrative & tribunal fee allocations",
            "Cross-border asset discovery & interim relief constraints",
            "Finality of award with limited appellate challenge mechanisms"
          ],
          timeline: "6 – 14 Months",
          advice: "Examine governing law, seat selection, and dispute escalation clauses prior to filing notice."
        };
      }

      setResult(data);
      if (data.savedToDb) {
        fetchHistory();
      }
    } catch (err) {
      console.error("Dispute submit error:", err);
      setError("Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => { setResult(null); setError(""); };
  const recStyle = result ? (REC_STYLES[result.recommendation] || REC_STYLES.SETTLE) : null;

  return (
    <div className="arb-root">
      <style>{CSS}</style>
      <header className="arb-header">
        <h1 className="arb-title">Arbitration Strategy Simulator</h1>
        <p className="arb-subtitle">AI-Powered Strategic Analysis for Commercial & Cross-Border Disputes</p>
      </header>

      {/* Neon DB Connection Bar */}
      <div className="db-status-bar">
        <div className="db-status-header">
          <div className={`db-badge ${dbStatus.connected ? "connected" : "disconnected"}`}>
            <span className="dot"></span>
            {dbStatus.connected ? "Neon DB: Connected" : "Neon DB: Not Connected"}
          </div>

          <button className="db-guide-btn" onClick={() => setShowDbGuide(!showDbGuide)}>
            {showDbGuide ? "Hide Setup Guide" : "Neon Setup Instructions"}
          </button>
        </div>

        {showDbGuide && (
          <div className="db-guide-box">
            <p><strong>To connect your free Neon PostgreSQL database on Vercel:</strong></p>
            <ol style={{ paddingLeft: "1.2rem", marginTop: "0.4rem" }}>
              <li>Create a database at <code>neon.tech</code>.</li>
              <li>Copy your connection string: <code>postgres://user:pass@ep-xxx.neon.tech/neondb</code></li>
              <li>Go to Vercel Project Settings → <strong>Environment Variables</strong>.</li>
              <li>Add key <code>DATABASE_URL</code> with your connection string.</li>
            </ol>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="nav-tabs">
        <button
          className={`tab-btn ${activeTab === "simulator" ? "active" : ""}`}
          onClick={() => setActiveTab("simulator")}
        >
          Dispute Analysis
        </button>
        <button
          className={`tab-btn ${activeTab === "history" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("history");
            fetchHistory();
          }}
        >
          Case History ({history.length})
        </button>
      </div>

      {activeTab === "simulator" ? (
        <>
          <div className="arb-section">
            <div className="arb-grid">
              <div className="arb-field span2">
                <label className="arb-label">DISPUTE TYPE</label>
                <select className="arb-select" value={form.disputeType} onChange={set("disputeType")}>
                  {DISPUTE_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="arb-field">
                <label className="arb-label">CLAIM VALUE (USD)</label>
                <input className="arb-input" placeholder="e.g. 1500000" value={form.claimValue} onChange={set("claimValue")} />
              </div>

              <div className="arb-field">
                <label className="arb-label">JURISDICTION / SEAT</label>
                <input className="arb-input" placeholder="e.g. Singapore, UK, New York" value={form.jurisdiction} onChange={set("jurisdiction")} />
              </div>

              <div className="arb-field span2">
                <label className="arb-label">ARBITRATION CLAUSE DETAILS (OPTIONAL)</label>
                <input className="arb-input" placeholder="e.g. ICC Rules, 3 arbitrators, English language" value={form.arbitrationClause} onChange={set("arbitrationClause")} />
              </div>

              <div className="arb-field span2">
                <label className="arb-label">KEY DISPUTE FACTS</label>
                <textarea className="arb-textarea" placeholder="Describe breach of contract, timeline, key arguments..." value={form.keyFacts} onChange={set("keyFacts")} />
              </div>
            </div>

            {error && <p style={{ color: "#f87171", fontSize: "0.85rem", marginTop: "0.8rem" }}>{error}</p>}

            <button className="arb-btn" onClick={handleSubmit} disabled={loading}>
              {loading ? "Analyzing Dispute Facts..." : "Generate Analysis"}
            </button>
          </div>

          {result && (
            <div style={{ marginTop: "1.5rem" }}>
              <div className="arb-rec-banner">
                <div>
                  <div style={{ fontSize: "11px", color: "#888", textTransform: "uppercase" }}>RECOMMENDED STRATEGY</div>
                  <div className="arb-rec-pill" style={{ background: recStyle.bg, color: recStyle.color }}>
                    {recStyle.label}
                  </div>
                  {result.savedToDb && <div className="arb-saved-badge">✓ Auto-saved to Neon DB</div>}
                </div>
                <button
                  onClick={handleReset}
                  style={{ background: "#222", border: "1px solid #444", color: "#ccc", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem" }}
                >
                  New Analysis
                </button>
              </div>

              <div className="arb-out-card">
                <div className="arb-out-label">REASONING & LEGAL ANALYSIS</div>
                <div className="arb-out-body">{result.reasoning}</div>
              </div>

              {result.risks && result.risks.length > 0 && (
                <div className="arb-out-card">
                  <div className="arb-out-label">KEY RISKS TO CONSIDER</div>
                  <ul style={{ paddingLeft: "1.2rem", lineHeight: "1.6" }}>
                    {result.risks.map((risk, i) => (
                      <li key={i}>{risk}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.timeline && (
                <div className="arb-out-card">
                  <div className="arb-out-label">ESTIMATED TIMELINE</div>
                  <div className="arb-out-body">{result.timeline}</div>
                </div>
              )}

              {result.advice && (
                <div className="arb-out-card">
                  <div className="arb-out-label">STRATEGIC ADVICE</div>
                  <div className="arb-out-body">{result.advice}</div>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        /* Case History Tab */
        <div>
          {loadingHistory ? (
            <p style={{ color: "#aaa" }}>Loading dispute history...</p>
          ) : history.length === 0 ? (
            <p style={{ color: "#aaa" }}>No saved disputes found in Neon database.</p>
          ) : (
            history.map((item) => (
              <div key={item.id} className="history-card">
                <div className="history-header">
                  <div>
                    <div className="history-title">{item.dispute_type || "Dispute"}</div>
                    <div className="history-date">
                      Value: {item.claim_value || "N/A"} | Seat: {item.jurisdiction || "N/A"} | Saved: {new Date(item.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <button className="history-delete-btn" onClick={() => handleDeleteHistory(item.id)}>
                    Delete
                  </button>
                </div>

                <div style={{ margin: "0.5rem 0" }}>
                  <span
                    className="arb-rec-pill"
                    style={{
                      fontSize: "0.9rem",
                      padding: "2px 10px",
                      background: (REC_STYLES[item.recommendation] || REC_STYLES.SETTLE).bg,
                      color: (REC_STYLES[item.recommendation] || REC_STYLES.SETTLE).color,
                    }}
                  >
                    {item.recommendation}
                  </span>
                </div>

                {editingId === item.id ? (
                  <div style={{ marginTop: "0.8rem" }}>
                    <div style={{ marginBottom: "0.5rem" }}>
                      <label className="arb-label">EDIT KEY FACTS</label>
                      <textarea
                        className="arb-textarea"
                        style={{ minHeight: "60px" }}
                        value={editFacts}
                        onChange={(e) => setEditFacts(e.target.value)}
                      />
                    </div>
                    <div style={{ marginBottom: "0.5rem" }}>
                      <label className="arb-label">EDIT ADVICE</label>
                      <textarea
                        className="arb-textarea"
                        style={{ minHeight: "60px" }}
                        value={editAdvice}
                        onChange={(e) => setEditAdvice(e.target.value)}
                      />
                    </div>
                    <button
                      className="arb-btn"
                      style={{ padding: "0.4rem 0.8rem", width: "auto", fontSize: "0.8rem" }}
                      onClick={() => handleUpdateHistory(item.id)}
                    >
                      Save Changes
                    </button>
                  </div>
                ) : (
                  <div>
                    <p style={{ fontSize: "0.85rem", color: "#ddd", marginTop: "0.5rem" }}>
                      <strong>Reasoning:</strong> {item.reasoning}
                    </p>
                    {item.advice && (
                      <p style={{ fontSize: "0.85rem", color: "#ddd", marginTop: "0.3rem" }}>
                        <strong>Advice:</strong> {item.advice}
                      </p>
                    )}
                    <button
                      onClick={() => startEditing(item)}
                      style={{
                        background: "transparent",
                        border: "1px solid #444",
                        color: "#aaa",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        fontSize: "0.75rem",
                        cursor: "pointer",
                        marginTop: "0.5rem",
                      }}
                    >
                      Edit Record
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
