import discord from 'discord.js';
import dotenv from 'dotenv';
import process from 'process';
import { speakWithStreamLabsVoice } from './streamlabs-tts.js';
import { speakWithTikTokVoice } from './tiktok-tts.js';

dotenv.config();

const discordClient = new discord.Client({ intents: ['GuildVoiceStates'] });

let currentlyWorking = false;

async function say(message, voiceChannelId) {
  if (currentlyWorking) {
    return;
  }

  currentlyWorking = true;

  const channel = await discordClient.channels.fetch(voiceChannelId);
  const connection = await channel.join();

  try {
    await speakWithTikTokVoice(message, connection);
  } catch {
    await speakWithStreamLabsVoice(message, connection);
  }

  connection.disconnect();

  currentlyWorking = false;
}

discordClient.on('ready', () => {
  console.log(`Logged in as ${discordClient.user.tag}`);
});

discordClient.on('voiceStateUpdate', async (oldState, newState) => {
  if (
    newState.channel && // The new state had something to do with a channel
    newState.channel.name !== oldState.channel?.name && // It was a channel join / change event
    newState.member?.user.id !== discordClient.user.id && // It was not an event triggered by the bot itself
    newState.channel.members.array().length !== 1 // There's more than one person in the channel
  ) {
    await say(newState.member.displayName, newState.member.voice.channelID);
  }
});

discordClient.login(process.env.DISCORD_BOT_TOKEN);
