import { OpenAI } from "openai";
import { optimizeContext } from "./context";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });


const context:OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: `you are an very helpful chatbot` }
];

async function createChatCompletion(userInput: string) {
    context.push({ role: "user", content: userInput });

    const trimmedContext = await optimizeContext(openai, context);

    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: trimmedContext,
        max_tokens: 500,
    });

    const finalMessage = response.choices?.[0]?.message?.content;
    context.push({ role: "assistant", content: finalMessage || "" });
    console.log("Final assistant message:", finalMessage);
}
process.stdin.addListener("data", async (data) => {
    const userInput = data.toString().trim();
    if (userInput.toLowerCase() === "exit") {
        console.log("Exiting the chat. Goodbye!");
        process.exit(0);
    }
    await createChatCompletion(userInput);
});

console.log("Welcome to the chat! Type your message and press Enter. Type 'exit' to quit.");



console.log("Hello from chat_app!");

