// function getUserInfo() {
//   const info = localStorage.getItem("userInfo");
//   console.log("get Info-->", info);
  
//   let userInfo;
//   if (info) userInfo = JSON.parse(info);
//   else {
//     userInfo = {
//       userName: "",
//       userPhone: {
//         phone: "",
//         _serialized: "",
//       },
//       status: {
//         blurMessages: false,
//         blurProfile: false,
//         blurUserNames: false,
//         blurConversation: false,
//         theme: "dark",
//       },
//     };
//     localStorage.setItem("userInfo", JSON.stringify(userInfo));
//   }
//   return userInfo;
// }
function getUserInfo() {
  const info = localStorage.getItem("userInfo");
  let userInfo;
  if (info) userInfo = JSON.parse(info);
  else {
    // ✅ detect actual WhatsApp theme instead of hardcoding "dark"
    const currentTheme = document.body.getAttribute("data-theme") || 
                         (document.body.classList.contains("dark") ? "dark" : "light");
    userInfo = {
      userName: "",
      userPhone: {
        phone: "",
        _serialized: "",
      },
      status: {
        blurMessages: false,
        blurProfile: false,
        blurUserNames: false,
        blurConversation: false,
        theme: currentTheme, // ✅ use actual theme
      },
    };
    localStorage.setItem("userInfo", JSON.stringify(userInfo));
  }
  return userInfo;
}
function setUserInfo(WPP) {
  console.log("🔥 setUserInfo called", WPP);

  const userInfo = getUserInfo(); // this already creates default if missing

  try {
    const userIdObj = WPP.conn.getMyUserId();
    if (!userIdObj || !userIdObj._serialized) {
      console.warn("getMyUserId returned invalid object");
      return; // retry later if needed
    }

    userInfo.userPhone._serialized = userIdObj._serialized.toString();
    userInfo.userPhone.phone = userIdObj.user?.toString() || "";

    // Profile name (can fail early)
    try {
      userInfo.userName = WPP.profile.getMyProfileName?.() || userInfo.userPhone.phone;
    } catch (e) {
      console.log("getMyProfileName failed", e);
      userInfo.userName = userInfo.userPhone.phone;
    }

    // Persist immediately
    localStorage.setItem("userInfo", JSON.stringify(userInfo));

    const token = btoa(userInfo.userPhone._serialized);
    localStorage.setItem("watifyToken", token);
    chrome.storage.local.set({ watifyToken: token });

    console.log("✅ userInfo + token saved", userInfo);

    // Notify content script / bundle immediately
    window.postMessage({ userInfoUpdated: userInfo, token }, "*");

  } catch (err) {
    console.error("setUserInfo failed", err);
  }
}
function setUserStatus(key, value) {
  const userInfo = getUserInfo();
  const userStatus = userInfo.status;
  userStatus[key] = value;
  localStorage.setItem("userInfo", JSON.stringify(userInfo));
}

async function fetchUserPlan(token = "") {
  if (token == "") token = localStorage.getItem("watifyToken");

  const response = await fetch(
    `https://watify.io/checkPlan?fetchUserPlan=1&token=${token}`,
    {
      method: "GET",
    }
  );

  const data = await response.text();
  return JSON.parse(data);
}

export { getUserInfo, setUserStatus, setUserInfo, fetchUserPlan };