const admin = require('firebase-admin');

function initAdmin() {
  if (admin.apps && admin.apps.length) return admin.app();
  const svc = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!svc) throw new Error('FIREBASE_SERVICE_ACCOUNT env var not set');
  const cred = JSON.parse(svc);
  return admin.initializeApp({
    credential: admin.credential.cert(cred),
    storageBucket: cred.project_id + '.appspot.com'
  });
}

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };
  try {
    const authHeader = event.headers && (event.headers.authorization || event.headers.Authorization || '');
    const match = authHeader.match(/^Bearer (.+)$/);
    if (!match) return { statusCode: 401, body: 'Missing Authorization bearer token' };
    const idToken = match[1];

    const app = initAdmin();
    const decoded = await admin.auth().verifyIdToken(idToken);
    if (!decoded || !decoded.uid) return { statusCode: 403, body: 'Invalid token' };

    const body = JSON.parse(event.body || '{}');
    const { fileName, dataUrl } = body;
    if (!fileName || !dataUrl) return { statusCode: 400, body: 'Missing fileName or dataUrl' };

    const m = dataUrl.match(/^data:(.+);base64,(.+)$/);
    if (!m) return { statusCode: 400, body: 'Invalid dataUrl' };
    const contentType = m[1];
    const base64 = m[2];
    const buffer = Buffer.from(base64, 'base64');

    const bucket = admin.storage().bucket();
    const safeName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const remotePath = `uploads/${Date.now()}-${safeName}`;
    const file = bucket.file(remotePath);
    await file.save(buffer, { metadata: { contentType } });
    // make public (optional - depends on your security/privacy needs)
    try { await file.makePublic(); } catch (e) { /* ignore */ }
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${remotePath}`;

    const docRef = await admin.firestore().collection('images').add({ url: publicUrl, fileName, createdAt: admin.firestore.FieldValue.serverTimestamp(), uploader: decoded.uid });

    return {
      statusCode: 200,
      body: JSON.stringify({ url: publicUrl, id: docRef.id })
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: String(err && err.message ? err.message : err) };
  }
};
