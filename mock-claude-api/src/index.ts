import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import * as fs from 'fs';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const app = express();
const port = 3001;
const modelUsed = process.env.MODEL_USED || 'unknown-model';

app.use(cors());
app.use(express.json());

// Load Swagger document
const swaggerDocument = JSON.parse(fs.readFileSync(path.join(__dirname, '../swagger.json'), 'utf8'));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.post('/v1/messages', (req: Request, res: Response) => {
  const { model, messages, system, tools, betas } = req.body;
  console.log(`[Mock API] Received request for model: ${model}`);
  if (system) console.log(`[Mock API] System Prompt: ${system.substring(0, 50)}...`);
  if (tools) console.log(`[Mock API] Tools Provided: ${tools.map((t: any) => t.name).join(', ')}`);
  if (betas) console.log(`[Mock API] Betas Enabled: ${betas.join(', ')}`);

  // Basic Anthropic-compliant response
  // If tools are provided, maybe simulate a tool use?
  const response = {
    id: `msg_${Math.random().toString(36).substring(7)}`,
    type: 'message',
    role: 'assistant',
    model: modelUsed,
    content: [
      {
        type: 'text',
        text: `Hello! I am a mock Claude emulating ${modelUsed}. I see you are using ${tools ? tools.length : 0} tools and ${betas ? betas.length : 0} betas. Your last message was: "${messages?.[messages.length - 1]?.content || 'nothing'}"`
      }
    ],
    stop_reason: 'end_turn',
    stop_sequence: null,
    usage: {
      input_tokens: 15,
      output_tokens: 25
    }
  };

  res.json(response);
});

app.listen(port, () => {
  console.log(`[Mock API] Mock Claude API listening at http://localhost:${port}`);
  console.log(`[Mock API] Emulating model: ${modelUsed}`);
});
