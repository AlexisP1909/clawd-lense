import express, { Request, Response } from 'express';
import axios from 'axios';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import * as fs from 'fs';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const app = express();
const port = 3000;
const targetUrl = process.env.ANTHROPIC_BASE_URL || 'http://localhost:3001';
let requestCount = 0;
let lastResponse = "No requests yet";
let modelUsed = "No requests yet";

const statsFilePath = path.join(__dirname, '../stats.json');

// Load initial state from file if it exists
if (fs.existsSync(statsFilePath)) {
  try {
    const savedStats = JSON.parse(fs.readFileSync(statsFilePath, 'utf8'));
    requestCount = savedStats.requestCount || 0;
    lastResponse = savedStats.lastResponse || "No requests yet";
    modelUsed = savedStats.modelUsed || "No requests yet";
    console.log(`[Proxy] Loaded stats: ${requestCount} requests.`);
  } catch (e) {
    console.error('[Proxy] Failed to load stats.json, starting fresh.');
  }
}

const saveStats = () => {
  try {
    fs.writeFileSync(statsFilePath, JSON.stringify({ requestCount, modelUsed, lastResponse }, null, 2));
  } catch (e) {
    console.error('[Proxy] Failed to save stats.json');
  }
};

app.use(cors());
app.use(express.json());

// Load Swagger document
const swaggerDocument = JSON.parse(fs.readFileSync(path.join(__dirname, '../swagger.json'), 'utf8'));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Proxy endpoint for Claude messages
app.post('/v1/messages', async (req: Request, res: Response) => {
  requestCount++;
  console.log(`[Proxy] Forwarding request #${requestCount} to ${targetUrl}`);
  
  // Extract and forward all relevant headers
  const forwardHeaders: any = {
    'Content-Type': 'application/json',
  };

  Object.keys(req.headers).forEach(key => {
    const lowercaseKey = key.toLowerCase();
    if (lowercaseKey.startsWith('anthropic-') || lowercaseKey === 'x-api-key') {
      forwardHeaders[key] = req.headers[key];
    }
  });

  try {
    // Forward the request to the target URL, maintaining the path
    const upstreamUrl = `${targetUrl}/v1/messages`;
    const response = await axios.post(upstreamUrl, req.body, {
      headers: forwardHeaders
    });

    // Capture the last response content for the dashboard
    if (response.data?.content?.[0]?.text) {
      lastResponse = response.data.content[0].text;
    } else if (response.data?.content?.[0]?.type === 'tool_use') {
      lastResponse = `[Tool Use] ${response.data.content[0].name}`;
    }
    
    if (response.data?.model) {
      modelUsed = response.data.model;
    }
    saveStats();
    res.status(response.status).json(response.data);
  } catch (error: any) {
    console.error(`[Proxy] Error forwarding request: ${error.message}`);
    saveStats(); // Save incremented count even on error
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
  }
});

// Stats endpoint for the dashboard
app.get('/stats', (req: Request, res: Response) => {
  res.json({
    requestCount,
    modelUsed,
    lastResponse
  });
});

app.listen(port, () => {
  console.log(`[Proxy] Claude Proxy listening at http://localhost:${port}`);
  console.log(`[Proxy] Forwarding to: ${targetUrl}`);
  console.log(`[Proxy] Swagger UI available at http://localhost:${port}/docs`);
});
