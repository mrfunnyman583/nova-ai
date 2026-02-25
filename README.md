## Nova AI — Free AI Chatbot

Nova AI is a sleek, minimal, **next‑gen chat interface** powered by **open‑source language models** via the Hugging Face Inference API.  
It’s designed to feel like a modern AI assistant: animated background, polished chat bubbles, keyboard‑first UX, and **multi‑chat history** — all with **no sign‑up required**.

Live demo: `https://nova-ai-one-phi.vercel.app`

---

### Features

- **Conversational AI chat**
  - Chat with Nova AI using a simple, focused interface.
  - Messages support **Markdown**, **GitHub‑style formatting**, and **inline / block math** rendered with KaTeX.
- **Multiple free open‑source models**
  - Uses the official `@huggingface/inference` SDK.
  - Tries several instruction‑tuned models in sequence (e.g. Qwen, LLaMA, Mixtral, Gemma) until a response is produced.
  - Friendly fallback messaging when models are cold‑starting or busy.
- **Persistent chat history**
  - Start as many conversations as you like with **New Chat**.
  - A **“Recent Chats”** strip lets you switch between past conversations in a single click.
  - Chats are persisted in `localStorage`, so history survives page reloads on the same browser.
- **Modern UI / UX**
  - Full‑screen animated shader background (`<AnoAI />`).
  - Glassmorphism panels, subtle glows, smooth animations.
  - Keyboard‑friendly:
    - `Enter` to send
    - `Shift+Enter` for a new line
  - Auto‑resizing input textarea with reasonable max height.
- **Copy responses**
  - One‑click copy button on assistant messages with a quick visual “copied” state.

---

### Tech Stack

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/)
- **Language**: TypeScript / React
- **Styling**:
  - Tailwind CSS 4 (utility‑first styling)
  - Custom animated shader background component under `src/components/ui/animated-shader-background.tsx`
- **AI / Markdown / Math**:
  - `@huggingface/inference` for inference calls
  - `react-markdown`, `remark-gfm`, `remark-math`, `rehype-katex` for rich text & LaTeX rendering
- **Icons**: `lucide-react`

---

### Architecture Overview

- **`src/app/layout.tsx`**
  - Defines the root layout, global fonts, and imports global styles + KaTeX CSS.
  - Sets metadata such as title and description for the Nova AI experience.

- **`src/app/page.tsx`**
  - Main client component (`"use client"`).
  - Manages:
    - `chats`: list of chat sessions (id, title, messages, timestamps)
    - `activeChatId`: which chat is currently visible
    - `messages`: derived from the active chat
    - input state, loading state, copy state
  - Persists `chats` to `localStorage` (`nova_chats_v1`) and restores them on load.
  - Renders:
    - Header with Nova AI branding and **New Chat** button.
    - **Recent Chats** pill row for quick switching.
    - Scrollable messages pane with user/assistant bubbles.
    - Auto‑scrolls to bottom when new messages arrive.
    - Input form with auto‑resizing textarea and send button.

- **`src/app/api/chat/route.ts`**
  - Next.js **route handler** for `POST /api/chat`.
  - Accepts an array of `{ role, content }` messages.
  - Prepends a system prompt describing Nova AI’s behavior.
  - Iterates through a list of model IDs:
    - Calls `hf.chatCompletion({ model, messages, max_tokens, temperature })`.
    - Returns the first non‑empty reply it gets.
    - Logs and skips models that error out, moving to the next one.
  - Provides a friendly fallback message when no model can respond (cold start / busy).

- **`src/lib/utils.ts`**
  - Small `cn` utility helper for className merging (`clsx` + `tailwind-merge`).

---

### Requirements

- **Node.js**: 18+ (recommended 20+)
- **Package manager**: `npm` (comes with Node)
- **Hugging Face token**:
  - Create a token at `https://huggingface.co/settings/tokens`.
  - Add it to your environment as `HF_TOKEN`.

---

### Local Development

1. **Clone the repository**

```bash
git clone https://github.com/mrfunnyman583/nova-ai.git
cd nova-ai
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment**

Create a `.env.local` file in the project root:

```bash
HF_TOKEN=your_huggingface_inference_token_here
```

> This is required so the `/api/chat` route can call the Hugging Face Inference API.

4. **Run the development server**

```bash
npm run dev
```

Then open `http://localhost:3000` in your browser.

---

### Usage

- Type your question or prompt into the input at the bottom.
- Press **Enter** to send (or click the send icon).
- Use **Shift+Enter** to add a new line without sending.
- Use **New Chat** to start a separate conversation while preserving older ones.
- Switch between previous conversations using the **Recent Chats** pills near the top.
- Click the **copy** icon on any assistant message to copy its content.

---

### Linting & Quality

This project uses **ESLint 9** with `eslint-config-next`.

- Run lint:

```bash
npm run lint
```

You should see a clean run with no errors or warnings after the latest changes (including the multi‑chat history feature).

---

### Deployment

The app is designed to deploy cleanly on [Vercel](https://vercel.com/):

1. Push your changes to GitHub (this repo).
2. Create a new Vercel project and import the repo.
3. Set the `HF_TOKEN` environment variable in your Vercel project settings.
4. Deploy — Vercel will build and host the Next.js app.

The official deployed instance referenced in this repo is:

- `https://nova-ai-one-phi.vercel.app`

---

### Security & Privacy Notes

- The app sends your prompts and conversation snippets to the selected Hugging Face models through their Inference API.
- No explicit server‑side persistence of conversations is implemented; on the frontend, chat history is stored **only in your browser’s `localStorage`**.
- Treat this as a demo / personal tool rather than a production‑grade, privacy‑hardened system.

---

### Roadmap / Ideas

- Model selector UI (choose which model to use per chat).
- “System prompt” editor so you can customize Nova AI’s persona.
- Export / import chat history.
- Dark/light theme toggle.

Contributions and suggestions are welcome — feel free to open issues or PRs. 🎯
