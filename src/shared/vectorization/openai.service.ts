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
        console.log('openai get embedding')
        try {
            // Call the OpenAI embeddings API
            const response = await this.openai.embeddings.create({
                model: "text-embedding-3-small", // You can also use "text-embedding-3-large"
                input: text,
                encoding_format: "float",
            });
        
            // The vector is located in the 'embedding' property of the first data object
            return response.data[0].embedding;
        } catch (error) {
            console.error("Error generating embedding:", error);
            throw error;
        }
    }
}