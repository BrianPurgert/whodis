import fetch from 'node-fetch';
import fs from 'node:fs/promises';

const ttsMp3FilePath = './tts.mp3';

export async function createTTSMp3File(text) {
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

export async function deleteTTSMp3File() {
  await fs.rm(ttsMp3FilePath);
}
