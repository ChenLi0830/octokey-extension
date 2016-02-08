var tabsOpened = {};
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
        if (tabsOpened[tabId].task !== "new_tab_login") return;

        if ($.inArray(tabsOpened[tabId].url, iframeSiteList) === -1) {//不包含在iframeSiteList的名单里
            //console.log("webNavigation.onCompleted logging in", tabsOpened[tabId].url, tabsOpened[tabId]);
            tabsOpened[tabId].doneLoadingPage = true;
            loginIfReady(tabId);
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

    console.log("decrypted text:", plaintextArray.toString());
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

        const registerLink = request.registerLink;
        const userId = request.userId;
        const appId = request.appId;
        const regType = request.regType;
        const username = request.account;
        const origin = request.origin;

        //TODO 生成password
        const password = "Abc123***!";

        chrome.tabs.create({"url": registerLink}, function (tab) {
            tabsOpened[tab.id] =
            {"username": username, "password": password, "url": registerLink, "task": request.message};
        });
    }
});

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
