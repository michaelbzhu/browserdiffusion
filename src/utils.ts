export const withTabId = (callback: (tabId: number) => void) => {
  chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    const tabId = tabs[0].id;
    if (tabId) {
      callback(tabId);
    } else {
      console.error("No tabId found");
    }
  });
};
