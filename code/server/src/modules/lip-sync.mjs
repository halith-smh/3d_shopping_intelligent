import { convertTextToSpeech } from "./elevenLabs.mjs";
import { getPhonemes } from "./rhubarbLipSync.mjs";
import { readJsonTranscript, audioFileToBase64 } from "../utils/files.mjs";

import fs from 'fs';
import path from 'path';
const audioDir = path.join(process.cwd(), 'audios');
if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
}

const MAX_RETRIES = 10;
const RETRY_DELAY = 0;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));



const lipSync = async ({ messages }) => {
  if (!messages || !Array.isArray(messages)) {
    console.error("Invalid messages format:", messages);
    return [];
  }

  // await Promise.all(
  //   messages.map(async (message, index) => {
  //     const fileName = `audios/message_${index}.mp3`;

  //     for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
  //       try {
  //         await convertTextToSpeech({ text: message.text, fileName });
  //         await delay(RETRY_DELAY);
  //         break;
  //       } catch (error) {
  //         if (
  //           error.response &&
  //           error.response.status === 429 &&
  //           attempt < MAX_RETRIES - 1
  //         ) {
  //           await delay(RETRY_DELAY);
  //         } else {
  //           throw error;
  //         }
  //       }
  //     }
  //     console.log(`Message ${index} converted to speech`);
  //   })
  // );

  for (let index = 0; index < messages.length; index++) {
    const message = messages[index];
    const fileName = `audios/message_${index}.mp3`;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        await convertTextToSpeech({ text: message.text, fileName });
        await delay(RETRY_DELAY);
        console.log(`Message ${index} converted to speech`);
        break;
      } catch (error) {
        if (
          error.response &&
          error.response.status === 429 &&
          attempt < MAX_RETRIES - 1
        ) {
          console.warn(
            `Retrying message ${index} (attempt ${
              attempt + 1
            }) due to rate limit...`
          );
          await delay(1000); // wait 1s before retry
        } else {
          console.error(`Failed to convert message ${index}:`, error.message);
          throw error;
        }
      }
    }
  }

  await Promise.all(
    messages.map(async (message, index) => {
      const fileName = `audios/message_${index}.mp3`;

      try {
        await getPhonemes({ message: index });
        message.audio = await audioFileToBase64({ fileName });
        message.lipsync = await readJsonTranscript({
          fileName: `audios/message_${index}.json`,
        });
      } catch (error) {
        console.error(
          `Error while getting phonemes for message ${index}:`,
          error
        );
      }
    })
  );

  return messages;
};

export { lipSync };
