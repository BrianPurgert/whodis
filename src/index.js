import discord from 'discord.js';
import dotenv from 'dotenv';
import process from 'process';
import { createTTSMp3File, deleteTTSMp3File } from './tiktok-tts.js';

dotenv.config();

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const DISCORD_BOT_MEMBER_ID = process.env.DISCORD_BOT_MEMBER_ID;

const discordClient = new discord.Client({ intents: ['GuildVoiceStates'] });

let currentlyWorking = false;

async function say(message, voiceChannelId) {
  if (currentlyWorking) {
    return;
  }

  currentlyWorking = true;

  await createTTSMp3File(message);

  const channel = await discordClient.channels.fetch(voiceChannelId);
  const connection = await channel.join();

  const dispatcher = connection.play('./tts.mp3');
  await new Promise((resolve) => {
    dispatcher.on('finish', resolve);
  });

  connection.disconnect();
  await deleteTTSMp3File();

  currentlyWorking = false;
}

discordClient.on('ready', () => {
  console.log(`Logged in as ${discordClient.user.tag}`);
});

discordClient.on('voiceStateUpdate', async (oldState, newState) => {
  if (
    newState.channel && // The new state had something to do with a channel
    newState.channel.name !== oldState.channel?.name && // It was a channel join / change event
    newState.member?.id !== DISCORD_BOT_MEMBER_ID && // It was not an event triggered by the bot itself
    newState.channel.members.array().length !== 1 // There's more than one person in the channel
  ) {
    await say(newState.member.displayName, newState.member.voice.channelID);
  }
});

discordClient.login(DISCORD_BOT_TOKEN);
