import discord from 'discord.js';
import dotenv from 'dotenv';
import getStream from 'get-stream';
import Minio from 'minio';
import fetch from 'node-fetch';
import { env } from 'process';

dotenv.config();

const discordClient = new discord.Client({ intents: ['GuildVoiceStates'] });

let customSoundsConfig;

/** @type {Minio.Client} */ let minio;

if (env.CUSTOM_SOUNDS_CONFIG_S3_PATH) {
  minio = new Minio.Client({
    endPoint: env.CUSTOM_SOUNDS_S3_ENDPOINT,
    useSSL: true,
    accessKey: env.CUSTOM_SOUNDS_S3_ACCESS_KEY_ID,
    secretKey: env.CUSTOM_SOUNDS_S3_SECRET_ACCESS_KEY,
  });

  const customSoundsConfigStream = await minio.getObject(
    env.CUSTOM_SOUNDS_S3_BUCKET_NAME,
    env.CUSTOM_SOUNDS_CONFIG_S3_PATH
  );

  const customSoundsConfigString = await getStream(customSoundsConfigStream);
  customSoundsConfig = JSON.parse(customSoundsConfigString);
}

async function getStreamLabsVoiceUrl(text) {
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
  return responseJson.speak_url;
}

let currentlyWorking = false;

async function playAudioUrlInVoiceChannel(audioUrl, voiceChannelId) {
  if (currentlyWorking) {
    return;
  }

  currentlyWorking = true;

  const channel = await discordClient.channels.fetch(voiceChannelId);
  const connection = await channel.join();

  const dispatcher = await connection.play(audioUrl);
  await new Promise((resolve) => dispatcher.on('finish', resolve));

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
    newState.member?.user.id !== discordClient.user.id  // It was not an event triggered by the bot itself
  ) {
    let audioUrl;

    if (customSoundsConfig?.DiscordUserIdToS3Path?.[newState.member.user.id]) {
      audioUrl = await minio.presignedGetObject(
        env.CUSTOM_SOUNDS_S3_BUCKET_NAME,
        customSoundsConfig.DiscordUserIdToS3Path[newState.member.user.id]
      );
    } else {
      audioUrl = await getStreamLabsVoiceUrl(newState.member.displayName);
    }

    await playAudioUrlInVoiceChannel(audioUrl, newState.member.voice.channelID);
  }
});

discordClient.login(env.DISCORD_BOT_TOKEN);
