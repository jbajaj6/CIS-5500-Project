const OpenAI = require("openai");

if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY in environment variables");
  }

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Get an embedding for a piece of text using OpenAI.
 * @param {string} text
 * @returns {Promise<number[]>} embedding as a JS array of floats
 */
async function getEmbedding(text) {
  const response = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });

  return response.data[0].embedding;
}

module.exports = getEmbedding;
