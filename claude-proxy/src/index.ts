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
const modelUsed = process.env.MODEL_USED || 'devstral-2';

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
  
  try {
    const response = await axios.post(`${targetUrl}/v1/messages`, req.body, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || 'fake-key',
        'anthropic-version': req.headers['anthropic-version'] || '2023-06-01'
      }
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
