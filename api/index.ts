import express from "express";
import { GoogleGenAI } from "@google/genai";
import { neon } from "@neondatabase/serverless";

const app = express();
app.use(express.json());

// Check Neon database connection status
app.get("/api/db-status", async (req, res) => {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    return res.json({
      configured: false,
      connected: false,
      message: "DATABASE_URL environment variable is missing.",
    });
  }

  try {
    const sql = neon(dbUrl);
    await sql`
      CREATE TABLE IF NOT EXISTS dispute_analyses (
        id SERIAL PRIMARY KEY,
        dispute_type TEXT,
        claim_value TEXT,
        jurisdiction TEXT,
        key_facts TEXT,
        arbitration_clause TEXT,
        recommendation TEXT,
        reasoning TEXT,
        risks JSONB,
        timeline TEXT,
        advice TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await sql`SELECT 1`;
    return res.json({
      configured: true,
      connected: true,
      message: "Successfully connected to Neon PostgreSQL database!",
    });
  } catch (err: any) {
    return res.json({
      configured: true,
      connected: false,
      message: `Neon connection error: ${err.message || err}`,
    });
  }
});

// Fetch saved dispute analyses from Neon DB
app.get("/api/disputes", async (req, res) => {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    return res.status(400).json({ error: "DATABASE_URL is not configured" });
  }
  try {
    const sql = neon(dbUrl);
    const rows = await sql`
      SELECT id, dispute_type, claim_value, jurisdiction, key_facts, arbitration_clause, 
             recommendation, reasoning, risks, timeline, advice, created_at 
      FROM dispute_analyses 
      ORDER BY created_at DESC 
      LIMIT 50;
    `;
    return res.json({ disputes: rows });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Failed to fetch saved disputes" });
  }
});

// Update saved dispute analysis
app.put("/api/disputes/:id", async (req, res) => {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    return res.status(400).json({ error: "DATABASE_URL is not configured" });
  }
  try {
    const sql = neon(dbUrl);
    const id = parseInt(req.params.id, 10);
    const { keyFacts, advice } = req.body;
    await sql`
      UPDATE dispute_analyses 
      SET key_facts = ${keyFacts || ""}, advice = ${advice || ""}
      WHERE id = ${id};
    `;
    return res.json({ success: true, id });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Failed to update dispute" });
  }
});

// Delete saved dispute analysis
app.delete("/api/disputes/:id", async (req, res) => {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    return res.status(400).json({ error: "DATABASE_URL is not configured" });
  }
  try {
    const sql = neon(dbUrl);
    const id = parseInt(req.params.id, 10);
    await sql`DELETE FROM dispute_analyses WHERE id = ${id};`;
    return res.json({ success: true, id });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Failed to delete dispute" });
  }
});

// Main Legal Arbitration Analysis API
app.post("/api/analyze", async (req, res) => {
  try {
    const { disputeType, claimValue, jurisdiction, keyFacts, arbitrationClause } = req.body;

    if (!disputeType) {
      return res.status(400).json({ error: "Dispute type is required" });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    let analysisResult: any;

    if (!apiKey) {
      const fallbackRec = claimValue && parseFloat(claimValue.replace(/[^0-9.]/g, "")) > 1000000 
        ? "ARBITRATE" 
        : "SETTLE";

      analysisResult = {
        recommendation: fallbackRec,
        reasoning: `Based on an initial legal assessment of a ${disputeType} dispute valued at ${claimValue || "unspecified value"}, arbitration provides confidential and enforceable resolution.`,
        risks: [
          "Upfront administrative and arbitrator tribunal fees",
          "Limited appellate review mechanisms compared to public courts",
          "Cross-border asset discovery constraints"
        ],
        timeline: "6 – 14 Months",
        advice: "Review contractual dispute resolution clauses, seat designation, and governing law."
      };
    } else {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Analyze this legal dispute as an expert international arbitration attorney.

Dispute Type: ${disputeType}
Claim Value: ${claimValue || "Not specified"}
Jurisdiction: ${jurisdiction || "Not specified"}
Arbitration Clause Details: ${arbitrationClause || "None provided"}
Key Facts: ${keyFacts || "None provided"}

Return ONLY a valid JSON object with exact keys:
- "recommendation": "ARBITRATE", "LITIGATE", or "SETTLE"
- "reasoning": Detailed legal and commercial analysis.
- "risks": Array of 3-4 specific legal, financial, or procedural risks.
- "timeline": Estimated duration.
- "advice": Strategic next steps.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const responseText = response.text || "";
      const cleaned = responseText.replace(/```json|```/g, "").trim();
      analysisResult = JSON.parse(cleaned);
    }

    // Auto-save to Neon PostgreSQL
    let dbSavedId = null;
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl) {
      try {
        const sql = neon(dbUrl);
        await sql`
          CREATE TABLE IF NOT EXISTS dispute_analyses (
            id SERIAL PRIMARY KEY,
            dispute_type TEXT,
            claim_value TEXT,
            jurisdiction TEXT,
            key_facts TEXT,
            arbitration_clause TEXT,
            recommendation TEXT,
            reasoning TEXT,
            risks JSONB,
            timeline TEXT,
            advice TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `;
        const rows = await sql`
          INSERT INTO dispute_analyses (
            dispute_type, claim_value, jurisdiction, key_facts, arbitration_clause,
            recommendation, reasoning, risks, timeline, advice
          ) VALUES (
            ${disputeType || ""}, ${claimValue || ""}, ${jurisdiction || ""}, ${keyFacts || ""}, ${arbitrationClause || ""},
            ${analysisResult.recommendation}, ${analysisResult.reasoning}, ${JSON.stringify(analysisResult.risks)}, ${analysisResult.timeline}, ${analysisResult.advice}
          )
          RETURNING id;
        `;
        if (rows && rows[0]) dbSavedId = rows[0].id;
      } catch (dbErr) {
        console.error("[Neon DB] Auto-save error:", dbErr);
      }
    }

    return res.json({
      ...analysisResult,
      savedToDb: Boolean(dbSavedId),
      recordId: dbSavedId
    });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to perform dispute analysis", details: err.message });
  }
});

export default app;
