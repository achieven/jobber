import { Injectable } from '@nestjs/common';
import { OpenAI } from "openai";
import { config } from 'dotenv';
config();

@Injectable()
export class OpenAIService {
    private openai: OpenAI;

    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }

    async getEmbedding(text: string) {
        console.log('openai get embedding', text)
        try {
            const response = await this.openai.embeddings.create({
                model: "text-embedding-3-small",
                input: text,
                encoding_format: "float",
            });
        
            return response.data[0].embedding;
        } catch (error) {
            console.error("Error generating embedding:", error);
            throw error;
        }
    }
}