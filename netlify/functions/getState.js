exports.handler = async function (event, context) {
  return {
    statusCode: 501,
    body: JSON.stringify({
      error: "Not implemented",
      hint: "Implement persistent state (e.g., Supabase) and return JSON state here. Set SUPABASE_URL and SUPABASE_KEY in Netlify env."
    })
  };
};
