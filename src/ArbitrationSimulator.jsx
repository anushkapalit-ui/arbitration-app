// ================================================================
// ARBITRATION STRATEGY SIMULATOR
// ================================================================
// A legal strategy tool powered by Claude AI.
// Users enter dispute details; the AI returns a recommended
// strategy (Arbitrate / Litigate / Settle), legal reasoning,
// key risks, estimated timeline, and practical advice.
//
// HOW IT WORKS:
//  1. User fills in the form and clicks "Analyse Dispute"
//  2. We build a structured prompt from the form values
//  3. We POST that prompt to the Anthropic /v1/messages API
//  4. The API returns JSON which we parse and display
// ================================================================

import { useState } from "react";

// ── CONSTANTS ───────────────────────────────────────────────────

// Options shown in the "Dispute Type" dropdown
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

// Badge colours for each recommendation outcome
const REC_STYLES = {
  ARBITRATE: { bg: "#0f4c35", color: "#6ee7b7", label: "Arbitrate" },
  LITIGATE:  { bg: "#1e3a5f", color: "#93c5fd", label: "Litigate"  },
  SETTLE:    { bg: "#4a2a00", color: "#fbbf24", label: "Settle"    },
};

// ── STYLES ──────────────────────────────────────────────────────
// All CSS lives here as a template string injected via <style>.
// Using CSS variables from claude.ai for automatic dark-mode support.

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Source+Sans+3:wght@300;400;500;600&display=swap');

  /* ── Reset & Root ── */
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .arb-root {
    font-family: 'Source Sans 3', sans-serif;
    font-weight: 400;
    color: var(--color-text-primary);
    max-width: 720px;
    margin: 0 auto;
    padding: 2.5rem 1.25rem 4rem;
    animation: pageIn 0.5s ease both;
  }
  @keyframes pageIn {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* ── Header ── */
  .arb-header { margin-bottom: 2.5rem; }

  .arb-rule {
    width: 40px; height: 2px;
    background: var(--color-text-secondary);
    margin-bottom: 1rem;
    opacity: 0.4;
  }

  .arb-title {
    font-family: 'Libre Baskerville', serif;
    font-size: clamp(1.6rem, 4vw, 2.25rem);
    font-weight: 700;
    line-height: 1.15;
    letter-spacing: -0.02em;
    margin-bottom: 0.6rem;
  }

  .arb-subtitle {
    font-size: 14px;
    font-weight: 300;
    color: var(--color-text-secondary);
    line-height: 1.65;
    max-width: 520px;
  }

  /* ── Section wrapper ── */
  .arb-section {
    background: var(--color-background-primary);
    border: 0.5px solid var(--color-border-tertiary);
    border-radius: 10px;
    padding: 1.5rem 1.5rem 1.75rem;
    margin-bottom: 1.25rem;
  }

  .arb-section-title {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--color-text-secondary);
    margin-bottom: 1.25rem;
  }

  /* ── Form layout ── */
  .arb-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }
  .arb-field { display: flex; flex-direction: column; gap: 5px; }
  .arb-field.span2 { grid-column: 1 / -1; }  /* full-width field */

  .arb-label {
    font-size: 12px;
    font-weight: 500;
    color: var(--color-text-secondary);
    letter-spacing: 0.02em;
  }

  /* ── Inputs, selects, textareas ── */
  .arb-input,
  .arb-select,
  .arb-textarea {
    font-family: 'Source Sans 3', sans-serif;
    font-size: 14px;
    font-weight: 400;
    color: var(--color-text-primary);
    background: var(--color-background-secondary);
    border: 0.5px solid var(--color-border-secondary);
    border-radius: 7px;
    padding: 0.55rem 0.8rem;
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
    width: 100%;
  }
  .arb-input::placeholder,
  .arb-textarea::placeholder {
    color: var(--color-text-tertiary);
    font-weight: 300;
  }
  .arb-input:focus,
  .arb-select:focus,
  .arb-textarea:focus {
    border-color: var(--color-border-primary);
    box-shadow: 0 0 0 3px rgba(120,120,180,0.09);
  }
  .arb-select { appearance: none; cursor: pointer; }
  .arb-textarea { resize: vertical; min-height: 96px; line-height: 1.55; }

  /* ── Submit button ── */
  .arb-btn {
    margin-top: 1.25rem;
    width: 100%;
    padding: 0.78rem 1rem;
    font-family: 'Source Sans 3', sans-serif;
    font-size: 14px;
    font-weight: 500;
    letter-spacing: 0.03em;
    color: var(--color-text-primary);
    background: transparent;
    border: 0.5px solid var(--color-border-primary);
    border-radius: 7px;
    cursor: pointer;
    transition: background 0.15s, transform 0.1s;
  }
  .arb-btn:hover:not(:disabled) { background: var(--color-background-secondary); }
  .arb-btn:active:not(:disabled) { transform: scale(0.99); }
  .arb-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  /* ── Loading indicator ── */
  .arb-loading {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    font-weight: 300;
    color: var(--color-text-secondary);
    margin-top: 1rem;
  }
  .arb-spinner {
    width: 15px; height: 15px;
    border: 1.5px solid var(--color-border-tertiary);
    border-top-color: var(--color-text-secondary);
    border-radius: 50%;
    flex-shrink: 0;
    animation: spin 0.75s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* ── Error box ── */
  .arb-error {
    margin-top: 1rem;
    padding: 0.7rem 0.9rem;
    font-size: 13px;
    color: var(--color-text-danger);
    background: var(--color-background-danger);
    border: 0.5px solid var(--color-border-danger);
    border-radius: 7px;
    line-height: 1.5;
  }

  /* ── Results: animate in ── */
  .arb-results { animation: pageIn 0.4s ease both; }

  /* ── Recommendation banner ── */
  .arb-rec-banner {
    border-radius: 10px;
    padding: 1.4rem 1.5rem;
    margin-bottom: 1.25rem;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
    border: 0.5px solid var(--color-border-tertiary);
    background: var(--color-background-secondary);
  }
  .arb-rec-left {}
  .arb-rec-kicker {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--color-text-secondary);
    margin-bottom: 8px;
  }
  /* The coloured pill badge */
  .arb-rec-pill {
    display: inline-block;
    font-family: 'Libre Baskerville', serif;
    font-size: 1.4rem;
    font-weight: 700;
    padding: 4px 18px 5px;
    border-radius: 100px;
    letter-spacing: -0.01em;
  }
  .arb-rec-right { text-align: right; }
  .arb-timeline-label {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--color-text-secondary);
    margin-bottom: 4px;
  }
  .arb-timeline-value {
    font-family: 'Libre Baskerville', serif;
    font-size: 1.1rem;
    font-weight: 400;
    font-style: italic;
  }

  /* ── Output section cards ── */
  .arb-out-card {
    background: var(--color-background-primary);
    border: 0.5px solid var(--color-border-tertiary);
    border-radius: 10px;
    padding: 1.25rem 1.5rem;
    margin-bottom: 0.9rem;
  }
  .arb-out-label {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--color-text-secondary);
    margin-bottom: 0.65rem;
  }
  .arb-out-body {
    font-size: 14px;
    font-weight: 400;
    line-height: 1.75;
    color: var(--color-text-primary);
    white-space: pre-wrap;
  }

  /* ── Key risks list ── */
  .arb-risks { list-style: none; display: flex; flex-direction: column; gap: 7px; }
  .arb-risk {
    position: relative;
    padding-left: 1.1rem;
    font-size: 14px;
    line-height: 1.6;
    color: var(--color-text-primary);
  }
  .arb-risk::before {
    content: "—";
    position: absolute;
    left: 0;
    color: var(--color-text-secondary);
    font-size: 12px;
  }

  /* ── Disclaimer ── */
  .arb-disclaimer {
    margin-top: 1.25rem;
    font-size: 11px;
    font-weight: 300;
    line-height: 1.65;
    color: var(--color-text-secondary);
    opacity: 0.75;
  }

  /* ── Reset link ── */
  .arb-reset {
    display: block;
    margin-top: 0.75rem;
    font-size: 13px;
    font-weight: 400;
    color: var(--color-text-secondary);
    background: none;
    border: none;
    cursor: pointer;
    text-decoration: underline;
    text-underline-offset: 3px;
    padding: 0;
  }
  .arb-reset:hover { color: var(--color-text-primary); }

  /* ── Responsive: single column on small screens ── */
  @media (max-width: 500px) {
    .arb-grid { grid-template-columns: 1fr; }
    .arb-rec-banner { flex-direction: column; }
    .arb-rec-right { text-align: left; }
  }
