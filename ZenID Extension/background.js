var tabsOpened = {};
var authTabs = [];
window.windowIdMaps = [];
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
    if (request.message === "new_tab_login") {
        const loginLink = request.loginLink;
        const username = request.username;
        const userId = request.userId;
        const appId = request.appId;
        const password = request.password;
        const hexIv = request.hexIv;
        const hexKey = request.hexKey;
        const origin = request.origin;
        //const password = request.password;

        chrome.tabs.create({"url": loginLink}, function (tab) {
            if (password.length === 0) {
                tabsOpened[tab.id] = {"username": username, "url": loginLink, "task": request.message};
                getPassword(username, userId, appId, origin, tab.id, hexIv, hexKey);
            } else {
                tabsOpened[tab.id] =
                {"username": username, "password": password, "url": loginLink, "task": request.message};
                tabsOpened[tab.id].doneGettingPwd = true;
            }
        });
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
                chrome.tabs.executeScript(tabId, {
                        allFrames: true,
                        file: 'testIframe.js'
                    });
                delete tabsOpened[tabId];
                break;
        }
    }
});

function getPassword(username, userId, appId, origin, tabId, hexIv, hexKey) {
    const urlSplit = origin.split("//");
    //console.log("urlSplit",urlSplit);
    const DdpUri = "ws://" + urlSplit[1] + "/websocket";
    //console.log("DdpUri",DdpUri);
    var ddp = new MeteorDdp(DdpUri);

    ddp.connect().then(function () {
        //console.log("ddp.connect successful for", "appId ", appId, " username ", username);
        ddp.subscribe("appCredential", [userId, appId, username])
            .then(function () {
                //console.log("subscribeCollection successful",ddp.getCollection("userAppCredentials"));
                var credentialObj = ddp.getCollection("userAppCredentials");
                //console.log("credentialObj",credentialObj);
                const objKey = Object.keys(credentialObj)[0];
                const encryptedPwd = credentialObj[objKey]["publicApps"][0]["password"];

                tabsOpened[tabId].password = decryptAES(encryptedPwd, hexIv, hexKey);
                tabsOpened[tabId].doneGettingPwd = true;
                //console.log("doneGettingPwd - tabsOpened[tabId]", tabsOpened[tabId]);
                loginIfReady(tabId);

            })
            .fail(function (err) {
                console.log('there is some error', err);
            });
    });
}

function decryptAES(encryptedPwd, hexIv, hexKey) {
    var plaintextArray = CryptoJS.AES.decrypt(
        {ciphertext: CryptoJS.enc.Hex.parse(encryptedPwd)},
        CryptoJS.enc.Hex.parse(hexKey),
        {iv: CryptoJS.enc.Hex.parse(hexIv)}
    );

    plaintextArray = CryptoJS.enc.Hex.stringify(plaintextArray);

    function hex2a(hex) {
        var str = '';
        for (var i = 0; i < hex.length; i += 2)
            str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
        return str;
    }

    //console.log("decrypted text:", hex2a(plaintextArray.toString());
    return hex2a(plaintextArray.toString());
}

function loginIfReady(tabId) {
    if (tabsOpened[tabId].doneGettingPwd && tabsOpened[tabId].doneLoadingPage) {
        const username = tabsOpened[tabId].username;
        const password = tabsOpened[tabId].password;
        console.log("login start for ", tabsOpened[tabId].url);
        delete tabsOpened[tabId];

        setTimeout(function () {
            chrome.tabs.sendMessage(tabId,
                {event: "new_login_opened", username: username, password: password},
                function (response) {
                    console.log(response);
                });
        }, 100);
    }
}

// Register


chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {

    if (request.message === "new_tab_register") {
        //alert("new_tab_register");
        const registerLink = request.registerLink;
        const userId = request.userId;
        const appId = request.appId;
        const regType = request.regType;
        const username = request.account;
        const origin = request.origin;

        chrome.windows.create({
            url: registerLink,
            left: 500,
            top: 500,
            focused: false,
            height: 1,
            width: 1
        }, function (createdWindow) {
            //第一件事就是focus回之前的window
            chrome.windows.update(sender.tab.windowId, {
                focused: true
            });

            console.log("createdWindow", createdWindow);
            windowIdMaps.push({
                id: createdWindow.id,
            });

            tabsOpened[createdWindow.tabs[0].id] = {"task": request.message};

            console.log("windowIdMaps", windowIdMaps);
            console.log("tabsOpened", tabsOpened);
            //alert("new window created");
        });

        console.log("sender", sender);


        //focusWindow(sender.tab)

        //chrome.tabs.executeScript(sender.tab.id, {
        //    allFrames: true,
        //    file: 'testIframe.js'
        //});
        /*
         /!* generate an iFrame *!/
         const registerLink = request.registerLink;
         const userId = request.userId;
         const appId = request.appId;
         const regType = request.regType;
         const username = request.account;
         const origin = request.origin;

         var iframe;
         iframe = document.createElement('iframe');
         iframe.src = registerLink;
         iframe.width = "500";
         iframe.height = "500";
         //iframe.id = "iframe";
         //iframe.style.display = 'none';
         document.body.appendChild(iframe);

         iframe.onload = function(){
         const cellNumber = "7097490481";
         const password = "7097490481";
         const nickName = "ChenLi_zhangyu";
         const email = "lulugeo.li+account@gmail.com";
         const firstName = "Chen";
         const lastName = "Li";

         //Dropbox
         document.getElementsByClassName("login-register-switch-link")[0].click();
         setTimeout(function(){
         document.querySelectorAll("input[name='fname']")[0].value = firstName;
         document.querySelectorAll("input[name='lname']")[0].value = firstName;
         document.querySelectorAll("input[name='email'][type='email']")[0].value = email;
         document.querySelectorAll("input[name='password'][type='password']")[0].value = password;
         document.querySelectorAll("input[type='checkbox'][name='tos_agree']")[0].checked = true;
         document.querySelectorAll("button[class='login-button button-primary'][type='submit']")[2].click();
         },2500);
         };
         */

        /* ************ Open in original tab *************/
        //console.log("sender.tab", sender.tab.id);
        //chrome.tabs.executeScript(sender.tab.id, {
        //    allFrames: true,
        //    file: 'testIframe.js'
        //});

        /* **************** register in new tab ********************* */
        //const registerLink = request.registerLink;
        //const userId = request.userId;
        //const appId = request.appId;
        //const regType = request.regType;
        //const username = request.account;
        //const origin = request.origin;
        //
        ////TODO 生成password
        //const password = "Abc123***!";
        //
        //chrome.tabs.create({"url": registerLink}, function (tab) {
        //    tabsOpened[tab.id] =
        //    {"username": username, "password": password, "url": registerLink, "task": request.message};
        //});

    }
});

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

/*
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (tabsOpened[tabId]) {
        const username = tabsOpened[tabId].username;
        const password = tabsOpened[tabId].password;
        if (tabsOpened[tabId].task !== "new_tab_register") return;

        if (changeInfo.status === "complete") {
            console.log("register start for ", tabsOpened[tabId].url);
            delete tabsOpened[tabId];


            setTimeout(function () {
                chrome.tabs.sendMessage(tabId,
                    {event: "new_register_opened", username: username, password: password},
                    function (response) {
                        console.log(response);
                    });
            }, 100);
        }
    }
});
*/


//chrome.webNavigation.onCompleted.addListener(function (details) {//对于大部分网站,webNavigation.onComplete来login
//    const tabId = details.tabId;
//    if (tabsOpened[tabId]) {
//        const username = tabsOpened[tabId].username;
//        const password = tabsOpened[tabId].password;
//        if (tabsOpened[tabId].task !== "new_tab_register") return;
//
//        console.log("register start for ", tabsOpened[tabId].url);
//        delete tabsOpened[tabId];
//
//        setTimeout(function () {
//            chrome.tabs.sendMessage(tabId,
//                {event: "new_register_opened", username: username, password: password},
//                function (response) {
//                    console.log(response);
//                });
//        }, 100);
//    }
//});
//
