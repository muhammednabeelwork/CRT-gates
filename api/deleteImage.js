module.exports = async function handler(req, res) {
  return res.status(501).json({
    error: "Not implemented",
    hint: "Accept POST at /api/deleteImage with JSON { id }. Remove image from persistent store and return updated state.",
  });
};
