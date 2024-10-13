import { SlashCommandBuilder } from 'discord.js';
import { HfInference } from '@huggingface/inference';
import 'dotenv/config';

const inference = new HfInference(process.env.ACCESS_TOKEN);

export const data = new SlashCommandBuilder()
    .setName('chat')
    .setDescription('Chat with the AI based on your input')
    .addStringOption(option =>
        option.setName('prompt')
            .setDescription('The message you want to send to the AI')
            .setRequired(true));

export async function execute(interaction) {
    if (!interaction.isCommand()) return;

    try {
        await interaction.deferReply();
        const prompt = interaction.options.getString('prompt');

        const responseChunks = inference.chatCompletionStream({
            model: "Qwen/Qwen2.5-72B-Instruct",
            messages: [
                { role: "user", content: prompt }
            ],
            max_tokens: 500,
        });

        let response = '';
        for await (const chunk of responseChunks) {
            response += chunk.choices[0]?.delta?.content || "";
        }

        await interaction.editReply(response);
    } catch (error) {
        console.error('Error generating chat response:', error);
        if (!interaction.replied) {
            await interaction.editReply('Sorry, there was an error generating the response.');
        } else {
            await interaction.followUp('Sorry, there was an error generating the response.');
        }
    }
}