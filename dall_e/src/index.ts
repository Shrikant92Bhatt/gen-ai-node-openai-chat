import { OpenAI } from "openai";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// dall-e-3 only accepts these three sizes, and n must be 1 (ask for more than
// one image by calling generate again).
type Size = "1024x1024" | "1792x1024" | "1024x1792";

const MODEL = "dall-e-3";
const SIZE: Size = "1024x1024";
const QUALITY = "standard"; // "hd" costs more but keeps finer detail
const STYLE = "vivid";      // "natural" for less hyper-real, more photographic output
const OUTPUT_DIR = path.resolve("images");

// b64_json instead of url: the returned URLs expire after ~1 hour, and this
// saves a second round trip to download the bytes.
async function generateImage(prompt: string) {
    console.log(`Generating (${MODEL}, ${SIZE}, ${QUALITY}/${STYLE})...`);

    const response = await openai.images.generate({
        model: MODEL,
        prompt,
        n: 1,
        size: SIZE,
        quality: QUALITY,
        style: STYLE,
        response_format: "b64_json",
    });

    const image = response.data?.[0];
    if (!image?.b64_json) {
        console.error("No image returned.");
        return;
    }

    // DALL·E 3 rewrites every prompt before rendering it — printing the revised
    // version shows what the model actually drew, which is what you iterate on.
    if (image.revised_prompt) {
        console.log("Revised prompt:", image.revised_prompt);
    }

    const filePath = await saveImage(image.b64_json, prompt);
    console.log("Saved:", filePath);
}

async function saveImage(b64: string, prompt: string): Promise<string> {
    await mkdir(OUTPUT_DIR, { recursive: true });

    const slug = prompt
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 40) || "image";
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filePath = path.join(OUTPUT_DIR, `${stamp}-${slug}.png`);

    await writeFile(filePath, Buffer.from(b64, "base64"));
    return filePath;
}

async function run(prompt: string) {
    try {
        await generateImage(prompt);
    } catch (error) {
        // Content-policy rejections and rate limits both land here; surfacing the
        // message keeps the prompt loop alive instead of killing the process.
        console.error("Generation failed:", error instanceof Error ? error.message : error);
    }
}

// One-shot mode: npm start -- "a red panda coding at night"
const promptFromArgs = process.argv.slice(2).join(" ").trim();

if (promptFromArgs) {
    await run(promptFromArgs);
} else {
    process.stdin.addListener("data", async (data) => {
        const prompt = data.toString().trim();
        if (!prompt) return;
        if (prompt.toLowerCase() === "exit") {
            console.log("Exiting. Goodbye!");
            process.exit(0);
        }
        await run(prompt);
        console.log("\nDescribe another image, or type 'exit' to quit.");
    });

    console.log("DALL·E image generator. Describe an image and press Enter. Type 'exit' to quit.");
}
