# Testing Guide: Claude Proxy Stack

This guide explains how to verify that your proxy, mock API, and dashboard are working correctly.

## Why use the Mock API?

The Mock API is optional if you have Ollama or another provider running. It is useful for:

- **Stability**: Returns predictable, fast responses during proxy debugging.
- **Claude Code Simulation**: The included `npm run simulate` script acts as a virtual Claude Code CLI to ensure your headers and tool-forwarding logic work.
- **Fallback**: It acts as the default target if no `ANTHROPIC_BASE_URL` is set.

## 1. Startup

Open three separate terminals and start the services:

- **Terminal 1 (Mock API)**:
  ```bash
  cd mock-claude-api
  npm run dev
  ```
- **Terminal 2 (Proxy)**:
  ```bash
  cd claude-proxy
  npm run dev
  ```
- **Terminal 3 (Dashboard)**:
  ```bash
  cd dashboard
  npm run dev
  ```

## 2. Dynamic Testing (Recommended)

We've included a simulation script that sends a "Claude Code" style request. You can now use the `-m` flag to send custom prompts:

```bash
cd mock-claude-api
npm run simulate -- -m "Hello, please tell me a joke about robots."
```

Check the output in this terminal and verify the response on the **Dashboard**.

## 3. Manual Testing (curl)

Copy and paste this command to test the proxy endpoint manually:

```bash
curl http://localhost:3000/v1/messages \
  -X POST \
  -H "Content-Type: application/json" \
  -H "anthropic-version: 2023-06-01" \
  -d '{
    "model": "claude-3-sonnet-20240229",
    "messages": [
      {"role": "user", "content": "Hello via Proxy!"}
    ]
  }'
```

## 4. Verification

1. **Logs**: View the Proxy terminal to see the request being forwarded.
2. **Dashboard**: Open `http://localhost:5173`. You should see the **Total Requests** count increment and the **Last AI Response** updated.
3. **Swagger**:
   - Proxy Documentation: `http://localhost:3000/docs`
   - Mock API Documentation: `http://localhost:3001/docs`

## 5. Testing with Ollama

If you want to test against Ollama instead of the Mock API:

1. Ensure Ollama is running (`ollama serve`).
2. Update `.env`: `ANTHROPIC_BASE_URL=http://localhost:11434`.
3. Restart the Proxy.
4. Note: Ollama must support the Anthropic `/v1/messages` endpoint for this to work natively (or use a compatibility layer).
