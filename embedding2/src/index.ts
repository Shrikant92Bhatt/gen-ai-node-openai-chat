import { fileURLToPath } from "url";
import { CloudClient } from "chromadb";

const client = new CloudClient();

export async function run(): Promise<void> {
    const collection = await client.getOrCreateCollection({ name: "my_collection" });

    await collection.upsert({
        ids: ["id1", "id2"],
        documents: [
            "This is a document about pineapple",
            "This is a document about oranges",
        ],
    });

    const results = await collection.query({
        queryTexts: ["This is a query document about florida"],
        nResults: 2,
    });

    console.log(results);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    run();
}
