import { setUserStatus, getUserInfo } from "./userInfo.js";

function waitForElement(selector, callback) {
  const el = document.querySelector(selector);
  if (el) return callback(el);

  const observer = new MutationObserver(() => {
    const el = document.querySelector(selector);
    if (el) {
      observer.disconnect();
      callback(el);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

function setDarkMode() {
  //mark dark mode enabled true;
  // const checkBox = document.getElementById("darkMode");
  // checkBox.checked = true;

  //add dark class to body
  const body = document.querySelector("body");
  body.classList.add("dark");
  setUserStatus("theme", "dark");
}

function setLightMode() {
  //mark dark mode enabled false;
  // const checkBox = document.getElementById("darkMode");
  // checkBox.checked = false;

  //remove dark class from body
  const body = document.querySelector("body");
  body.classList.remove("dark");

  setUserStatus("theme", "light");
}

function toggleTheme(init = false, themeValue = false) {
  if (init) {
    const theme = getItemFromStorage("theme");
    if (theme === "dark") setDarkMode();
    else setLightMode();
  } else if (themeValue) {
    if (themeValue == "dark") setDarkMode();
    else setLightMode();
  } else {
    const theme = getCurrentTheme();
    // console.log("theme", theme);
    if (theme === "dark") setLightMode();
    else setDarkMode();
  }
}
let blurInterval = null;
let hoveredElements = new Set(); // Track which elements are being hovered

function applyBlurToAll() {
  document
    .querySelectorAll("#main div[role='row'] div[tabindex='-1']")
    .forEach(el => {
      if (!hoveredElements.has(el)) { // ← Don't blur hovered elements
        el.style.filter = "blur(6px)";
      }
    });
}

function attachHoverListeners() {
  document
    .querySelectorAll("#main div[role='row'] div[tabindex='-1']")
    .forEach(el => {
      if (el._blurListenersAttached) return; // Avoid duplicate listeners
      el._blurListenersAttached = true;

      el.addEventListener("mouseenter", () => {
        hoveredElements.add(el);
        el.style.filter = ""; // Remove blur on hover
      });

      el.addEventListener("mouseleave", () => {
        hoveredElements.delete(el);
        el.style.filter = "blur(6px)"; // Re-blur when cursor leaves
      });
    });
}

function manageBlur(blurItem, blur = false) {
  const chatList = document.querySelector('#app');
  if (blur) {
    chatList.classList.add(blurItem);
  } else {
    chatList.classList.remove(blurItem);
  }

  // 🔥 SPECIAL HANDLING FOR blurConversation
  if (blurItem === "blurConversation") {
    if (blur) {
      applyBlurToAll();
      attachHoverListeners(); // ← Attach hover on/off listeners

      blurInterval = setInterval(() => {
        applyBlurToAll();
        attachHoverListeners(); // ← Re-attach for any new messages loaded
      }, 500);

    } else {
      clearInterval(blurInterval);
      blurInterval = null;
      hoveredElements.clear(); // ← Reset hover tracking

      // Remove blur and clean up listeners
      document
        .querySelectorAll("#main div[role='row'] div[tabindex='-1']")
        .forEach(el => {
          el.style.filter = "";
          el._blurListenersAttached = false; // Allow re-attaching next time
        });
    }
  }

  setUserStatus(blurItem, blur);
}

function getCurrentTheme() {
  const body = document.querySelector("body");
  return body.classList.contains("dark") ? "dark" : "light";
}

function getItemFromStorage(key) {
  const userInfo = getUserInfo();

  // console.log("itemstorage", userInfo);
  return userInfo.status[key];
}

export { toggleTheme, getCurrentTheme, manageBlur };
