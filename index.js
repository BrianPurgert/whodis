import discord from 'discord.js';
import dotenv from 'dotenv';
import process from 'process';
import fetch from 'node-fetch';

dotenv.config();

const discordClient = new discord.Client({ intents: ['GuildVoiceStates'] });
let currentlyWorking = false;

export async function speakWithStreamLabsVoice(text, connection) {
  const response = await fetch('https://streamlabs.com/polly/speak', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      voice: 'Justin',
      text,
    }),
  });

  const responseJson = await response.json();
  const audioUrl = responseJson.speak_url;

  const dispatcher = await connection.play(audioUrl);
  await new Promise((resolve) => dispatcher.on('finish', resolve));
}

async function say(message, voiceChannelId) {
  if (currentlyWorking) {
    return;
  }

  currentlyWorking = true;

  const channel = await discordClient.channels.fetch(voiceChannelId);
  const connection = await channel.join();

  // Wait before speaking and before disconnecting to make things
  // less jarring.
  await wait(500);
  await speakWithStreamLabsVoice(message, connection);
  await wait(200);

  connection.disconnect();

  currentlyWorking = false;
}

async function wait(timeMs) {
  return new Promise((resolve) => setTimeout(resolve, timeMs));
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
