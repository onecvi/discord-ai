import { SlashCommandBuilder } from 'discord.js';
import { AttachmentBuilder } from 'discord.js';
import fetch from 'node-fetch';
import 'dotenv/config';

const ACCESS_TOKEN = process.env.ACCESS_TOKEN;

async function query(data) {
    const response = await fetch(
        "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell",
        {
            headers: {
                Authorization: `Bearer ${ACCESS_TOKEN}`,
                "Content-Type": "application/json",
            },
            method: "POST",
            body: JSON.stringify(data),
        }
    );
    const result = await response.blob();
    return result;
}

export const data = new SlashCommandBuilder()
    .setName('image')
    .setDescription('Generate an image based on your description')
    .addStringOption(option =>
        option.setName('prompt')
            .setDescription('Description for the image to generate')
            .setRequired(true));

export async function execute(interaction) {
    if (!interaction.isCommand()) return;

    try {
        await interaction.deferReply();
        const prompt = interaction.options.getString('prompt');
        const response = await query({ "inputs": prompt });
        const buffer = await response.arrayBuffer();
        const attachment = new AttachmentBuilder(Buffer.from(buffer), { name: 'image.png' });
        await interaction.editReply({ files: [attachment] });
    } catch (error) {
        console.error('Error generating image:', error);
        if (!interaction.replied) {
            await interaction.editReply('Sorry, there was an error generating the image.');
        } else {
            await interaction.followUp('Sorry, there was an error generating the image.');
        }
    }
}