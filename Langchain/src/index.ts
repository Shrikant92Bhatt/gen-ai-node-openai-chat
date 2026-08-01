import {ChatOpenAI} from "@langchain/openai";
import { commaSeparatedListParser, runFromTemplate, runFromTemplate2, stringParser, structuredOutputParser } from "./promtTemplate.ts";
import { vectorDB_RAG } from "./RAG/Index.ts";
import { vectorDB_RAG_WebScrapping } from "./RAG/web.ts";
import { vectorDB_RAG_PDF } from "./RAG/pdf.ts";
import { vectorDB_RAG_PDF_ChromaDB } from "./RAG/chromaDB.ts";
const model = new ChatOpenAI({
    modelName: "gpt-4o-mini",
    temperature: 0.9,
    maxTokens: 1000,
    // verbose: true,
    apiKey: process.env.OPENAI_API_KEY,
});


async function run() {
    // explore invoke & strem 
    const response = await model.batch([
        // {
        //     role: "system",
        //     content: "You are a helpful assistant that translates English to French.",
        // },
        // {
        //     role: "user",
        //     content: "Translate the following English text to French: 'I love programming.'",
        // },
        "Hello",
        "can you tell me about langchain and tavily?",
    ]);
    console.log(response);

}

// run();
// runFromTemplate();
// runFromTemplate2();
// stringParser()
// commaSeparatedListParser();
// structuredOutputParser();
// vectorDB_RAG();
// vectorDB_RAG_WebScrapping();
// vectorDB_RAG_PDF();
vectorDB_RAG_PDF_ChromaDB()