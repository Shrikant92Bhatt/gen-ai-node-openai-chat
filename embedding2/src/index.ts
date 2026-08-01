import { fileURLToPath } from "url";
import OpenAI from "openai";
import { ChromaClient } from "chromadb";

const openai = new OpenAI();
const chroma = new ChromaClient({ path: "http://localhost:8000" });

const COLLECTION_NAME = "embedding2";

async function embed(texts: string[]): Promise<number[][]> {
    const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: texts,
    });
    return response.data.map((item) => item.embedding);
}

export async function run(): Promise<void> {
    const documents = ["hello world", "goodbye world"];
    const embeddings = await embed(documents);

    const collection = await chroma.getOrCreateCollection({ name: COLLECTION_NAME });
    await collection.add({
        ids: documents.map((_, index) => `doc-${index}`),
        embeddings,
        documents,
    });

    const [queryEmbedding] = await embed(["hi there"]);
    const results = await collection.query({
        queryEmbeddings: [queryEmbedding],
        nResults: 1,
    });

    console.log(results);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    run();
}
