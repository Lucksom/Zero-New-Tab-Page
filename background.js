chrome.runtime.onStartup.addListener(() => {
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      if (tab.url === "chrome-native://newtab/" || tab.url === "chrome://newtab/") {
        chrome.tabs.update(tab.id, { url: "chrome://newtab/" });
      }
    });
  });
});
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (!request || !request.ask) return true;

  const tabId = sender.tab ? sender.tab.id : null;

  switch (request.ask) {
    case "backward":
      chrome.tabs.goBack(tabId).catch(() => {});
      break;
    case "forward":
      chrome.tabs.goForward(tabId).catch(() => {});
      break;
    case "reload":
      chrome.tabs.reload(tabId);
      break;
    case "history":
      chrome.tabs.create({ url: "chrome://history" });
      break;
    case "downloads":
      chrome.tabs.create({ url: "chrome://downloads" });
      break;
    case "new_window":
      chrome.windows.create({ 
        url: "chrome://newtab", type: "popup", focused: true, state: "normal"
      }, (win) => {
        if (chrome.runtime.lastError) chrome.tabs.create({ url: "chrome://newtab" });
      });
      break;
  }
  return true; 
});