const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

exports.handler = async function (event, context) {
  try {
    if (!event || !event.body) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing request body" }) };
    }

    const payload = JSON.parse(event.body);
    const { fileName, base64Data, title, subtitle, description, category, colorTheme } = payload;

    if (!fileName || !base64Data) {
      return { statusCode: 400, body: JSON.stringify({ error: "fileName and base64Data required" }) };
    }

    const R2_BUCKET = process.env.R2_BUCKET;
    const R2_ENDPOINT = process.env.R2_ENDPOINT;
    const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
    const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
    const R2_PUBLIC_URL_BASE = process.env.R2_PUBLIC_URL_BASE; // optional: e.g., https://<account>.r2.cloudflarestorage.com/<bucket>

    if (!R2_BUCKET || !R2_ENDPOINT || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
      return { statusCode: 500, body: JSON.stringify({ error: "Missing R2 configuration environment variables" }) };
    }

    // Extract mime-type if data URL provided
    let mime = "application/octet-stream";
    let rawBase64 = base64Data;
    const match = /^data:(.+);base64,(.*)$/.exec(base64Data);
    if (match) {
      mime = match[1];
      rawBase64 = match[2];
    }

    const extMatch = /\.([a-zA-Z0-9]+)$/.exec(fileName);
    const ext = extMatch ? extMatch[1] : (mime.split("/")[1] || "bin");

    const key = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${fileName.replace(/[^a-zA-Z0-9.-]/g, "_")}`;

    const buffer = Buffer.from(rawBase64, "base64");

    const s3 = new S3Client({
      region: "auto",
      endpoint: R2_ENDPOINT,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
      forcePathStyle: false,
    });

    const put = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mime,
    });

    await s3.send(put);

    const publicUrl = R2_PUBLIC_URL_BASE ? `${R2_PUBLIC_URL_BASE.replace(/\/$/, "")}/${encodeURIComponent(key)}` : `/${key}`;

    // Optionally persist metadata to Supabase if configured
    let supabaseResponse = null;
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_KEY;
    const SUPABASE_IMAGES_TABLE = process.env.SUPABASE_IMAGES_TABLE || "images";

    const newImage = {
      id: `upload_${Date.now()}`,
      url: publicUrl,
      title: title || "USER EXHIBIT",
      subtitle: subtitle || "Uploaded via Controller",
      description: description || "Uploaded media",
      category: category || "GALLERY SUBMISSION",
      colorTheme: colorTheme || "#AB844C",
      created_at: new Date().toISOString(),
    };

    if (SUPABASE_URL && SUPABASE_KEY) {
      try {
        const resp = await fetch(`${SUPABASE_URL}/rest/v1/${SUPABASE_IMAGES_TABLE}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
            Prefer: "return=representation",
          },
          body: JSON.stringify(newImage),
        });

        supabaseResponse = await resp.json();
      } catch (err) {
        // ignore supabase errors but include in response
        supabaseResponse = { error: String(err) };
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, url: publicUrl, image: newImage, supabase: supabaseResponse }),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: String(err) }) };
  }
};
