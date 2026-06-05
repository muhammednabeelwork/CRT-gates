exports.handler = async function (event, context) {
  return {
    statusCode: 501,
    body: JSON.stringify({
      error: "Not implemented",
      hint: "Accept DELETE at /image/:id. Remove image from persistent store and return updated state."
    })
  };
};
