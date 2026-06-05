exports.handler = async function (event, context) {
  return {
    statusCode: 501,
    body: JSON.stringify({
      error: "Not implemented",
      hint: "Accept POST with JSON { images: [...] }. Persist new ordering in DB and return state."
    })
  };
};
