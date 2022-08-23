import fetch from 'node-fetch';

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
