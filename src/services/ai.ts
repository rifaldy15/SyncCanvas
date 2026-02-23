import { genAI, GEMINI_MODEL } from "@/lib/gemini";
import { groq, GROQ_MODEL } from "@/lib/groq";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

const SYSTEM_PROMPT = `You are SyncCanvas AI, an intelligent writing assistant embedded in a collaborative document editor.

Your capabilities:
- Summarize document content
- Rewrite or improve text
- Brainstorm ideas
- Answer questions about the document
- Generate content (outlines, drafts, lists)
- Fix grammar and spelling
- Translate text

Rules:
- Be concise and helpful
- Use markdown formatting in responses
- When the user shares document content, consider it as context
- If asked to rewrite, provide the improved version directly
- Be creative but professional`;

// ── Gemini (Primary) ────────────────────────────────

async function* streamWithGemini(
  messages: ChatMessage[],
  documentContent?: string,
): AsyncGenerator<string> {
  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction: documentContent
      ? `${SYSTEM_PROMPT}\n\nCurrent document content:\n\n${documentContent}`
      : SYSTEM_PROMPT,
  });

  const geminiMessages = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? ("model" as const) : ("user" as const),
      parts: [{ text: m.content }],
    }));

  const history = geminiMessages.slice(0, -1);
  const lastMessage = geminiMessages[geminiMessages.length - 1];

  const chat = model.startChat({ history });
  const result = await chat.sendMessageStream(lastMessage.parts[0].text);

  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) yield text;
  }
}

// ── Groq (Fallback) ─────────────────────────────────

async function* streamWithGroq(
  messages: ChatMessage[],
  documentContent?: string,
): AsyncGenerator<string> {
  const systemMessages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
  ];

  if (documentContent) {
    systemMessages.push({
      role: "system",
      content: `Current document content:\n\n${documentContent}`,
    });
  }

  const allMessages = [...systemMessages, ...messages];

  const stream = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: allMessages,
    temperature: 0.7,
    max_tokens: 2048,
    stream: true,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) yield content;
  }
}

// ── Public API (Gemini → Groq fallback) ─────────────

export async function chatWithAI(
  messages: ChatMessage[],
  documentContent?: string,
): Promise<string> {
  // Try Gemini first
  try {
    const model = genAI.getGenerativeModel({
      model: GEMINI_MODEL,
      systemInstruction: documentContent
        ? `${SYSTEM_PROMPT}\n\nCurrent document content:\n\n${documentContent}`
        : SYSTEM_PROMPT,
    });

    const geminiMessages = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role === "assistant" ? ("model" as const) : ("user" as const),
        parts: [{ text: m.content }],
      }));

    const history = geminiMessages.slice(0, -1);
    const lastMessage = geminiMessages[geminiMessages.length - 1];
    const chat = model.startChat({ history });
    const result = await chat.sendMessage(lastMessage.parts[0].text);
    return result.response.text();
  } catch (error) {
    console.warn(
      "[AI] Gemini failed, falling back to Groq:",
      (error as Error).message,
    );
  }

  // Fallback to Groq
  const systemMessages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
  ];
  if (documentContent) {
    systemMessages.push({
      role: "system",
      content: `Current document content:\n\n${documentContent}`,
    });
  }
  const allMessages = [...systemMessages, ...messages];
  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: allMessages,
    temperature: 0.7,
    max_tokens: 2048,
  });
  return completion.choices[0]?.message?.content ?? "No response generated.";
}

export async function* streamChatWithAI(
  messages: ChatMessage[],
  documentContent?: string,
): AsyncGenerator<string> {
  // Try Gemini first
  try {
    let hasYielded = false;
    for await (const chunk of streamWithGemini(messages, documentContent)) {
      hasYielded = true;
      yield chunk;
    }
    if (hasYielded) return;
  } catch (error) {
    console.warn(
      "[AI] Gemini streaming failed, falling back to Groq:",
      (error as Error).message,
    );
  }

  // Fallback to Groq
  yield* streamWithGroq(messages, documentContent);
}
