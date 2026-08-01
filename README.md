# Gen AI Node OpenAI Chat

Node.js + TypeScript playground for building chat features on top of the [OpenAI API](https://platform.openai.com/docs/api-reference) — starting from a single completion call, then layering on token-aware context management, function/tool calling, and image generation.

## Tech Stack

<p>
  <img src="https://cdn.simpleicons.org/nodedotjs" alt="Node.js" width="48" height="48" />
  <img src="https://cdn.simpleicons.org/typescript" alt="TypeScript" width="48" height="48" />
  <img src="https://cdn.simpleicons.org/langchain" alt="LangChain" width="48" height="48" />
  <img src="https://cdn.simpleicons.org/langgraph" alt="LangGraph" width="48" height="48" />
  <img src="https://cdn.simpleicons.org/huggingface" alt="Hugging Face" width="48" height="48" />
</p>
<p>
  <img src="https://img.shields.io/badge/OpenAI%20API-412991?style=flat-square" alt="OpenAI API" />
  <img src="https://img.shields.io/badge/DALL·E-412991?style=flat-square" alt="DALL·E" />
  <img src="https://img.shields.io/badge/Function%20%2F%20Tool%20Calling-412991?style=flat-square" alt="Function / Tool Calling" />
  <img src="https://img.shields.io/badge/Embeddings-412991?style=flat-square" alt="Embeddings" />
</p>

## Repo structure

```
.
├── basics/      Minimal single-file example: one-shot completion + token counting
├── chat_app/    Interactive chat with context optimization and tool calling
│   ├── src/basic_chat/   Interactive stdin chatbot with bounded context
│   └── src/Project/      Function/tool-calling example (order status lookup)
└── dall_e/      Image generation with DALL·E 3 (prompt in, PNG saved to disk)
```

Each project is independent — its own `package.json`, `tsconfig.json`, and `.env`.

## Prerequisites

- Node.js 22.6+ (tested on v24). All projects run TypeScript source files directly via Node's built-in TypeScript support — no separate compile step needed for `npm start`.
- An [OpenAI API key](https://platform.openai.com/api-keys).

## Setup

For each project (`basics/`, `chat_app/`, and `dall_e/`):

```bash
cd basics   # or chat_app, or dall_e
npm install
```

Create a `.env` file in that project's folder with your key:

```
OPENAI_API_KEY=sk-...
```

`.env` is git-ignored in every project — never commit real keys.

## basics/

A single file (`src/index.ts`) that:
- Sends one chat completion request (`gpt-4o-mini`) and prints the reply.
- Counts tokens for a sample string using `tiktoken`.

Run it:

```bash
cd basics
npm start
```

## chat_app/

### `src/basic_chat` — interactive chat with bounded context

A stdin-driven chatbot loop. Every message you type is appended to an in-memory `context` array and sent back to the model along with the full history — which is exactly the problem this project solves: an unbounded context grows the token cost of every request as the conversation gets longer.

`src/context.ts` exports `optimizeContext(openai, messages)`, which:
1. Counts tokens per message with `tiktoken` and walks the history newest-first, keeping as many recent messages as fit under a token budget (`MAX_CONTEXT_TOKENS`).
2. Once older messages fall outside that budget, instead of dropping them outright, it folds them into a running summary via a low-`temperature` (0.2) summarization call — so the model stays grounded in earlier context rather than losing it abruptly.
3. Returns `[...systemMessages, summaryMessage, ...recentMessages]` — a bounded set sent to the model, while the full untrimmed history is still kept locally.

To run this version, point `chat_app`'s `start` script at it:

```json
"start": "node --enable-source-maps --env-file .env src/basic_chat/index.ts"
```

```bash
cd chat_app
npm start
# Type a message and press Enter. Type "exit" to quit.
```

### `src/Project` — function/tool calling

Demonstrates OpenAI [function calling](https://platform.openai.com/docs/guides/function-calling): the model is given two local tools (`getTimeOFtheDay`, `getOrderStatus`), decides when to call one, and a second request feeds the tool's result back in so the model can answer using real data instead of guessing.

This is the project currently wired up in `chat_app/package.json`:

```bash
cd chat_app
npm start
```

### Why relative imports use a `.ts` extension

`chat_app` runs TypeScript directly via Node's native (unflagged, Node 22.6+/23.6+) type-stripping support — there's no bundler or loader resolving imports at runtime. That means relative imports must reference the file's real extension (`./context.ts`, not `./context.js` or extension-less) — an IDE's "organize imports" or auto-import may try to strip this; if `npm start` suddenly can't resolve a module, check the import extension first.

## dall_e/

A single file (`src/index.ts`) that turns a text prompt into an image with [DALL·E 3](https://platform.openai.com/docs/guides/images) and writes the PNG to `images/` (git-ignored), named with a timestamp plus a slug of the prompt.

Two ways to run it:

```bash
cd dall_e

# One-shot
npm start -- "a red panda coding at night, watercolor"

# Interactive — describe an image and press Enter, "exit" to quit
npm start
```

Details worth knowing:
- Requests use `response_format: "b64_json"` rather than a URL — the returned URLs expire after about an hour, and the base64 payload skips a second round trip to download the bytes.
- DALL·E 3 rewrites every prompt before rendering it. The script prints the returned `revised_prompt` so you can see what the model actually drew and iterate on that.
- `n` must be `1` for DALL·E 3, and the only accepted sizes are `1024x1024`, `1792x1024`, and `1024x1792`. Size, `quality` (`standard`/`hd`), and `style` (`vivid`/`natural`) are constants at the top of the file.
- Content-policy rejections and rate limits are caught per request, so the interactive loop survives a rejected prompt instead of exiting.

## Notes

- Models differ in supported parameters — e.g. reasoning models like `gpt-5-mini` require `max_completion_tokens` instead of the legacy `max_tokens`, and reasoning tokens count against that same budget (leave headroom or the response can come back empty).
- All three projects use ESM (`"type": "module"` in `package.json`).

## License

MIT
