(function () {
    window.tabsOpened = {};
    var authTabs = [];
    var iframeSiteList = [
        "https://login.tmall.com/",
        "http://i.xunlei.com/login.html",
        "https://pan.baidu.com/",
        "https://passport.baidu.com/v2/?login",
        "http://www.nuomi.com/pclogin/main/loginpage",
        "http://passport.acfun.tv/login/",
        "https://login.taobao.com/"
    ];

    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        switch (request.message) {
            case "new_tab_login":
                const loginLink = request.loginLink,
                    username = request.username,
                    userId = request.userId,
                    appId = request.appId,
                    password = request.password,
                    hexIv = request.hexIv,
                    hexKey = request.hexKey,
                    origin = request.origin;
                //const password = request.password;

                chrome.tabs.create({"url": loginLink}, function (tab) {
                    tabsOpened[tab.id] =
                    {"username": username, "url": loginLink, "task": request.message, "overlay": false};
                    if (password.length === 0) {
                        getPassword(username, userId, appId, origin, tab.id, hexIv, hexKey);
                    } else {
                        tabsOpened[tab.id].password = password;
                        tabsOpened[tab.id].doneGettingPwd = true;
                    }
                });
                break;

            case "new_tab_register":
                const registerLink = request.registerLink;
                //const userId = request.userId;
                //const appId = request.appId;
                //const accountType = request.accountType;
                //const username = request.account;
                //const origin = request.origin;

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
                        "task": request.message, "windowId": createdWindow.id, "step": 0, "senderTabId": sender.tab.id,
                        "appId": request.appId, "userProfile": request.profile, "userId": request.userId,
                    };

                    //console.log("tabsOpened", tabsOpened);
                    //alert("new window created");
                });
                break;
        }
    });

    chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
        //alert("tab.url:"+ tab.url);
        if (tabsOpened[tabId]) {//从background js里创建的（收到zenID的request才打开的tab）
            if (tabsOpened[tabId].task !== "new_tab_login") return;

            if ($.inArray(tabsOpened[tabId].url, iframeSiteList) > -1) {//在iframeSiteList名单里
                if (changeInfo.status === "complete") {
                    //console.log("chrome.tabs.onUpdated logging in", tabsOpened[tabId].url, tabsOpened[tabId]);
                    tabsOpened[tabId].doneLoadingPage = true;
                    loginIfReady(tabId);
                }
            }
        }
    });

    //chrome.webNavigation.onDOMContentLoaded.addListener(function (details) {//对于大部分网站,webNavigation.onComplete来login
    chrome.webNavigation.onCompleted.addListener(function (details) {//对于大部分网站,webNavigation.onComplete来login
        const tabId = details.tabId;
        //console.log("tabsOpened", tabsOpened);
        if (tabsOpened[tabId]) {
            switch (tabsOpened[tabId].task) {
                case "new_tab_login":
                    if ($.inArray(tabsOpened[tabId].url, iframeSiteList) === -1) {//不包含在iframeSiteList的名单里
                        //console.log("webNavigation.onCompleted logging in", tabsOpened[tabId].url, tabsOpened[tabId]);
                        tabsOpened[tabId].doneLoadingPage = true;
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

    chrome.webNavigation.onDOMContentLoaded.addListener(function (details) {//对于大部分网站,webNavigation.onComplete来login
        const tabId = details.tabId;
        //chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
        if (tabsOpened[tabId]) {
            //if (changeInfo.status === "loading") {
            switch (tabsOpened[tabId].task) {
                case "new_tab_login":
                    if (!tabsOpened[tabId].overlay){//If not put overlay yet
                        tabsOpened[tabId].overlay = true;
                        chrome.tabs.executeScript(tabId, {file: "passwordOverlay.js", runAt: "document_start"});
                        chrome.tabs.insertCSS(tabId, {file: "overlay.css", runAt: "document_start"});
                        if (tabsOpened[tabId].doneGettingPwd)
                        setTimeout(function () {
                            chrome.tabs.executeScript(tabId, {file: "passwordObtained.js", runAt: "document_start"});
                        }, 1000);
                        //}
                        break;
                    }
                case "new_tab_register":
                    break;
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