`;

// ── MAIN COMPONENT ──────────────────────────────────────────────

export default function ArbitrationSimulator() {

  // ── State: form fields ──
  // Each key maps to one input in the form.
  const [form, setForm] = useState({
    disputeType:       "",   // dropdown selection
    claimValue:        "",   // free text, e.g. "USD 1,500,000"
    jurisdiction:      "",   // free text, e.g. "England & Wales"
    arbitrationClause: "",   // textarea – paste clause from contract
    keyFacts:          "",   // textarea – background description
  });

  // ── State: UI ──
  const [loading, setLoading] = useState(false);  // shows spinner while API runs
  const [result,  setResult]  = useState(null);   // parsed AI response object
  const [error,   setError]   = useState("");     // validation or API error text

  // ── Helper: update one form field ──
  // Returns an onChange handler for the given field name.
  const set = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  // ── Submit: build prompt → call API → parse JSON ──
  const handleSubmit = async () => {
console.log("API KEY:", import.meta.env.VITE_ANTHROPIC_API_KEY);
 console.log("KEY LENGTH:", import.meta.env.VITE_ANTHROPIC_API_KEY?.length);
    // Basic validation – the three most important fields
    if (!form.disputeType || form.disputeType === DISPUTE_TYPES[0]) {
      setError("Please select a dispute type."); return;
    }
    if (!form.claimValue.trim()) {
      setError("Please enter the claim value."); return;
    }
    if (!form.jurisdiction.trim()) {
      setError("Please enter the jurisdiction."); return;
    }

    setError("");
    setLoading(true);
    setResult(null);

    // ── Build the AI prompt ──
    // We tell Claude exactly what format to return so we can parse it reliably.
    const prompt = `
