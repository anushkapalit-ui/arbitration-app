import { useState } from "react";

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
  .arb-root { font-family: 'Source Sans 3', sans-serif; color: white; max-width: 720px; margin: 0 auto; padding: 2.5rem 1.25rem; }
  .arb-header { margin-bottom: 2.5rem; }
  .arb-title { font-family: 'Libre Baskerville', serif; font-size: 2.25rem; margin-bottom: 0.6rem; }
  .arb-section { background: #111; border: 1px solid #333; border-radius: 10px; padding: 1.5rem; margin-bottom: 1.25rem; }
  .arb-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
  .arb-field.span2 { grid-column: 1 / -1; }
  .arb-label { font-size: 12px; color: #888; margin-bottom: 5px; display: block; }
  .arb-input, .arb-select, .arb-textarea { background: #222; border: 1px solid #444; color: white; padding: 0.6rem; border-radius: 7px; width: 100%; }
  .arb-textarea { min-height: 100px; }
  .arb-btn { width: 100%; padding: 0.8rem; background: transparent; border: 1px solid white; color: white; border-radius: 7px; cursor: pointer; margin-top: 1rem; }
  .arb-btn:disabled { opacity: 0.5; }
  .arb-rec-banner { background: #222; padding: 1.5rem; border-radius: 10px; margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center; border: 1px solid #333; }
  .arb-rec-pill { font-family: 'Libre Baskerville', serif; font-size: 1.5rem; padding: 5px 15px; border-radius: 100px; }
  .arb-out-card { background: #111; border: 1px solid #333; padding: 1.25rem; border-radius: 10px; margin-bottom: 1rem; }
  .arb-out-label { font-size: 10px; text-transform: uppercase; color: #888; margin-bottom: 8px; }
  .arb-out-body { line-height: 1.6; }
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

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.disputeType || form.disputeType === DISPUTE_TYPES[0]) {
      setError("Please select a dispute type."); return;
    }
    setError("");
    setLoading(true);

    const prompt = `Analyze this dispute as a lawyer. Return ONLY JSON with keys: "recommendation" (ARBITRATE/LITIGATE/SETTLE), "reasoning", "risks" (array), "timeline", "advice".
    Type: ${form.disputeType}, Value: ${form.claimValue}, Jurisdiction: ${form.jurisdiction}, Facts: ${form.keyFacts}`;

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      });

      const data = await response.json();
      const rawText = data.candidates[0].content.parts[0].text;
      const cleanJson = rawText.replace(/```json|```/g, "").trim();
      setResult(JSON.parse(cleanJson));
    } catch (err) {
      setError("Analysis failed. Please check your Gemini API key in Vercel.");
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
      </header>

      {!result ? (
        <div className="arb-section">
          <div className="arb-grid">
            <div className="arb-field"><label className="arb-label">Type</label>
              <select className="arb-select" value={form.disputeType} onChange={set("disputeType")}>{DISPUTE_TYPES.map(t => <option key={t}>{t}</option>)}</select>
            </div>
            <div className="arb-field"><label className="arb-label">Value</label>
              <input className="arb-input" type="text" value={form.claimValue} onChange={set("claimValue")} />
            </div>
            <div className="arb-field span2"><label className="arb-label">Jurisdiction</label>
              <input className="arb-input" type="text" value={form.jurisdiction} onChange={set("jurisdiction")} />
            </div>
            <div className="arb-field span2"><label className="arb-label">Facts</label>
              <textarea className="arb-textarea" value={form.keyFacts} onChange={set("keyFacts")} />
            </div>
          </div>
          {error && <div style={{color: 'red', marginTop: '10px'}}>{error}</div>}
          <button className="arb-btn" onClick={handleSubmit} disabled={loading}>{loading ? "Analysing..." : "Analyse Dispute"}</button>
        </div>
      ) : (
        <div className="arb-results">
          <div className="arb-rec-banner">
            <div><p className="arb-out-label">Recommendation</p>
              <span className="arb-rec-pill" style={{ background: recStyle.bg, color: recStyle.color }}>{recStyle.label}</span>
            </div>
            <div style={{textAlign: 'right'}}><p className="arb-out-label">Timeline</p><strong>{result.timeline}</strong></div>
          </div>
          <div className="arb-out-card"><p className="arb-out-label">Reasoning</p><p>{result.reasoning}</p></div>
          <div className="arb-out-card"><p className="arb-out-label">Risks</p><ul>{result.risks.map((r, i) => <li key={i}>{r}</li>)}</ul></div>
          <button className="arb-reset" style={{color: 'white', cursor: 'pointer', background: 'none', border: 'none', textDecoration: 'underline'}} onClick={handleReset}>← Start Over</button>
        </div>
      )}
    </div>
  );
}
