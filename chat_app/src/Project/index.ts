import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function getTimeOFtheDay() {
    return new Date().toISOString();
}

function getOrderStatus(orderId: string) {
    console.log(`Getting status for order ${orderId}`);
    const orderAsNumber = parseInt(orderId);
    if(orderAsNumber % 2 === 0) {
        return 'IN_PROGRESS';
    }
    return 'COMPLETED'
}

async function callOpenAIWithTools() {
    const context: OpenAI.Chat.ChatCompletionMessageParam[] = [
        {
            role: 'system',
            content: 'you are an helpful assistent that give information about the time of day and order status'
        }, 
        {
            role: 'user',
            content: 'What is status of order 9944789?'
        }
    ]

    
    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: context,
        max_completion_tokens: 2000,
        tools: [
            {
                type: 'function',
                function: {
                    name: 'getTimeOFtheDay',
                    description: 'Get Current time of day'
                }
            },
            {
                type: 'function',
                function: {
                    name: 'getOrderStatus',
                    description: 'Get order status',
                    parameters: {
                        type: 'object',
                        properties: {
                            orderId: {
                                type: 'string',
                                description: 'The Id of order to get the status of'
                            }
                        },
                        required: ['orderId']
                    }
                }
            },
        ],
        tool_choice: 'auto'
    }); 


    const willInvokeFunction = response.choices[0].finish_reason === 'tool_calls';
    const toolCall = response.choices[0].message.tool_calls?.[0]

    if (willInvokeFunction && toolCall) {
        const toolName = toolCall.function.name;
        if (toolName === 'getTimeOFtheDay') {
            const toolResponse = getTimeOFtheDay();
            context.push(response.choices[0].message);
            context.push({
                role: 'tool',
                content: toolResponse,
                tool_call_id: toolCall.id
            })
        }

         if (toolName === 'getOrderStatus') {

            const rawArgumments = toolCall.function.arguments;
            const parsedArgument = JSON.parse(rawArgumments);
            const toolResponse = getOrderStatus(parsedArgument.orderId);
            context.push(response.choices[0].message);
            context.push({
                role: 'tool',
                content: toolResponse,
                tool_call_id: toolCall.id
            })
        }
    }

    const secondResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: context,
    });

    console.log('1st resp Reply', response.choices?.[0]?.message?.content);
        console.log('2nd resp Reply', secondResponse.choices?.[0]?.message?.content);

}

callOpenAIWithTools();