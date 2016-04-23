//console.log("Hello from content script!");
var isInstalledNode = document.createElement('div');
isInstalledNode.id = 'extension-is-installed-nehponjfbiigcobaphdahhhiemfpaeob';

window.onload = function () {
  document.body.appendChild(isInstalledNode);

  // Request user info and hexIv from Octokey
  const targetUrl = document.location.origin;
  window.postMessage(//Communicate with web page
      {type: "extensionRequestInfo"},
      targetUrl
  );
};

window.addEventListener("message", function (event) {
  var origin = event.origin || event.originalEvent.origin; // For Chrome, the origin property is in
                                                           // the event.originalEvent object.
  if (origin !== document.location.origin) {//make sure message comes from the web app.
    return;
  }

  if (event.data.event === "logIn") {
    this.handleLogin(event, origin);
  }
  else if (event.data.event === "register") {
    this.handleRegister(event, origin);
  }
  else if (event.data.event === "sendInfoToExtension") {
    this.handleSendInfoToBackground(event, origin);
  }
}, false);

function handleLogin(event, origin) {
  if (event.data.event === "logIn") {
    event.data.message = "new_tab_login";
    event.data.origin = origin;
    chrome.runtime.sendMessage(event.data);
  } else {
    console.log("Invalid call for handleLogin function.")
  }
}

function handleRegister(event, origin) {
  if (event.data.event === "register") {
    event.data.message = "new_tab_register";

    //const registerLink = "https://reg.taobao.com/member/reg/fill_mobile.htm";
    //const registerLink = "//user.quna.com/Reg.aspx";
    //const registerLink = "https://www.dropbox.com/login";
    //const registerLink = "https://github.com/join";
    //event.data.registerLink = registerLink;

    chrome.runtime.sendMessage(event.data);
  } else {
    console.log("Invalid call for handleRegister function.")
  }
}

function handleSendInfoToBackground(event, origin) {
  event.data.origin = origin;
  console.log("event.data", event.data);
  event.data.message = "store_user_info";
  chrome.runtime.sendMessage(event.data);
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.type === "registerProgress") {
    console.log("request", request);
    const targetUrl = document.location.origin;
    window.postMessage(//Communicate with web page
        request,
        targetUrl
    );
  }
});
