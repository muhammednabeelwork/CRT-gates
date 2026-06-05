exports.handler = async function (event, context) {
  return {
    statusCode: 501,
    body: JSON.stringify({
      error: "Not implemented",
      hint: "Accept POST with JSON { index }. Update persistent state in DB and return updated state."
    })
  };
};
