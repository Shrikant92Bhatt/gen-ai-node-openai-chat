import { createReadStream, writeFileSync } from "fs";
import OpenAI from "openai";
const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY});

const text2speechFun = async () => {
    const resp = await openai.audio.transcriptions.create({
        file: await createReadStream("src/text2speech/Everything-I-Do-I-Do-It-For-You.mp3"),
        model: "gpt-4o-mini-transcribe",
        language: 'en',

    });

    console.log({resp})

}

// /v1/audio/translations is a 404 on this account (it's the legacy whisper-1-only
// endpoint, and this key is scoped to the gpt-4o-*-transcribe family instead — same
// gap as dall-e-2/dall-e-3 earlier). It also only ever translates TO English, with
// no target-language param, so `prompt: "convert this to hindi"` would never have
// done anything even if the endpoint existed. Two-step workaround instead:
// transcribe with the model this account does support, then translate the text
// via a chat completion.
const speech2textTranslate = async () => {
    const transcription = await openai.audio.transcriptions.create({
        file: createReadStream("src/text2speech/Ronak_Limbachiya_-_Odhaji_(mp3.pm).mp3"),
        model: "gpt-4o-mini-transcribe",
    });

    const translation = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            { role: "system", content: "Identify language And Translate the user's text to English. Reply with only the translation." },
            { role: "user", content: transcription.text },
        ],
    });

    console.log({ original: transcription.text, hindi: translation.choices[0]?.message?.content });
}

// Mirrors the account's model access elsewhere in this file (gpt-4o-mini-transcribe,
// not whisper-1) — using gpt-4o-mini-tts here rather than the legacy tts-1/tts-1-hd.
const text2speech = async (text: string, outFile = `speech_${Date.now()}.mp3`) => {
    const resp = await openai.audio.speech.create({
        input: text,
        model: "gpt-4o-mini-tts",
        voice: "alloy",
        response_format: "mp3",
    });

    const buffer = Buffer.from(await resp.arrayBuffer());
    writeFileSync(`src/text2speech/${outFile}`, buffer);
    console.log("Saved:", outFile);
}

// text2speechFun();
// speech2textTranslate();
text2speech("Hello! This audio was generated from text using the OpenAI TTS API.");
