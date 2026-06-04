const admin = require("firebase-admin");

function initAdmin() {
  if (admin.apps && admin.apps.length) return admin.app();
  const svc = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!svc) throw new Error("FIREBASE_SERVICE_ACCOUNT env var not set");
  const cred = JSON.parse(svc);
  return admin.initializeApp({
    credential: admin.credential.cert(cred),
    storageBucket: cred.project_id + ".appspot.com",
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const authHeader = req.headers && (req.headers.authorization || req.headers.Authorization || "");
    const match = authHeader.match(/^Bearer (.+)$/);
    if (!match) {
      return res.status(401).json({ error: "Missing Authorization bearer token" });
    }
    const idToken = match[1];

    const app = initAdmin();
    const decoded = await admin.auth().verifyIdToken(idToken);
    if (!decoded || !decoded.uid) {
      return res.status(403).json({ error: "Invalid token" });
    }

    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { fileName, dataUrl } = body;
    if (!fileName || !dataUrl) {
      return res.status(400).json({ error: "Missing fileName or dataUrl" });
    }

    const m = dataUrl.match(/^data:(.+);base64,(.+)$/);
    if (!m) {
      return res.status(400).json({ error: "Invalid dataUrl" });
    }
    const contentType = m[1];
    const base64 = m[2];
    const buffer = Buffer.from(base64, "base64");

    const bucket = admin.storage().bucket();
    const safeName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const remotePath = `uploads/${Date.now()}-${safeName}`;
    const file = bucket.file(remotePath);
    await file.save(buffer, { metadata: { contentType } });
    
    try {
      await file.makePublic();
    } catch (e) {
      // ignore
    }
    
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${remotePath}`;
    const docRef = await admin
      .firestore()
      .collection("images")
      .add({
        url: publicUrl,
        fileName,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        uploader: decoded.uid,
      });

    return res.status(200).json({ url: publicUrl, id: docRef.id });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
};
