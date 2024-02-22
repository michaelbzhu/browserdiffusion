import "./App.css";
import * as fal from "@fal-ai/serverless-client";
import View from "./View";
import { withTabId } from "./utils";

function App() {
  // setup fal
  fal.config({
    credentials: import.meta.env.VITE_FAL_CREDENTIALS,
  });

  const connection = fal.realtime.connect("fal-ai/lcm", {
    onResult: (result) => {
      let newImageUrl = result.images[0].url;
      console.log("fal responded with", { result });
      withTabId((tabId) => {
        // After receiving the new image URL, send a message to the content script to update the specific image
        chrome.tabs.sendMessage(tabId, {
          action: "updateSingleImage",
          originalUrl: result.request_id,
          newImageUrl: newImageUrl,
        });
      });
    },
    onError: (error) => {
      console.log("uh oh fal individual image gen attempt failed for img ");
      console.error(error);
    },
  });

  const sendToFal = (img: any, user_prompt: string) => {
    const prompt =
      user_prompt.length > 0
        ? user_prompt
        : "((anime, masterpiece)), vibrant, high-contrast, high-quality, manga";
    connection.send({
      prompt,
      sync_mode: true,
      image_url: img.croppedb64Image,
      guidance_scale: 1.2,
      negative_prompt:
        "watercolor, dull, nsfw, (worst quality, low quality:1.3), (depth of field, blurry:1.2), (greyscale, monochrome:1.1), 3D face, nose, cropped, lowres, text, jpeg artifacts, signature, watermark, username, blurry, artist name, trademark, watermark, title, (tan, muscular, loli, petite, child, infant, toddlers, chibi, sd character:1.1), multiple view, Reference sheet,",
      num_inference_steps: 5,
      enable_safety_checks: false,
      num_images: 1,
      strength: 0.6, //the lower the value, the more true to the original image
      request_id: img.imageUrl,
    });
  };

  return <View sendToFal={sendToFal} />;
}

export default App;
