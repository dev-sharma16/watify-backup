// Bridge between page ↔ extension

// ==============================
// PAGE → EXTENSION
// ==============================
window.addEventListener("message", (event) => {
  if (event.source !== window) return;

  if (event.data.type === "SAVE_USER_INFO") {
    chrome.runtime.sendMessage({
      type: "SAVE_USER_INFO",
      data: event.data.data,
    });
  }

  if (event.data.type === "GET_USER_INFO") {
    chrome.storage.local.get(["userInfo"], (result) => {
      window.postMessage(
        {
          type: "RETURN_USER_INFO",
          data: result.userInfo || null,
        },
        "*"
      );
    });
  }

  // ✅ handle token save request from bundle.js
  if (event.data._saveToken) {
    chrome.storage.local.set({ watifyToken: event.data._saveToken });
  }
});


// ==============================
// EXTENSION → PAGE (MAIN FIX HERE)
// ==============================

// ✅ Prevent duplicate listener registration
if (!window._contentListenerAdded) {
  window._contentListenerAdded = true;

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

    // 🔍 DEBUG LOG
    console.log("📩 content.js received:", request);

    // Handle getUserInfo from popup
    if (request.type === "getUserInfo") {
      chrome.storage.local.get(["userInfo"], (result) => {
        sendResponse({ userInfo: result.userInfo || null });
      });
      return true; // keep async response open
    }

    // 🚀 MAIN FIX: prevent duplicate forwarding
    if (request.message) {

      const currentMsg = JSON.stringify(request.message);

      // 🚨 Block duplicate message
      if (window._lastForwardedMessage === currentMsg) {
        console.log("⛔ Duplicate message blocked in content.js");
        return;
      }

      // Save last message
      window._lastForwardedMessage = currentMsg;

      console.log("📤 Forwarding message to page:", request.message);

      window.postMessage(
        {
          message: request.message,
        },
        "*"
      );

      // Reset after short delay
      setTimeout(() => {
        window._lastForwardedMessage = null;
      }, 500);
    }
  });
}