import fetch from 'node-fetch';
import fs from 'node:fs/promises';

const ttsMp3FilePath = './tts.mp3';

async function createTikTokTTSMp3File(text) {
  text = text.replace('+', 'plus');
  text = text.replace(' ', '+');
  text = text.replace('&', 'and');

  const url = `https://api16-normal-useast5.us.tiktokv.com/media/api/text/speech/invoke/?text_speaker=en_us_001&req_text=${text}&speaker_map_type=0`;
  const response = await fetch(url, { method: 'POST' });

  const responseJson = await response.json();

  const data = Buffer.from(responseJson.data.v_str, 'base64');

  await fs.writeFile(ttsMp3FilePath, data);
  return ttsMp3FilePath;
}

async function deleteTTSMp3File() {
  await fs.rm(ttsMp3FilePath);
}

async function wait(timeMs) {
  return new Promise((resolve) => setTimeout(resolve, timeMs));
}

export async function speakWithTikTokVoice(text, connection) {
  await createTikTokTTSMp3File(text);

  // Wait for some time after starting because it's too jarring to
  // hear the announcement before Discord's connection tone even finishes
  // playing.
  await wait(250);

  const dispatcher = await connection.play(ttsMp3FilePath);
  await new Promise((resolve) => dispatcher.on('finish', resolve));
  await deleteTTSMp3File();

  // Wait for some time before finishing as well because again it's jarring
  // to hear the disconnect tone almost instantly after the announcement is done.
  await wait(250);
}
