import {ChatOpenAI, OpenAIEmbeddings} from "@langchain/openai";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { Document } from "@langchain/core/documents";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";


const model = new ChatOpenAI({
    modelName: "gpt-4o-mini",
    temperature: 0.7,
    maxTokens: 1000,
    // verbose: true,
    apiKey: process.env.OPENAI_API_KEY,
});

const embeddings = new OpenAIEmbeddings({
    model: "text-embedding-3-small",
    apiKey: process.env.OPENAI_API_KEY,
});

const myData = [
    "My name is John and I love programming.",
    "My name is Sarah and I enjoy hiking.",
    "My name is Alex and I like to read books.",
    "My name is Emily and I have a pet cat.",
    "I enjoy hiking and exploring new places.",
    "My favorite programming language is TypeScript.",
    "I have a pet dog named Max.",
    "I like to read books in my free time.",
    "My favorite food is pizza and I love trying new recipes.",
    "My faviorite food is pasta and I enjoy cooking Italian dishes.",
]

const questions = [
    "What is my name?",
    "What is my favorite food?"
]


export async function vectorDB_RAG() {
      const parser = new StringOutputParser();
    const vectorStore = new MemoryVectorStore(embeddings);
    await vectorStore.addDocuments(myData.map((content) => new Document({ pageContent: content })));


    // create Data retrival 

    const retriever = vectorStore.asRetriever({
        k: 2,
    });
    const result = await retriever._getRelevantDocuments(questions[1]);

    console.log("Result for question 1:", result.map((doc) => doc.pageContent));


    // Build Template for RAG
    const template = ChatPromptTemplate.fromMessages([
       ["system", "Answere the user question based on the context : {context}"],
       ["user", "{input}"]
    ]);

    const chain  = template.pipe(model).pipe(parser);
    const response = await chain.invoke({
        input: questions[1],
        context: result.map((doc) => doc.pageContent).join("\n")
    });
    console.log("Response for question 1:", response);

}