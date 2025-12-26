import fs from "fs";
import https from "https";
import express from "express";
import axios from "axios";

const app = express();
app.use(express.json());

/* Seguridad simple */
app.use((req, res, next) => {
  if (req.headers.authorization !== `Bearer ${process.env.PROXY_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
});

/* mTLS */
const agent = new https.Agent({
  cert: process.env.AZUL_CERT,
  key: process.env.AZUL_KEY,
  ca: process.env.AZUL_CA,
  rejectUnauthorized: true
});

app.post("/azul", async (req, res) => {
  try {
    const response = await axios.post(
      process.env.AZUL_URL,
      req.body,
      { httpsAgent: agent }
    );
    res.json(response.data);
  } catch (err) {
    res.status(500).json({
      error: err.message,
      azul: err.response?.data
    });
  }
});

app.listen(3000);
