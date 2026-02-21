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
const modelUsed = process.env.MODEL_USED || 'ministral-3:3b';

let requestCount = 0;

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
    
    res.status(response.status).json(response.data);
  } catch (error: any) {
    console.error(`[Proxy] Error forwarding request: ${error.message}`);
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
    modelUsed
  });
});

app.listen(port, () => {
  console.log(`[Proxy] Claude Proxy listening at http://localhost:${port}`);
  console.log(`[Proxy] Forwarding to: ${targetUrl}`);
  console.log(`[Proxy] Swagger UI available at http://localhost:${port}/docs`);
});
