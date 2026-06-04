module.exports = async function handler(req, res) {
  return res.status(501).json({
    error: "Not implemented",
    hint: "Accept GET at /api/getState. Return persistent state from DB (e.g., Supabase, Firebase).",
  });
};
