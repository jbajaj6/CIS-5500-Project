// backend/utils/getEmbedding.js
const OpenAI = require("openai");

// IMPORTANT: dotenv should be loaded by the caller (e.g. in generateEmbeddings.js)
// so we just read from process.env here.
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

  // response.data[0].embedding is already a JS array[number]
  return response.data[0].embedding;
}

module.exports = getEmbedding;