You are a senior disputes lawyer and international arbitration strategist.
A client has provided the following dispute details:

Dispute Type:        ${form.disputeType}
Claim Value:         ${form.claimValue}
Jurisdiction:        ${form.jurisdiction}
Arbitration Clause:  ${form.arbitrationClause || "Not provided"}
Key Facts:           ${form.keyFacts          || "Not provided"}

Analyse this dispute and respond ONLY with a valid JSON object — no markdown,
no explanation, no code fences. Use these exact keys:

{
  "recommendation": "ARBITRATE" | "LITIGATE" | "SETTLE",
  "reasoning": "2–3 paragraphs of legal reasoning",
  "risks": ["risk 1", "risk 2", "risk 3", "risk 4"],
  "timeline": "e.g. 12–18 months",
  "advice": "2–3 sentences of actionable practical advice"
}
    `.trim();

    try {
      // ── Call the Anthropic API ──
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
  "Content-Type": "application/json",
  "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
  "anthropic-version": "2023-06-01",
  "anthropic-dangerous-direct-browser-access": "true",
},
        body: JSON.stringify({
          model: "claude-3-haiku-20240307",  // always use this model
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      const data = await response.json();
console.log("API RESPONSE:", JSON.stringify(data));
      // ── Extract text from the response ──
      // data.content is an array of blocks; we join any text blocks together.
      const raw = (data.content || [])
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("");

      // Remove any accidental markdown fences (```json … ```)
      const clean = raw.replace(/```(?:json)?/g, "").trim();

      // Parse into a JS object
      const parsed = JSON.parse(clean);
      setResult(parsed);

    } catch (err) {
      console.error(err);
      setError("Analysis failed. Please check your inputs and try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Reset: clear everything and return to the form ──
  const handleReset = () => {
    setResult(null);
    setError("");
    setForm({ disputeType: "", claimValue: "", jurisdiction: "",
              arbitrationClause: "", keyFacts: "" });
  };

  // ── Look up badge style for the recommendation (ARBITRATE / LITIGATE / SETTLE) ──
  const recStyle = result ? (REC_STYLES[result.recommendation] || REC_STYLES.SETTLE) : null;

  // ── RENDER ──────────────────────────────────────────────────
  return (
    <>
      {/* Inject all CSS */}
      <style>{CSS}</style>

      <div className="arb-root">

        {/* ════ HEADER ════ */}
        <header className="arb-header">
          <div className="arb-rule" />
          <h1 className="arb-title">Arbitration Strategy<br/>Simulator</h1>
          <p className="arb-subtitle">
            Enter your dispute details to receive an AI-generated strategic
            analysis — including a recommended path, legal reasoning, key
            risks, and practical next steps.
          </p>
        </header>

        {/* ════ FORM (hidden once results are shown) ════ */}
        {!result && (
          <div className="arb-section">
            <p className="arb-section-title">Dispute Details</p>

            <div className="arb-grid">

              {/* ── Dispute Type dropdown ── */}
              <div className="arb-field">
                <label className="arb-label">Dispute type *</label>
                <select
                  className="arb-select"
                  value={form.disputeType}
                  onChange={set("disputeType")}
                >
                  {DISPUTE_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* ── Claim Value ── */}
              <div className="arb-field">
                <label className="arb-label">Claim value *</label>
                <input
                  className="arb-input"
                  type="text"
                  placeholder="e.g. USD 2,500,000"
                  value={form.claimValue}
                  onChange={set("claimValue")}
                />
              </div>

              {/* ── Jurisdiction (full width) ── */}
              <div className="arb-field span2">
                <label className="arb-label">Jurisdiction *</label>
                <input
                  className="arb-input"
                  type="text"
                  placeholder="e.g. England & Wales · Singapore (SIAC) · New York (AAA)"
                  value={form.jurisdiction}
                  onChange={set("jurisdiction")}
                />
              </div>

              {/* ── Arbitration Clause textarea (full width) ── */}
              <div className="arb-field span2">
                <label className="arb-label">Arbitration clause</label>
                <textarea
                  className="arb-textarea"
                  placeholder="Paste the arbitration clause from your contract here (if any)…"
                  value={form.arbitrationClause}
                  onChange={set("arbitrationClause")}
                />
              </div>

              {/* ── Key Facts textarea (full width) ── */}
              <div className="arb-field span2">
                <label className="arb-label">Key facts</label>
                <textarea
                  className="arb-textarea"
                  placeholder="Briefly describe what happened, what you are claiming, and any important context…"
                  value={form.keyFacts}
                  onChange={set("keyFacts")}
                  style={{ minHeight: 110 }}
                />
              </div>

            </div>{/* /arb-grid */}

            {/* ── Error message ── */}
            {error && <div className="arb-error">{error}</div>}

            {/* ── Submit button ── */}
            <button
              className="arb-btn"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? "Analysing dispute…" : "Analyse Dispute ↗"}
            </button>

            {/* ── Loading spinner ── */}
            {loading && (
              <div className="arb-loading">
                <div className="arb-spinner" />
                Consulting the AI strategist — this may take a few seconds…
              </div>
            )}

          </div>
        )}{/* /form */}


        {/* ════ RESULTS ════ */}
        {result && (
          <div className="arb-results">

            {/* ── Recommendation + Timeline banner ── */}
            <div className="arb-rec-banner">
              <div className="arb-rec-left">
                <p className="arb-rec-kicker">Recommended path</p>
                <span
                  className="arb-rec-pill"
                  style={{ background: recStyle.bg, color: recStyle.color }}
                >
                  {recStyle.label}
                </span>
              </div>
              <div className="arb-rec-right">
                <p className="arb-timeline-label">Estimated timeline</p>
                <p className="arb-timeline-value">{result.timeline}</p>
              </div>
            </div>

            {/* ── Legal Reasoning ── */}
            <div className="arb-out-card">
              <p className="arb-out-label">Legal reasoning</p>
              <p className="arb-out-body">{result.reasoning}</p>
            </div>

            {/* ── Key Risks ── */}
            <div className="arb-out-card">
              <p className="arb-out-label">Key risks</p>
              <ul className="arb-risks">
                {(result.risks || []).map((risk, i) => (
                  <li key={i} className="arb-risk">{risk}</li>
                ))}
              </ul>
            </div>

            {/* ── Practical Advice ── */}
            <div className="arb-out-card">
              <p className="arb-out-label">Practical advice</p>
              <p className="arb-out-body">{result.advice}</p>
            </div>

            {/* ── Legal disclaimer ── */}
            <p className="arb-disclaimer">
              This analysis is generated by an AI model for informational purposes only
              and does not constitute legal advice. Always consult a qualified lawyer
              before making any decisions about your dispute.
            </p>

            {/* ── Start over ── */}
            <button className="arb-reset" onClick={handleReset}>
              ← Analyse another dispute
            </button>

          </div>
        )}{/* /results */}

      </div>{/* /arb-root */}
    </>
  );
}
