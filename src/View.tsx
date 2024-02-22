import { FC, useEffect, useState } from "react";
import animeSkylinePhoto from "./assets/animeskyline.jpeg";
import realSkylinePhoto from "./assets/realskyline.jpeg";
import { withTabId } from "./utils";

type ViewProps = {
  sendToFal: (img: any, user_prompt: string) => void;
};

const delay = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

let didInit = false;

const View: FC<ViewProps> = ({ sendToFal }) => {
  const [isReplacing, setIsReplacing] = useState(false);
  const [prompt, setPrompt] = useState<string>("");

  useEffect(() => {
    if (didInit) return;
    didInit = true;

    withTabId(async (tabId) => {
      // get badge text
      const badgeText = await chrome.action.getBadgeText({ tabId });
      if (badgeText === "ON") {
        setIsReplacing(true);
      }
    });

    // setup listener for messages from contentscript
    chrome.runtime.onMessage.addListener((message: any) => {
      if (message.action === "processImages") {
        processImagesWithFAL(message.images);
      }
      return false; // return false since not responding to sender here
    });
  }, []);

  const processImagesWithFAL = async (images: any[]) => {
    const user_prompt = window.sessionStorage.getItem("user_prompt") ?? "";
    for (const imageObj of images) {
      // Delay in milliseconds. otherwise on load might send too many requests at once
      await delay(300);
      sendToFal(imageObj, user_prompt);
    }
  };

  const toggleReplaceImages = () => {
    const newState = !isReplacing;
    setIsReplacing(newState);

    window.sessionStorage.setItem("user_prompt", prompt);
    withTabId((tabId) => {
      // update badge text
      chrome.action.setBadgeText({
        text: newState ? "ON" : "OFF",
        tabId,
      });

      chrome.action.setBadgeBackgroundColor({
        color: newState ? "#90EE90" : "#D3D3D3", // Light green for "ON", light gray for "OFF"
        tabId: tabId,
      });
      // send message to contentScript
      chrome.tabs.sendMessage(tabId, { replaceImages: newState });
    });
  };

  return (
    <div
      style={{
        backgroundImage: `url(${
          isReplacing ? animeSkylinePhoto : realSkylinePhoto
        })`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
      className="flex flex-col items-center justify-center h-screen w-full"
    >
      <div
        className="mb-2 rounded-lg"
        style={{ backgroundColor: "rgba(209, 213, 219, 0.75)" }}
      >
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="bg-transparent h-10 px-4 w-[200px] text-sm focus:outline-none placeholder:text-slate-600"
          placeholder="Custom prompt"
        />
      </div>
      <label
        className={`relative inline-block w-14 h-8 ${
          isReplacing ? "bg-green-500" : "bg-gray-500"
        } rounded-full shadow-inner`}
      >
        <input
          type="checkbox"
          className="opacity-0 w-0 h-0"
          checked={isReplacing}
          onChange={toggleReplaceImages}
        />
        <span
          className={`absolute left-0 top-0 bottom-0 right-0 block cursor-pointer rounded-full shadow-inner transition-colors duration-300 ease-in-out ${
            isReplacing ? "bg-green-500" : "bg-gray-500"
          }`}
        ></span>
        <span
          className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform duration-300 ease-in-out transform ${
            isReplacing ? "translate-x-6" : "translate-x-0"
          }`}
        ></span>
      </label>
      <div className="bg-gray-200 text-gray-800 font-bold py-1 px-2 rounded-lg mt-2 opacity-75">
        {isReplacing ? "AI" : "Reality"}
      </div>
      {/* <img
        src={isReplacing ? animeSkylinePhoto : realSkylinePhoto}
        alt="Skyline"
      /> */}
    </div>
  );
};

export default View;
