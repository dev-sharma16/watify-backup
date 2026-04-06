// ✅ tryGetUserInfo with retry logic
async function tryGetUserInfo(tabId, retries = 0, maxRetries = 5) {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, { type: "getUserInfo" }, (response) => {
      if (!chrome.runtime.lastError && response?.userInfo) {
        console.log("Got userInfo on attempt", retries + 1);
        resolve(response.userInfo);
        return;
      }
      if (retries < maxRetries) {
        console.log(`Retry ${retries + 1}/${maxRetries} waiting for userInfo...`);
        setTimeout(() => {
          tryGetUserInfo(tabId, retries + 1, maxRetries).then(resolve);
        }, 2000);
      } else {
        resolve(null);
      }
    });
  });
}

async function notify(runtime, message) {
  const [tab] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true,
  });
  const response = await chrome.tabs.sendMessage(tab.id, { message });
  console.log("Script Tab notify-->", response);
}

function sendUserInfo() {
  chrome.runtime.sendMessage({
    type: "initPopup",
    data: {
      userInfo: JSON.parse(localStorage.getItem("userInfo")),
      watiToken: localStorage.getItem("watifyToken"),
    },
  });
}

async function loginUser(phone, name, extensionId) {
  const response = await fetch(
    `https://watify.io/checkPlan?loginUser=1&phone=${phone}&name=${name}&extensionId=${extensionId}`,
    { method: "GET" }
  );
  const data = await response.text();
  console.log("Script Tab-->", JSON.parse(data));
  return JSON.parse(data);
}

function initBlur(status) {
  console.log("Theme status-->", status);
  
  if (!status) return; // ✅ null check
  if (status.theme === "dark") {
    document.getElementById("darkMode").checked = true;
    notify(chrome.runtime, { manageUi: { ui: "darkMode", value: "dark" } });
  }
  if (status.blurUserNames) {
    document.getElementById("blurUserNames").checked = true;
    notify(chrome.runtime, { manageUi: { ui: "blurUserNames", value: true } });
  }
  if (status.blurMessages) {
    document.getElementById("blurMessages").checked = true;
    notify(chrome.runtime, { manageUi: { ui: "blurMessages", value: true } });
  }
  if (status.blurProfile) {
    document.getElementById("blurProfile").checked = true;
    notify(chrome.runtime, { manageUi: { ui: "blurProfile", value: true } });
  }
  if (status.blurConversation) {
    document.getElementById("blurConversation").checked = true;
    notify(chrome.runtime, { manageUi: { ui: "blurConversation", value: true } });
  }
}

async function checkUserLogin(phone, name) {
  const userLogin = await loginUser(phone, name, chrome.runtime.id);
  console.log("Script userLogin", userLogin);

  if (phone != "" && userLogin.status == 200) return userLogin.instanceId;

  document.getElementById("home-tab")?.remove();
  document.getElementById("myTab")?.remove();
  document.getElementById("invalid-user-tab")?.classList.remove("d-none");
  document.querySelector("body").style.height = "200px";
  document.querySelector("html").style.height = "200px";
  return false;
}

function showTools() {
  document.querySelector("body").style.height = "550px";
  document.querySelector("html").style.height = "550px";
  document.getElementById("home-tab")?.remove();
  document.getElementById("invalid-user-tab")?.remove();
  document.getElementById("myTab")?.classList.remove("disabled");
  document.querySelector(".tab-content")?.classList.remove("d-none");
  document.getElementById("bulkSendForm-tab")?.classList.add("active");
}

// ✅ single initPopup with null check
async function initPopup(data) {
  if (!data?.userInfo) {
    console.log("initPopup: userInfo is null, skipping");
    return;
  }

  const userInfo = data.userInfo;
  console.log("init userINFO popup", userInfo);

  const userDetails = document.getElementById("userDetails");
  userDetails.querySelector(".userName").textContent = userInfo.userName;
  userDetails.querySelector(".userPhone").textContent = userInfo.userPhone.phone;

  document.getElementById("whatsappConnectionError")?.remove();

  const status = userInfo.status;
  initBlur(status);

  const isLoggedIn = await checkUserLogin(
    userInfo.userPhone.phone,
    userInfo.userName
  );
  if (!isLoggedIn) return;

  localStorage.setItem("watifyToken", isLoggedIn);
  chrome.storage.local.set({ watifyToken: isLoggedIn });

  const [tab] = await chrome.tabs.query({ url: "https://web.whatsapp.com/*" }); // ✅ reliable tab query
  if (!tab) return;
  await chrome.tabs.sendMessage(tab.id, { message: { saveToken: isLoggedIn } });
  showTools();
}

// ✅ DOMContentLoaded with retry logic
document.addEventListener("DOMContentLoaded", () => {
  chrome.tabs.query({ url: "https://web.whatsapp.com/*" }, async (tabs) => {
    if (!tabs.length) {
      console.log("No WhatsApp tab found");
      document.getElementById("whatsappConnectionError").style.display = "flex";
      return;
    }

    const tab = tabs[0];

    const userInfo = await tryGetUserInfo(tab.id);

    if (userInfo) {
      initPopup({ userInfo });
      return;
    }

    console.log("Falling back to executeScript...");
    chrome.scripting.executeScript(
      { target: { tabId: tab.id }, func: sendUserInfo },
      () => {
        if (chrome.runtime.lastError) {
          console.log("executeScript failed:", chrome.runtime.lastError.message);
          document.getElementById("whatsappConnectionError").style.display = "flex";
        }
      }
    );
  });
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  console.log("message on popup", request);
  if (request.type === "initPopup") {
    initPopup(request.data);
  }
  if (request.type === "updateBulkCamp") {
    const data = request.data;
    alert(`Bulk Camp Sent Successfully, Sent-> ${data.send}, Failed-> ${data.failed}`);
    const form = document.getElementById("bulkSendForm");
    form.reset();
    const btn = form.querySelector("#submitBtn");
    btn.textContent = "Send";
    btn.disabled = false;
  }
  if (request.type === "updateShootMsg") {
    console.log("update shoot msg", request.data);
    const data = request.data;
    if (data.failed == 0) {
      alert(`Message Sent Successfully`);
    } else {
      alert("Please recheck your data and try again");
    }
    const form = document.getElementById("shootMsgForm");
    const btn = form.querySelector("#shootMsgBtn");
    setTimeout(() => { btn.textContent = "Send"; }, 100);
    btn.disabled = false;
    form.reset();
  }
});