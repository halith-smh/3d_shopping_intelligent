import ElevenLabs from "elevenlabs-node";
import { ELEVEN_LABS_API_KEY, ELEVEN_LABS_MODEL_ID, ELEVEN_LABS_VOICE_ID } from "../config/env.js";


const elevenLabsApiKey = ELEVEN_LABS_API_KEY;
const voiceID = ELEVEN_LABS_VOICE_ID;
const modelID = ELEVEN_LABS_MODEL_ID;

const voice = new ElevenLabs({
  apiKey: elevenLabsApiKey,
  voiceId: voiceID,
});

async function convertTextToSpeech({ text, fileName }) {
  await voice.textToSpeech({
    fileName: fileName,
    textInput: text,
    voiceId: voiceID,
    stability: 0.5,
    similarityBoost: 0.5,
    modelId: modelID,
    style: 1,
    speakerBoost: true,
  });
}

export { convertTextToSpeech, voice };
