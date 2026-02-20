import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const app = express();
const port = 3001;
const modelUsed = process.env.MODEL_USED || 'unknown-model';

app.use(cors());
app.use(express.json());

app.post('/v1/messages', (req: Request, res: Response) => {
  console.log(`[Mock API] Received request for model: ${req.body.model}`);
  
  // Basic Anthropic-compliant response
  const response = {
    id: `msg_${Math.random().toString(36).substring(7)}`,
    type: 'message',
    role: 'assistant',
    model: modelUsed,
    content: [
      {
        type: 'text',
        text: `Hello! I am a mock Claude emulating ${modelUsed}. You sent: "${req.body.messages?.[req.body.messages.length - 1]?.content || 'nothing'}"`
      }
    ],
    stop_reason: 'end_turn',
    stop_sequence: null,
    usage: {
      input_tokens: 10,
      output_tokens: 20
    }
  };

  res.json(response);
});

app.listen(port, () => {
  console.log(`[Mock API] Mock Claude API listening at http://localhost:${port}`);
  console.log(`[Mock API] Emulating model: ${modelUsed}`);
});
