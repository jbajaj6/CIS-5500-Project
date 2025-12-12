const { pool } = require('../db');
const OpenAI = require("openai");
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const getEmbedding = require("../utils/getEmbedding");

const getSimilarSymptoms = async (req, res) => {
  try {
    const text = req.query.text;
    if (!text || text.trim() === "") {
      return res.status(400).json({ error: "Need to pass in your symptoms." });
    }

    // Generate embedding for user's symptom text
    const embedding = await getEmbedding(text);

    // Query pgvector for similar diseases
    const sql = `
        WITH user_symptom AS (
            SELECT $1::float4[]::vector AS embedding
        ),
        similarity AS (
            SELECT
            d.disease_name,
            (e.symptom_embedding <=> u.embedding) AS cosine_distance
            FROM disease_symptom_embeddings e
            JOIN dim_disease d ON d.disease_id = e.disease_id
            CROSS JOIN user_symptom u
        )
        SELECT
            disease_name,
            ROUND(cosine_distance::numeric, 5) AS distance
        FROM similarity
        ORDER BY cosine_distance
        LIMIT 15;
        `;

    const result = await pool.query(sql, [embedding]);

    res.json(result.rows);

  } catch (err) {
    console.error("Error in /api/similar-symptoms:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = getSimilarSymptoms;
