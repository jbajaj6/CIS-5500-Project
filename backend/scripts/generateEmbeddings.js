
require("dotenv").config();
const { pool } = require("../db");
const getEmbedding = require("../utils/getEmbedding");

async function main() {
  console.log("Fetching symptoms…");

  const { rows } = await pool.query(`
    SELECT disease_id, symptoms
    FROM disease_symptoms
    ORDER BY disease_id;
  `);

  for (const row of rows) {
    const { disease_id, symptoms } = row;

    console.log(`Embedding disease_id ${disease_id}...`);
    const embedding = await getEmbedding(symptoms);
    const embeddingStr = `[${embedding.join(",")}]`;
    await pool.query(
      `
      INSERT INTO disease_symptom_embeddings (disease_id, symptom_embedding)
      VALUES ($1, $2::vector)
      ON CONFLICT (disease_id)
      DO UPDATE SET symptom_embedding = EXCLUDED.symptom_embedding;
      `,
      [disease_id, embeddingStr]
    );
  }

  console.log("All embeddings generated and stored.");
  await pool.end();
  process.exit(0);
}

main().catch((err) => {
  console.error("Error generating embeddings:", err);
  process.exit(1);
});
