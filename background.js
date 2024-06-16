const storage =
  typeof browser !== "undefined" ? browser.storage.sync : chrome.storage.sync;
const runtime =
  typeof browser !== "undefined" ? browser.runtime : chrome.runtime;
const tabs = typeof browser !== "undefined" ? browser.tabs : chrome.tabs;
const webNavigation =
  typeof browser !== "undefined" ? browser.webNavigation : chrome.webNavigation;

runtime.onInstalled.addListener(() => {
  storage.set({ tasks: [], extensionEnabled: false });
});

runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.tasksUpdated) {
    handleTaskRedirects();
  }
});

webNavigation.onBeforeNavigate.addListener((details) => {
  handleTaskRedirects(details);
});

webNavigation.onCommitted.addListener((details) => {
  handleTaskRedirects(details);
});

function getDomainFromUrl(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (error) {
    console.error("Error parsing URL:", error);
    return null;
  }
}

// Extract main domain from URL
function extractMainDomain(url) {
  let domain = url.replace(/^(?:www\.)?([^:/\n?]+).*/i, "$1");
  return domain;
}

function handleTaskRedirects(details) {
  storage.get(["tasks", "extensionEnabled"], (data) => {
    if (!data.extensionEnabled) {
      return;
    }

    const tasks = data.tasks || [];
    tasks.sort((a, b) => b.priority - a.priority);
    const incompleteTask = tasks.find((task) => !task.completed);

    if (incompleteTask && incompleteTask.redirectUrl) {
      const redirectDomain = getDomainFromUrl(incompleteTask.redirectUrl);
      const detailsDomain = getDomainFromUrl(details.url);

      const isLocalhost =
        detailsDomain === "localhost" || detailsDomain === "127.0.0.1";
      const isBrowserInternalUrl =
        details.url.startsWith("chrome:") ||
        details.url.startsWith("chrome-extension:") ||
        details.url.startsWith("moz-extension:");
      const isFileUrl = details.url.startsWith("file:");

      // Extract main domains from detailsDomain and redirectDomain
      const mainDetailsDomain = extractMainDomain(detailsDomain);
      const mainRedirectDomain = extractMainDomain(redirectDomain);      

      const isIgnoredUrl = tasks.some((task) => {
        const taskRedirectDomain = extractMainDomain(getDomainFromUrl(task.redirectUrl));
        const taskIgnoredUrlsDomains = (task.ignoredUrls || []).map((url) =>
          extractMainDomain(getDomainFromUrl(url))
        );
        return (
          mainDetailsDomain === taskRedirectDomain ||
          taskIgnoredUrlsDomains.includes(mainDetailsDomain)
        );
      });

      // Apply the redirection logic if it isn't a localhost, browser internal url, file url, ignored URL or the developer profile url
      if (
        redirectDomain &&
        !isLocalhost &&
        !isBrowserInternalUrl &&
        !isFileUrl &&
        !isIgnoredUrl &&
        !details.url.startsWith("https://github.com/ArmaanLeg3nd")
      ) {
        // Check if main domains match
        if (mainDetailsDomain !== mainRedirectDomain) {
          const frameId = details.frameId;
          const parentFrameId = details.parentFrameId;
          if (frameId === 0 || parentFrameId === -1) {
            tabs.update(details.tabId, { url: incompleteTask.redirectUrl });
          }
        }
      }
    }
  });
}
