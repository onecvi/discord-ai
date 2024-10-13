import { Client, GatewayIntentBits, Collection } from 'discord.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import 'dotenv/config';
import winston from 'winston';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => `${timestamp} [${level.toUpperCase()}]: ${message}`)
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'bot.log' })
    ]
});

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

client.commands = new Collection();

const loadCommands = async () => {
    try {
        const commandsPath = path.join(__dirname, 'commands');
        const commandFiles = (await fs.readdir(commandsPath)).filter(file => file.endsWith('.mjs'));

        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);
            const command = await import(pathToFileURL(filePath).href);
            if ('data' in command && 'execute' in command) {
                client.commands.set(command.data.name, command);
                logger.info(`Loaded command: ${command.data.name}`);
            } else {
                logger.warn(`The command at ${filePath} is missing a required "data" or "execute" property.`);
            }
        }
    } catch (error) {
        logger.error(`Error loading commands: ${error.message}`);
    }
};

client.once('ready', async () => {
    logger.info('Bot is ready!');

    try {
        const guilds = await client.guilds.fetch();
        const commands = client.commands.map(command => command.data.toJSON());

        for (const guild of guilds.values()) {
            await client.application.commands.set(commands, guild.id);
        }

        logger.info('Slash commands active.');
    } catch (error) {
        logger.error(`Error setting slash commands: ${error.message}`);
    }
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) {
        logger.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        logger.error(`Error executing ${interaction.commandName}: ${error.message}`);
        if (!interaction.replied) {
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        } else {
            await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    }
});

client.login(process.env.DISCORD_TOKEN).then(() => {
    logger.info('Logged in to Discord.');
    loadCommands();
}).catch(error => {
    logger.error(`Error logging in: ${error.message}`);
});