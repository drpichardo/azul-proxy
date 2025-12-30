import fetch from "node-fetch";
import https from "https";

const app = express();
app.use(express.json());

// CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// Auth middleware
app.use((req, res, next) => {
  if (req.path === "/health") return next();
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.PROXY_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
});

// mTLS Agent con certificados de Azul
const agent = new https.Agent({
  cert: process.env.AZUL_CERT.replace(/\\n/g, '\n'),
  key: process.env.AZUL_KEY.replace(/\\n/g, '\n'),
  rejectUnauthorized: true
});

// Endpoint principal
app.post("/azul", async (req, res) => {
  console.log("📥 Request received:", JSON.stringify(req.body, null, 2));
  
  try {
    const response = await fetch(
      process.env.AZUL_URL || "https://pruebas.azul.com.do/WebServices/JSON/default.aspx",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Auth1": process.env.AZUL_AUTH1,
          "Auth2": process.env.AZUL_AUTH2
        },
        body: JSON.stringify(req.body),
        agent
      }
    );
    
    const data = await response.json();
    console.log("📤 Azul response:", JSON.stringify(data, null, 2));
    res.json(data);
  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({
      error: err.message,
      details: err.stack
    });
  }
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Azul Proxy running on port ${PORT}`);
});





