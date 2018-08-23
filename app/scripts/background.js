(function () {
  window.tabsOpened = {};
  var authTabs = [];
  //Todo - move this to database, more specifically, add a record in each app's document.
  var iframeSiteList = [
    "tmall.com",
    "qq.com",
    "163.com",
    "aliyun.com",
    "webmail30.189.cn",
    "icloud.com",
    //"http://i.xunlei.com/login.html",
    //"https://pan.baidu.com/",
    //"https://passport.baidu.com/v2/?login",
    //"http://www.nuomi.com/pclogin/main/loginpage",
    //"http://passport.acfun.tv/login/",
    //"https://login.taobao.com/"
  ];

  //当检测extension安装时,reload octokeyteam tabs, 保证extension生效
  chrome.runtime.onInstalled.addListener(function (details) {
    console.log("onInstalled triggered - details:", details);
    if (details.reason === "install" || details.reason === "update") {
      chrome.windows.getAll({populate: true}, function (windows) {
        windows.forEach(function (window) {
          window.tabs.forEach(function (tab) {
            if (/octokeyteam/.test(tab.url)) {//If the tab url contains 'octokeyteam'
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

    var newURL = "https://octokeyteam.com";
    console.log("localStorage", localStorage);
    if (localStorage.length === 0) {
      //之前从没有用过Octokey
      newURL = "https://octokeyteam.com";
    } else {
      //之前用过Octokey
      newURL = "https://octokeyteam.com";
    }
    chrome.tabs.create({url: newURL});
  });

  chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    switch (message.message) {
      case "new_tab_login":
        console.log("message", message) ;
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

        //console.log("popUpLogin", popUpLogin);
        //if (popUpLogin) {//如果是popUp login,删除该网站的所有cookie,保证一定需要login
        chrome.cookies.getAll({url: loginLink}, function (cookies) {
          for (var i = 0; i < cookies.length; i++) {
            var cookieName = cookies[i].name;
            chrome.cookies.remove({url: loginLink, name: cookieName});
          }
        });
        //}

        chrome.tabs.create({"url": loginLink}, function (tab) {//建立新tab,打开loginLink
          tabsOpened[tab.id] =
          {
            "username": username,
            "url": loginLink,
            "task": message.message,
            "overlay": false,
            "popUpLogin": popUpLogin
          };

          if (password.length === 0) {
            console.log("Haven't get password from webapp!");
            //getPassword(username, userId, appId, origin, tab.id, hexIv, hexKey);
          } else {
            //const decryptedPassword = decryptAES(password, hexIv, hexKey);
            //console.log("password is passed in directly, ", decryptedPassword);
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
      //停止用plugin登录
      /*      case "store_user_info":
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
       break;*/
      case "new_tab_home":
        console.log("message", message);
        const homepageLink = message.homepageLink;
        /*            appId = message.appId,
         origin = message.origin;*/

        chrome.tabs.create({"url": homepageLink}, function (tab) {//建立新tab,打开loginLink
          console.log("visit homepage", homepageLink, " in tab ", tab);
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

          // Add overlay if not added yet
          if (!tabsOpened[tabId].overlay) {
            tabsOpened[tabId].overlay = true;
            //console.log("getting password");
            chrome.tabs.executeScript(tabId,
                {file: "scripts/loginOverlay.js", runAt: "document_start"});
            chrome.tabs.insertCSS(tabId,
                {file: "styles/overlay.css", runAt: "document_start"});
          }

          if (isNotContainedBy(tabsOpened[tabId].url, iframeSiteList)) {//不包含在iframeSiteList的名单里
            console.log("不包含在iframe名单里, webNavigation.onDOMContentLoaded logging in", tabsOpened[tabId].url,
                tabsOpened[tabId].username, "popUpLogin", tabsOpened[tabId].popUpLogin);

            tabsOpened[tabId].doneLoadingPage = true;
            //setTimeout(loginIfReady.bind(this, tabId), 5000);
            loginIfReady(tabId);
          }
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

  chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    //console.log("updated, changeInfo", changeInfo);

    // Stop login 如果tabUrl is updated(user's already logged in)
    if (tabsOpened[tabId] && tabsOpened[tabId].task === "new_tab_login" && changeInfo.url) {
      //有两种情况我们认为算是url改变:
      // 1. 如果跳转链接和登录链接互不包含, 比如abc.com变成bcd.com
      // 2. 如果登录链接包括login, signin, 而跳转链接不包含
      // 而这种情况不算url改变比如www.abc.com 变成 www.abc.com?uId=123, 不算改url
      const urlChanged =
          (
              changeInfo.url.indexOf(tabsOpened[tabId].url) === -1 &&
              tabsOpened[tabId].url.indexOf(changeInfo.url) === -1
          ) || (
              tabsOpened[tabId].url.indexOf("login") > -1 &&
              changeInfo.url.indexOf("login") === -1
          ) || (
              tabsOpened[tabId].url.indexOf("signin") > -1 &&
              changeInfo.url.indexOf("signin") === -1
          );
      if (urlChanged) {
        console.log("tab " + tabId + "'s url is updated from ", tabsOpened[tabId].url, " to ",
            changeInfo.url,
            "stop login script for this page");
        delete tabsOpened[tabId];
        return;
      }
    }

    //对于有iframe的应用, 需要等到 status === "complete" 才能开始登录
    if (tabsOpened[tabId] && tabsOpened[tabId].task === "new_tab_login" &&
        changeInfo.status === "complete") {

      if (!isNotContainedBy(tabsOpened[tabId].url, iframeSiteList)) {//包含在 iframeSiteList的名单里
        console.log("包含在iframe名单里, tabs.onUpdated complete logging in", tabsOpened[tabId].url,
            tabsOpened[tabId]);

        tabsOpened[tabId].doneLoadingPage = true;
        //setTimeout(loginIfReady.bind(this, tabId), 5000);
        loginIfReady(tabId);
      }
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