// netlify/functions/cfg.js
// Endpoint: /.netlify/functions/cfg

exports.handler = async function(event, context) {
  const CONFIG_CODE = `const CONFIG = {
  FIREBASE_URL: "https://emote-24906-default-rtdb.asia-southeast1.firebasedatabase.app",
  EMOTE_API:    "https://freefire-emote-api.onrender.com",
  EMOTE_KEY:    "codespecters.com",
  MULTI_API:    "https://ff-multipurpose-api.onrender.com",
  MULTI_KEY:    "codespecter",
  CDN_BASE:     "https://cdn.jsdelivr.net/gh/ShahGCreator/icon@main/PNG/",
};`;

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/javascript",
      "Access-Control-Allow-Origin": "*",
    },
    body: CONFIG_CODE,
  };
};
