import { setUserStatus, getUserInfo } from "./userInfo.js";

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

function manageBlur(blurItem, blur = false) {
  // const chatList = document.querySelector('[aria-label="Chat list"]');
  const chatList = document.querySelector('#app');
  const msgMain = document.querySelector("#main");

  if (blur) {
    chatList.classList.add(blurItem);
    if (msgMain !== null && msgMain !== undefined)
      msgMain.classList.add(blurItem);
    // document.getElementById(blurItem).checked = true;
  } else {
    chatList.classList.remove(blurItem);
    if (msgMain !== null && msgMain !== undefined)
      msgMain.classList.remove(blurItem);
    // document.getElementById(blurItem).checked = false;
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
