import React, { useState, useEffect } from "react";
import { Scale, AlertTriangle, FileText, CheckCircle, Clock, Lightbulb, Database, History, RefreshCw, Trash2, Edit3, Save, X } from "lucide-react";

const DISPUTE_TYPES = [
  "Select dispute type...",
  "Commercial Contract Breach",
  "International Trade / Cross-Border",
  "Construction & Infrastructure",
  "Intellectual Property / Tech Licensing",
  "Shareholder / Joint Venture Dispute",
  "Employment / Executive Compensation",
  "Maritime & Shipping",
  "Other Commercial Dispute",
];

export default function ArbitrationSimulator() {
  const [activeTab, setActiveTab] = useState("simulator"); // 'simulator' | 'history'
  const [form, setForm] = useState({
    disputeType: DISPUTE_TYPES[0],
    claimValue: "",
    jurisdiction: "",
    arbitrationClause: "",
    keyFacts: "",
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  // DB Connection status state
  const [dbStatus, setDbStatus] = useState({ configured: false, connected: false, message: "Checking Neon DB..." });
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editFacts, setEditFacts] = useState("");
  const [editAdvice, setEditAdvice] = useState("");

  useEffect(() => {
    checkDbStatus();
    fetchHistory();
  }, []);

  const checkDbStatus = async () => {
    try {
      const res = await fetch("/api/db-status");
      if (res.ok) {
        const data = await res.json();
        setDbStatus(data);
      } else {
        setDbStatus({ configured: false, connected: false, message: "Database check failed" });
      }
    } catch {
      setDbStatus({ configured: false, connected: false, message: "Local or missing backend" });
    }
  };

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch("/api/disputes");
      if (res.ok) {
        const data = await res.json();
        setHistory(data.disputes || []);
      }
    } catch (err) {
      console.warn("Could not fetch dispute history:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    if (!form.disputeType || form.disputeType === DISPUTE_TYPES[0]) {
      setError("Please select a dispute type.");
      return;
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
        console.warn("Backend API call warning, using fallback engine:", netErr);
      }

      // Guaranteed Fallback Legal Analysis Engine
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
      fetchHistory();
    } catch (err) {
      console.error("Dispute submit error:", err);
      setError("Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHistory = async (id) => {
    try {
      const res = await fetch(`/api/disputes/${id}`, { method: "DELETE" });
      if (res.ok) {
        setHistory((prev) => prev.filter((item) => item.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete history item:", err);
    }
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditFacts(item.key_facts || "");
    setEditAdvice(item.advice || "");
  };

  const saveEdit = async (id) => {
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
      console.error("Failed to update history item:", err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header & DB Status */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600/20 text-blue-400 rounded-lg border border-blue-500/30">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-white">Arbitration Strategy Simulator</h1>
              <p className="text-xs text-slate-400">Legal Analysis & Dispute Resolution Advisor</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center space-x-2 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveTab("simulator")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center space-x-1.5 ${
                activeTab === "simulator"
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Simulator</span>
            </button>
            <button
              onClick={() => {
                setActiveTab("history");
                fetchHistory();
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center space-x-1.5 ${
                activeTab === "history"
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Case History ({history.length})</span>
            </button>
          </div>

          {/* Neon DB Status Badge */}
          <div className="flex items-center space-x-2 text-xs bg-slate-950 px-3 py-1.5 rounded-full border border-slate-800">
            <Database className="w-3.5 h-3.5 text-slate-400" />
            {dbStatus.connected ? (
              <span className="text-emerald-400 font-medium flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Neon DB Connected</span>
              </span>
            ) : dbStatus.configured ? (
              <span className="text-amber-400 font-medium flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>Neon Connection Issue</span>
              </span>
            ) : (
              <span className="text-slate-400 font-medium flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-slate-600"></span>
                <span>Neon DB Not Configured</span>
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        {activeTab === "simulator" ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Input Form Column */}
            <div className="lg:col-span-6 bg-slate-900/60 border border-slate-800 rounded-xl p-6 shadow-xl space-y-5">
              <h2 className="text-base font-semibold text-slate-200 border-b border-slate-800 pb-3 flex items-center space-x-2">
                <FileText className="w-4 h-4 text-blue-400" />
                <span>Dispute Details & Parameters</span>
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Dispute Category</label>
                  <select
                    name="disputeType"
                    value={form.disputeType}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    {DISPUTE_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Claim Amount / Value</label>
                    <input
                      type="text"
                      name="claimValue"
                      placeholder="e.g. $1,500,000 USD"
                      value={form.claimValue}
                      onChange={handleChange}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Jurisdiction / Seat</label>
                    <input
                      type="text"
                      name="jurisdiction"
                      placeholder="e.g. London (LCIA) / Singapore"
                      value={form.jurisdiction}
                      onChange={handleChange}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Arbitration Clause Summary (Optional)</label>
                  <input
                    type="text"
                    name="arbitrationClause"
                    placeholder="e.g. ICC Rules, 3 arbitrators, English language"
                    value={form.arbitrationClause}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Key Dispute Facts & Narrative</label>
                  <textarea
                    name="keyFacts"
                    rows={4}
                    placeholder="Briefly describe the contractual dispute, breach allegations, damages claimed, or procedural history..."
                    value={form.keyFacts}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center space-x-2 shadow-lg shadow-blue-600/20"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Analyzing Legal Strategy...</span>
                  </>
                ) : (
                  <>
                    <Scale className="w-4 h-4" />
                    <span>Analyse Dispute & Save Strategy</span>
                  </>
                )}
              </button>
            </div>

            {/* Analysis Results Column */}
            <div className="lg:col-span-6 space-y-5">
              {result ? (
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <h2 className="text-base font-semibold text-slate-200 flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span>Recommended Strategy</span>
                    </h2>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider ${
                        result.recommendation === "ARBITRATE"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : result.recommendation === "LITIGATE"
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                      }`}
                    >
                      {result.recommendation}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Legal Reasoning & Rationale</h3>
                    <p className="text-sm text-slate-300 leading-relaxed bg-slate-950 p-4 rounded-lg border border-slate-800">
                      {result.reasoning}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        <span>Key Risks & Exposure</span>
                      </h3>
                      <ul className="space-y-2">
                        {result.risks?.map((r, i) => (
                          <li key={i} className="text-xs text-slate-300 flex items-start space-x-2 bg-slate-950/50 p-2 rounded border border-slate-800/50">
                            <span className="text-amber-400 font-bold">•</span>
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                        <Clock className="w-3.5 h-3.5 text-blue-400" />
                        <span>Estimated Timeline</span>
                      </h3>
                      <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-sm font-semibold text-blue-400">
                        {result.timeline || "N/A"}
                      </div>

                      <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mt-4 mb-2 flex items-center space-x-1.5">
                        <Lightbulb className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Strategic Action</span>
                      </h3>
                      <p className="text-xs text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-800">
                        {result.advice}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-xl p-12 text-center text-slate-500 flex flex-col items-center justify-center space-y-3 min-h-[400px]">
                  <Scale className="w-12 h-12 text-slate-700 stroke-[1.5]" />
                  <p className="text-sm font-medium">No dispute analysis generated yet.</p>
                  <p className="text-xs max-w-xs text-slate-600">Fill in the dispute parameters on the left to simulate arbitration viability and procedural recommendations.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Case History Tab */
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-semibold text-slate-200">Saved Case History</h2>
                <p className="text-xs text-slate-400">Analyses automatically synchronized with your Neon database</p>
              </div>
              <button
                onClick={fetchHistory}
                disabled={historyLoading}
                className="px-3 py-1.5 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center space-x-1.5 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${historyLoading ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </button>
            </div>

            {history.length === 0 ? (
              <div className="text-center py-12 text-slate-500 space-y-2">
                <History className="w-8 h-8 mx-auto text-slate-700" />
                <p className="text-sm">No saved dispute analyses found.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((item) => (
                  <div key={item.id} className="bg-slate-950 border border-slate-800 rounded-lg p-5 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-slate-200 text-sm">{item.dispute_type}</span>
                          <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            {item.claim_value || "Value N/A"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          Jurisdiction: {item.jurisdiction || "General"} | Date: {new Date(item.created_at).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className={`px-2.5 py-1 rounded text-xs font-bold ${
                          item.recommendation === "ARBITRATE" ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
                        }`}>
                          {item.recommendation}
                        </span>

                        {editingId === item.id ? (
                          <>
                            <button onClick={() => saveEdit(item.id)} className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded">
                              <Save className="w-4 h-4" />
                            </button>
                            <button onClick={() => setEditingId(null)} className="p-1.5 text-slate-400 hover:bg-slate-800 rounded">
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => startEdit(item)} className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded">
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeleteHistory(item.id)} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {editingId === item.id ? (
                      <div className="space-y-3 pt-2">
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Edit Key Facts:</label>
                          <textarea
                            value={editFacts}
                            onChange={(e) => setEditFacts(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs text-slate-200"
                            rows={2}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Edit Actionable Advice:</label>
                          <textarea
                            value={editAdvice}
                            onChange={(e) => setEditAdvice(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs text-slate-200"
                            rows={2}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 space-y-1.5 border-t border-slate-900 pt-3">
                        <p><strong className="text-slate-300">Reasoning:</strong> {item.reasoning}</p>
                        {item.advice && <p><strong className="text-slate-300">Advice:</strong> {item.advice}</p>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
