module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  return res.status(501).json({
    error: "Not implemented",
    hint: "Accept POST with JSON { index }. Update persistent state in DB and return updated state.",
  });
};
