import { createEmbedding, cosineSimilarity, loadData, dotProduct } from "./util.ts";
import type { DataWithEmbedding } from "./util.ts";

export async function similarity(input: string): Promise<void> {
    const dataWithEmbeding = await loadData<DataWithEmbedding[]>('dataWithEmbedding.json');
    const inputEmbeding = await createEmbedding(input);

    const sililarities: {
        input: string,
        similarity: number
    }[] = [];
    for (const entry of dataWithEmbeding) {
        const similarity = cosineSimilarity(entry.embedding, inputEmbeding.data[0].embedding);
        sililarities.push({
            input: entry.input,
            similarity
        })
    }

    console.log(`similarity of ${input} with:`)
    const sortedSimilarities = sililarities.sort((a, b) => b.similarity - a.similarity);
    sortedSimilarities.forEach(sililarity => {
        console.log(`${sililarity.input}: ${sililarity.similarity}`)
    })
}

export async function similarity2(input: string): Promise<void> {
    const dataWithEmbeding = await loadData<DataWithEmbedding[]>('dataWithEmbedding.json');
    const inputEmbeding = await createEmbedding(input);

    const sililarities: {
        input: string,
        similarity: number
    }[] = [];
    for (const entry of dataWithEmbeding) {
        const similarity = dotProduct(entry.embedding, inputEmbeding.data[0].embedding);
        sililarities.push({
            input: entry.input,
            similarity
        })
    }

    console.log(`similarity of ${input} with:`)
    const sortedSimilarities = sililarities.sort((a, b) => b.similarity - a.similarity);
    sortedSimilarities.forEach(sililarity => {
        console.log(`${sililarity.input}: ${sililarity.similarity}`)
    })
}