import { fileURLToPath } from "url";
import { similarity } from "./sililar.ts";
import { createEmbedding, loadData, saveDataToJsonFile } from "./util.ts";

export async function buildEmbeddings(): Promise<void> {
    const data = await loadData<string[]>('embd/data.json');
    const embeddingResponse = await createEmbedding(data);
    const dataWithEmbedding: Array<{ input: string; embedding: number[] }> = [];

    for (let index = 0; index < data.length; index++) {
        dataWithEmbedding.push({
            input: data[index],
            embedding: embeddingResponse.data[index].embedding,
        });
    }
    await saveDataToJsonFile(dataWithEmbedding, "dataWithEmbedding.json");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    similarity("cheeta");
}
