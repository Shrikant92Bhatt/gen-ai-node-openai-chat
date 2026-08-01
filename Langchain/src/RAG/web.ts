import {ChatOpenAI, OpenAIEmbeddings} from "@langchain/openai";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";


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


const question = "What are langchain and tavily and cheerio?"


export async function vectorDB_RAG_WebScrapping() {
    //Loader

    const loader = new CheerioWebBaseLoader("https://docs.langchain.com/oss/javascript/langchain/overview");
    const docs = await loader.load();
    // splitter 
    
    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 200,
        chunkOverlap: 20,
    });
    const splitDocs = await splitter.splitDocuments(docs);
    console.log("Split Docs:", splitDocs.map((doc) => doc.pageContent));
    
    const parser = new StringOutputParser();
    const vectorStore = new MemoryVectorStore(embeddings);
    await vectorStore.addDocuments(splitDocs);


    // create Data retrival 

    const retriever = vectorStore.asRetriever({
        k: 2,
    });
    const result = await retriever._getRelevantDocuments(question);

    console.log("Result for question 1:", result.map((doc) => doc.pageContent));


    // Build Template for RAG
    const template = ChatPromptTemplate.fromMessages([
       ["system", "Answere the user question based on the context : {context}"],
       ["user", "{input}"]
    ]);

    const chain  = template.pipe(model).pipe(parser);
    const response = await chain.invoke({
        input: question,
        context: result.map((doc) => doc.pageContent).join("\n")
    });
    console.log("Response for question 1:", response);

}