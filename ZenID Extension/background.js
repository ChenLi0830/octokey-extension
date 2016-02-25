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

    chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
        switch (message.message) {
            case "new_tab_login":
                const loginLink = message.loginLink,
                    username = message.username,
                    userId = message.userId,
                    appId = message.appId,
                    password = message.password,
                    hexIv = message.hexIv,
                    hexKey = message.hexKey,
                    origin = message.origin;
                //const password = message.password;

                chrome.tabs.create({"url": loginLink}, function (tab) {
                    tabsOpened[tab.id] =
                    {"username": username, "url": loginLink, "task": message.message, "overlay": false};

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

                chrome.windows.create({
                    url: registerLink,
                    left: 500,
                    top: 500,
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
                        "task": message.message, "windowId": createdWindow.id, "step": 0, "senderTabId": sender.tab.id,
                        "appId": message.appId, "userProfile": message.profile, "userId": message.userId,
                    };

                    //console.log("tabsOpened", tabsOpened);
                    //alert("new window created");
                });
                break;

            case "close_login_overflow":
                // remove layout
                switch (message.status) {
                    case "reachMaximum":
                    case "needManualClick":
                    case "captchaExist":
                    case "successful":
                        chrome.tabs.executeScript(sender.tab.id,
                            {file: "loginOverlayComplete.js", runAt: "document_start"});
                        break;
                    case "stopped_by_background":
                        chrome.tabs.executeScript(sender.tab.id,
                            {file: "loginOverlayStopped.js", runAt: "document_start"});
                        break;
                }

                break;

            case "stop_login":
                console.log("background script cancel");
                chrome.tabs.sendMessage(sender.tab.id, {event: "stop_login"});
                break;
        }
    });

    chrome.webNavigation.onDOMContentLoaded.addListener(function (details) {//对于大部分网站,webNavigation.onDOMContentLoaded来login
        //chrome.webNavigation.onCompleted.addListener(function (details) {//对于大部分网站,webNavigation.onComplete来login
        const tabId = details.tabId;
        //console.log("tabsOpened", tabsOpened);
        if (tabsOpened[tabId]) {
            switch (tabsOpened[tabId].task) {
                case "new_tab_login":
                    if (!tabsOpened[tabId].overlay) {//If not put overlay yet
                        tabsOpened[tabId].overlay = true;
                        console.log("getting password");
                        chrome.tabs.executeScript(tabId, {file: "loginOverlay.js", runAt: "document_start"});
                        chrome.tabs.insertCSS(tabId, {file: "overlay.css", runAt: "document_start"});
                    }

                    //if ($.inArray(tabsOpened[tabId].url, iframeSiteList) === -1 || true) {//不包含在iframeSiteList的名单里
                    //console.log("webNavigation.onCompleted logging in", tabsOpened[tabId].url, tabsOpened[tabId]);
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

    chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
        /* stop login 如果tabUrl is updated(user's already logged in)*/
        if (tabsOpened[tabId] && tabsOpened[tabId].task === "new_tab_login" && changeInfo.url &&
            changeInfo.url != tabsOpened[tabId].url) {
            console.log("tab " + tabId + "'s url is updated to", changeInfo.url, "stop login script for this page");
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