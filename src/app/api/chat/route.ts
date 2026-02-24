import { NextRequest, NextResponse } from "next/server";
import { HfInference } from "@huggingface/inference";

const hf = new HfInference(process.env.HF_TOKEN);

const MODELS = [
    "Qwen/Qwen2.5-72B-Instruct",
    "meta-llama/Meta-Llama-3-8B-Instruct",
    "mistralai/Mixtral-8x7B-Instruct-v0.1",
    "google/gemma-1.1-7b-it",
];

interface ChatMessage {
    role: "system" | "user" | "assistant";
    content: string;
    [key: string]: any;
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const messages: ChatMessage[] = body.messages || [];

        if (messages.length === 0) {
            return NextResponse.json({ reply: "Please send a message to start." });
        }

        const systemMsg: ChatMessage = {
            role: "system",
            content:
                "You are Nova AI, a helpful and knowledgeable AI assistant. " +
                "Give concise, clear, and accurate responses. Be conversational.",
        };

        const formattedMessages = [systemMsg, ...messages.slice(-6)];

        for (const model of MODELS) {
            try {
                const response = await hf.chatCompletion({
                    model: model,
                    messages: formattedMessages,
                    max_tokens: 2048,
                    temperature: 0.7,
                });

                const reply = response.choices[0]?.message?.content?.trim();
                if (reply) {
                    return NextResponse.json({ reply });
                }
            } catch (err) {
                console.error(`[HF SDK Error] Model: ${model} | Error:`, err);
                continue;
            }
        }

        return NextResponse.json({
            reply:
                "The free AI models are currently warming up or busy. " +
                "This usually takes 20-30 seconds on first use. " +
                "Please try sending your message again in a moment!",
        });
    } catch (error) {
        console.error("Chat API error:", error);
        return NextResponse.json({
            reply: "Something went wrong. Please try again.",
        });
    }
}
