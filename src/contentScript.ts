// ---------- GLOBALS ----------
let isReplacingImages = false;
var imagesStore = {} as any;
var imageStartTimes = {} as any;
const timeBeforeRetry = 3000; //min time in ms to wait before retrying generation for a given image

// ---------- UTILS ----------

function findKeyByValue(obj: any, value: any) {
  return Object.keys(obj).find((key) => obj[key] === value);
}

/**
 * Extracts URLs from the given text.
 * @param {string} text - The text to search for URLs.
 * @returns {string[]|null} - An array of URLs found in the text, or null if no URLs are found.
 */
function extractUrls(text: string) {
  const urlPattern = /https?:\/\/[^\s]+/g;
  const urls = text.match(urlPattern);
  return urls ? urls : null;
}

/**
 * Sends image URLs to the background script
 * @param {Array} filteredImages - List of image URLs to be sent
 */
async function sendImageUrlsToApp(filteredImages: string[]) {
  try {
    // Convert image URLs to base64 and create image objects
    const imageObjects = await Promise.all(
      filteredImages.map(async (imageUrl) => {
        return { imageUrl, croppedb64Image: imageUrl };
      })
    );
    // Send image objects to the background script
    chrome.runtime.sendMessage({
      action: "processImages",
      images: imageObjects,
    });
  } catch (error) {
    console.error("Error processing images:", error);
  }
}

/**
 * Check if the image should be processed based on various conditions.
 *
 * @param {HTMLImageElement} img - the image to be processed
 * @return {boolean} whether the image should be processed or not
 */
function shouldProcess(img: HTMLImageElement) {
  if (
    (!imageStartTimes.hasOwnProperty(img.src) ||
      imageStartTimes[img.src] + timeBeforeRetry < Date.now()) &&
    !img.src.startsWith("data:image") &&
    !img.alt.toLowerCase().includes("profile") &&
    !img.src.toLowerCase().includes("video_thumb") &&
    !img.src.toLowerCase().includes("icon") &&
    !img.src.toLowerCase().includes("static-asset") &&
    !(img.offsetWidth < 125 && img.offsetHeight < 125)
  ) {
    return true;
  }
  return false;
}

// ---------- LIFECYCLE ----------

/**
 * Scans the document for images and sends the URLs of new images to the background process for processing.
 */
const scanImages = () => {
  if (!isReplacingImages) {
    return;
  }

  const images = [...document.getElementsByTagName("img")];
  let filteredImages = [];

  for (let img of images) {
    // Check if the image URL is not already stored and should be processed
    if (!imagesStore.hasOwnProperty(img.src) && shouldProcess(img)) {
      filteredImages.push(img.src);
      imageStartTimes[img.src] = Date.now();
    }
  }

  if (filteredImages.length > 0) {
    sendImageUrlsToApp(filteredImages);
  }
};

/**
 * Updates the images on the page based on the current state of the imagesStore.
 */
function updatePageImages() {
  // Update general images
  const images = [...document.getElementsByTagName("img")];
  for (let img of images) {
    let currentUrl = img.src;
    if (!isReplacingImages) {
      // If replacing is toggled off, switch altered images back, while keeping generations in imagesStore
      let originalImage = findKeyByValue(imagesStore, currentUrl);
      img.src = originalImage === undefined ? currentUrl : originalImage;
    } else if (
      imagesStore.hasOwnProperty(currentUrl) &&
      img.src !== imagesStore[currentUrl]
    ) {
      img.src = imagesStore[currentUrl];
    }
  }

  // In some sites like the nytimes, the source of truth is in the source tag, not the img tag
  const sources = [...document.getElementsByTagName("source")];
  for (let source of sources) {
    if (!isReplacingImages) {
      let originalImage = findKeyByValue(imagesStore, source.srcset);
      source.srcset =
        originalImage === undefined ? source.srcset : originalImage;
    } else {
      let currentUrls = extractUrls(source.srcset) || source.srcset;
      if (currentUrls === null) continue;
      for (let currentUrl of currentUrls) {
        if (
          imagesStore.hasOwnProperty(currentUrl) &&
          source.srcset !== imagesStore[currentUrl]
        ) {
          source.srcset = imagesStore[currentUrl];
        }
      }
    }
  }
}

/**
 * Function to observe DOM changes and replace images if new ones are added
 */
const observeDOM = () => {
  const observer = new MutationObserver((mutations) => {
    const hasAdditions = mutations.some(
      (mutation) => mutation.addedNodes.length > 0
    );

    // If new nodes are added and the flag for replacing images is true, then scan for and update images
    if (hasAdditions && isReplacingImages) {
      scanImages();
      updatePageImages();
    }
  });

  // Start observing changes to the entire body and its subtree
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
};

// ---------- MAIN ----------

/**
 * Listens for messages from App.js and background.js and performs actions based on the message content.
 * - If the message action is "updateSingleImage", it updates a single image's URL in the imagesStore and triggers an update of page images.
 * - If the message contains "replaceImages", it toggles the state of image replacement, connects to the runtime for further instructions, scans for new images, updates page images, and sends a success response.
 */
chrome.runtime.onMessage.addListener((request: any) => {
  if (
    request.hasOwnProperty("action") &&
    request.action === "updateSingleImage"
  ) {
    imagesStore[request.originalUrl] = request.newImageUrl;
    updatePageImages();
  } else if (request.hasOwnProperty("replaceImages")) {
    isReplacingImages = request.replaceImages;
    scanImages();
    updatePageImages();
  }
  return false; // return false since not responding to sender here
});

observeDOM();
