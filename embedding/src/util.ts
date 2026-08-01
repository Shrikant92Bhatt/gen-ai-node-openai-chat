import { readFileSync, writeFileSync } from "fs";
import OpenAI from "openai";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export type EmbeddingResponse = {
    data: Array<{ embedding: number[] }>;
};

export type DataWithEmbedding = {
    input: string;
    embedding: number[];
};

export const createEmbedding = async (input: string | string[]): Promise<EmbeddingResponse> => {
    const resp = await openai.embeddings.create({
        input,
        model: "text-embedding-3-large",
    });
    return resp as EmbeddingResponse;
};

export const loadData = async <T>(filename: string): Promise<T> => {
    const path = join(__dirname, filename);
    const rawData = readFileSync(path);
    return JSON.parse(rawData.toString()) as T;
};

export const saveDataToJsonFile = async (data: unknown, fileName: string): Promise<void> => {
    const dataString = JSON.stringify(data);
    const dataBuffer = Buffer.from(dataString);
    const path = join(__dirname, fileName);
    writeFileSync(path, dataBuffer);
    console.log(`saved data to ${fileName}`);
};

export function dotProduct(a: number[], b: number[]) {
    return a.map((value, index) => value * b[index]).reduce((sum, value) => sum + value, 0);
}

export function cosineSimilarity(a: number[], b: number[]) {
    const product = dotProduct(a, b);
    const aMagnitude = Math.sqrt(a.map(value => value * value).reduce((sum, value) => sum + value, 0));
    const bMagnitude = Math.sqrt(b.map(value => value * value).reduce((sum, value) => sum + value, 0));
    return product / (aMagnitude * bMagnitude);
}
