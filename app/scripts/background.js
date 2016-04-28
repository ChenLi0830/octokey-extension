(function () {
  window.tabsOpened = {};
  var authTabs = [];
  //var iframeSiteList = [
  //    "https://login.tmall.com/",
  //    "http://i.xunlei.com/login.html",
  //    "https://pan.baidu.com/",
  //    "https://passport.baidu.com/v2/?login",
  //    "http://www.nuomi.com/pclogin/main/loginpage",
  //    "http://passport.acfun.tv/login/",
  //    "https://login.taobao.com/"
  //];

  //当检测extension安装时,reload oyaoshi tabs, 保证extension生效
  chrome.runtime.onInstalled.addListener(function (details) {
    console.log("onInstalled triggered - details:", details);
    if (details.reason === "install") {
      chrome.windows.getAll({populate: true}, function (windows) {
        windows.forEach(function (window) {
          window.tabs.forEach(function (tab) {
            if (/oyaoshi/.test(tab.url)) {//If the tab url contains 'oyaoshi'
              console.log("tab", tab);
              chrome.tabs.reload(tab.id);
              //tab.
            }
          });
        });
      });
    }
  });

  chrome.browserAction.onClicked.addListener(function (activeTab) {

    var newURL = "http://www.oyaoshi.com";
    console.log("localStorage", localStorage);
    if (localStorage.length === 0) {
      newURL = "http://www.oyaoshi.com";
    } else {
      newURL = "https://oyaoshi.com";
    }
    chrome.tabs.create({url: newURL});
  });

  chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    switch (message.message) {
      case "new_tab_login":
        console.log("message", message);
        //console.log("localStorage", localStorage);
        const loginLink = message.loginLink,
            username = message.username,
            userId = localStorage.userId,
            appId = message.appId,
            password = message.password,
            hexIv = localStorage.hexIv,
            hexKey = localStorage.hexKey,
            origin = message.origin,
            popUpLogin = message.popUpLogin;

        console.log("popUpLogin", popUpLogin);
        if (popUpLogin) {
          chrome.cookies.getAll({url: loginLink}, function (cookies) {
            for (var i = 0; i < cookies.length; i++) {
              var cookieName = cookies[i].name;
              chrome.cookies.remove({url: loginLink, name: cookieName});
            }
          });
        }

        chrome.tabs.create({"url": loginLink}, function (tab) {
          tabsOpened[tab.id] =
          {
            "username": username,
            "url": loginLink,
            "task": message.message,
            "overlay": false,
            "popUpLogin": popUpLogin
          };

          if (password.length === 0) {
            getPassword(username, userId, appId, origin, tab.id, hexIv, hexKey);
          } else {
            tabsOpened[tab.id].password = password;
            tabsOpened[tab.id].doneGettingPwd = true;
          }
        });
        break;

      case "new_tab_register":
        const registerLink = message.registerLink;

        return chrome.windows.getCurrent(null, function (current_window) {
          return chrome.windows.create({
            url: registerLink,
            left: current_window.left + 10,
            top: current_window.top + 10,
            focused: false,
            height: 1,
            width: 1,
          }, function (createdWindow) {
            //第一件事就是focus回之前的window
            chrome.windows.update(sender.tab.windowId, {
              focused: true
            });

            tabsOpened[createdWindow.tabs[0].id] =
            {
              "task": message.message,
              "windowId": createdWindow.id,
              "step": 0,
              "senderTabId": sender.tab.id,
              "appId": message.appId,
              "userProfile": message.profile,
              "userId": localStorage.userId,
            };

            //console.log("tabsOpened", tabsOpened);
            //alert("new window created");
          });
        });

        break;

      case "close_login_overflow":
        // remove layout
        switch (message.status) {
          case "reachMaximum":
          case "needManualClick":
          case "successful":
            chrome.tabs.executeScript(sender.tab.id,
                {file: "scripts/loginOverlayComplete.js", runAt: "document_start"});
            break;
          case "captchaExist":
            chrome.tabs.executeScript(sender.tab.id,
                {file: "scripts/loginOverlayCaptcha.js", runAt: "document_start"});
            break;
          case "stopped_by_background":
            chrome.tabs.executeScript(sender.tab.id,
                {file: "scripts/loginOverlayStopped.js", runAt: "document_start"});
            break;
        }
        break;
      case "stop_login":
        console.log("background script cancel");
        chrome.tabs.sendMessage(sender.tab.id, {event: "stop_login"});
        break;
      case "store_user_info":
        //console.log("store_user_info message", message);
        validateToken(message.userId, message.loginToken, message.origin,
            function (error, tokenIsValid) {
              if (error) {
                console.log("error", error);
              }
              if (tokenIsValid) {
                console.log("user token is valid, and userId matches the token");
                //localStorage["loginToken"] = message.loginToken;
                localStorage["loginTokenExpires"] = message.loginTokenExpires;
                localStorage["userId"] = message.userId;
                localStorage["hexIv"] = message.hexIv;
                localStorage["hexKey"] = message.hexKey;
              } else {
                console.log("token is invalid");
                localStorage.clear();
              }
            });
        break;
    }
  });

  chrome.webNavigation.onDOMContentLoaded.addListener(function (details) {//对于大部分网站,webNavigation.onDOMContentLoaded来login
    //chrome.webNavigation.onCompleted.addListener(function (details)
    // {//对于大部分网站,webNavigation.onComplete来login
    const tabId = details.tabId;
    //console.log("tabsOpened", tabsOpened);
    if (tabsOpened[tabId]) {
      switch (tabsOpened[tabId].task) {
        case "new_tab_login":
          if (!tabsOpened[tabId].overlay) {//If not put overlay yet
            tabsOpened[tabId].overlay = true;
            console.log("getting password");
            chrome.tabs.executeScript(tabId,
                {file: "scripts/loginOverlay.js", runAt: "document_start"});
            chrome.tabs.insertCSS(tabId,
                {file: "styles/overlay.css", runAt: "document_start"});
          }

          //if ($.inArray(tabsOpened[tabId].url, iframeSiteList) === -1 || true)
          // {//不包含在iframeSiteList的名单里 console.log("webNavigation.onCompleted logging in",
          // tabsOpened[tabId].url, tabsOpened[tabId]);
          tabsOpened[tabId].doneLoadingPage = true;
          loginIfReady(tabId);
          //}
          break;
        case "new_tab_register":
          if (tabsOpened[tabId].lastStep >= tabsOpened[tabId].step) return;

          const senderTabId = tabsOpened[tabId].senderTabId;
          const password = generatePassword();
          //console.log("tabsOpened[tabId]",tabsOpened[tabId]);
          console.log("password", password);
          tabsOpened[tabId].lastStep = tabsOpened[tabId].step;
          chrome.tabs.sendMessage(tabId, {
                event: "new_register_opened",
                step: tabsOpened[tabId].step,
                password: password,
                profile: tabsOpened[tabId].userProfile,
              },
              function (response) {
                if (response.username) console.log("response", response);
                response.type = "registerProgress";
                response.tabId = tabId;
                response.appId = tabsOpened[tabId].appId;
                response.userId = tabsOpened[tabId].userId;
                chrome.tabs.sendMessage(senderTabId, response);

                console.log("response.step", response.step);
                tabsOpened[tabId].step = response.step;
                if (response.step <= -1) {//Remove the tab when its ready to be closed.
                  chrome.windows.remove(tabsOpened[tabId].windowId);
                  delete tabsOpened[tabId];
                }
                if (response.step === -2) {
                  //Todo report error.
                }
              });
          break;
      }
    }
  });

  // For apps whose login link is not a popup window, If page is redirected (the user is
  // already logged in), stop logging in
  chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    /* stop login 如果tabUrl is updated(user's already logged in)*/
    if (tabsOpened[tabId] && tabsOpened[tabId].task === "new_tab_login" && changeInfo.url &&
        changeInfo.url != tabsOpened[tabId].url) {
      console.log("tab " + tabId + "'s url is updated to", changeInfo.url,
          "stop login script for this page");
      delete tabsOpened[tabId];
    }
  });

  // Register
  chrome.webRequest.onHeadersReceived.addListener(
      function (info) {
        var headers = info.responseHeaders;
        for (var i = headers.length - 1; i >= 0; --i) {
          var header = headers[i].name.toLowerCase();
          if (header == 'x-frame-options' || header == 'frame-options') {
            headers.splice(i, 1); // Remove header
          }
        }
        return {responseHeaders: headers};
      },
      {
        urls: ['*://*/*'], // Pattern to match all http(s) pages
        types: ['sub_frame']
      },
      ['blocking', 'responseHeaders']
  );
})();