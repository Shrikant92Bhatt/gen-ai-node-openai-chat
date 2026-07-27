import { OpenAI } from "openai";
import { encoding_for_model } from "tiktoken";

// Every completion re-sends the full message history, so an unbounded context
// grows the token cost (and eventually the request size) with every turn.
// This caps what actually gets sent, without discarding the local history.
const MAX_CONTEXT_TOKENS = 700;
const encoder = encoding_for_model("gpt-4o-mini");

// Messages that age out of the token window are folded in here instead of being
// dropped outright, so the model stays grounded in earlier context (fewer
// inconsistent/contradictory answers) instead of losing it abruptly.
let runningSummary = "";
let summarizedCount = 0;

function countMessageTokens(message: OpenAI.Chat.Completions.ChatCompletionMessageParam): number {
    const content = typeof message.content === "string" ? message.content : "";
    return encoder.encode(content).length + 4; // ~4 tokens overhead per message (role, separators)
}

async function summarizeMessages(openai: OpenAI, messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[]): Promise<string> {
    const transcript = messages
        .map(m => `${m.role}: ${typeof m.content === "string" ? m.content : ""}`)
        .join("\n");

    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.2,
        messages: [
            { role: "system", content: "Condense the following conversation excerpt into a short, factual paragraph capturing key facts, decisions, and details the assistant should keep remembering. Be concise." },
            { role: "user", content: transcript },
        ],
    });

    return response.choices?.[0]?.message?.content?.trim() || "";
}

export async function optimizeContext(openai: OpenAI, messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[]): Promise<OpenAI.Chat.Completions.ChatCompletionMessageParam[]> {
    const systemMessages = messages.filter(m => m.role === "system");
    const otherMessages = messages.filter(m => m.role !== "system");

    let totalTokens = systemMessages.reduce((sum, m) => sum + countMessageTokens(m), 0);
    const kept: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
    let keepFromIndex = otherMessages.length;

    // Walk from the newest message backwards, keeping as many as fit in the budget.
    for (let i = otherMessages.length - 1; i >= 0; i--) {
        const tokens = countMessageTokens(otherMessages[i]);
        if (totalTokens + tokens > MAX_CONTEXT_TOKENS) break;
        totalTokens += tokens;
        kept.unshift(otherMessages[i]);
        keepFromIndex = i;
    }

    // Fold any newly-aged-out messages into the running summary (only once each,
    // tracked via summarizedCount, since otherMessages keeps growing every turn).
    if (keepFromIndex > summarizedCount) {
        const newlyDropped = otherMessages.slice(summarizedCount, keepFromIndex);
        const newSummary = await summarizeMessages(openai, newlyDropped);
        runningSummary = runningSummary ? `${runningSummary} ${newSummary}` : newSummary;
        summarizedCount = keepFromIndex;
    }

    const summaryMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = runningSummary
        ? [{ role: "system", content: `Summary of earlier conversation: ${runningSummary}` }]
        : [];

    return [...systemMessages, ...summaryMessages, ...kept];
}
