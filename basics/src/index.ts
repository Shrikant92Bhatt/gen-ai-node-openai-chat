import { OpenAI } from "openai";
import  {encoding_for_model} from "tiktoken"
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function main() {
    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            { role: "system", content: `you can respond in JSON format  like this
                {"shortAns": "<short answer>", "coolnessLevel": 0-10, "youranswer": "<detailed answer>"}
                
                } ` },
            { role: "user", content: "What is the capital of France?" },
        ],
        max_tokens: 500,
        temperature: 0.7,
        n: 2,
        seed: 42,
    });

    const finalMessage = response.choices?.[0]?.message?.content;
    console.log("Final assistant message:", finalMessage);
        console.log("Final response:", response);

}

function getTokenCount(text: string): number {
    const encoder = encoding_for_model("gpt-4o-mini");
    return encoder.encode(text).length;
}
console.log("Token count for 'What is the capital of France?':", getTokenCount("What is the capital of France?"));
main();
