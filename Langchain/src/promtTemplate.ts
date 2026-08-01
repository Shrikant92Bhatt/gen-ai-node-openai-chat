import {ChatOpenAI} from "@langchain/openai";
import {ChatPromptTemplate} from "@langchain/core/prompts";
import { StringOutputParser, CommaSeparatedListOutputParser, StructuredOutputParser   } from "@langchain/core/output_parsers";
const model = new ChatOpenAI({
    modelName: "gpt-4o-mini",
    temperature: 0.7,
    maxTokens: 1000,
    // verbose: true,
    apiKey: process.env.OPENAI_API_KEY,
});


export async function runFromTemplate() {

    const prompt = ChatPromptTemplate.fromTemplate(
        "Write short description for the following product: {product_name}"
    );

    const wholePrompt = await prompt.format({
        product_name: "iPhone 15 Pro"
    });
    console.log(wholePrompt);

    /// creaating chain 

    const chain = prompt.pipe(model);
    const response = await chain.invoke({
        product_name: "iPhone 15 Pro"
    });
    console.log(response);
}


export async function runFromTemplate2() {

    const prompt = ChatPromptTemplate.fromMessages([
        [
            "system",
            "You are a helpful assistant that writes short product descriptions."
        ],
        [
            "user",
            "Write short description for the following product: {product_name}"
        ]
    ]); 

    const wholePrompt = await prompt.format({
        product_name: "iPhone 15 Pro"
    });
    console.log(wholePrompt);
    const chain = prompt.pipe(model);
    const response = await chain.invoke({
        product_name: "iPhone 15 Pro"
    });
    console.log(response);

}

export async function stringParser() {
    const  promt = ChatPromptTemplate.fromTemplate(
        "Write short description for the following product: {product_name}"
    );
    const parser = new StringOutputParser();
    const wholePrompt = await promt.format({
        product_name: "iPhone 15 Pro"
    });
    console.log(wholePrompt);
    const chain = promt.pipe(model).pipe(parser);
    const response = await chain.invoke({
        product_name: "iPhone 15 Pro"
    });
    console.log(response);
}

export async function commaSeparatedListParser() {
    const  promt = ChatPromptTemplate.fromTemplate(
        "List the ingredients for the following product: {product_name}"
    );
    const parser = new CommaSeparatedListOutputParser();
    const wholePrompt = await promt.format({
        product_name: "Bread"
    });
    console.log(wholePrompt);
    const chain = promt.pipe(model).pipe(parser);
    const response = await chain.invoke({
        product_name: "Bread"
    });
    console.log(response);
}

export async function structuredOutputParser() {
    const  promt = ChatPromptTemplate.fromTemplate(
        "Extract the information from following phrases.\n\n Formating instructions: {format_instructions} \n\n Phrases: {phrases}"
    );
    const parser = StructuredOutputParser.fromNamesAndDescriptions({
        name: "The name of the person",
        likes: "What the person likes",
        skill: "The skill of the person"
    });

    const chain = promt.pipe(model).pipe(parser);
    const response = await chain.invoke({
        phrases: "John likes programming and he is a software engineer.",
        format_instructions: parser.getFormatInstructions(),
    });
    console.log(response);
}