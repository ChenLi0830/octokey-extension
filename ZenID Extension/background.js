/*chrome.browserAction.onClicked.addListener(function(tab){
 //send a message to the active tab
 chrome.tabs.query({active:true, currentWindow: true}, function(tabs){
 var activeTab = tabs[0];
 chrome.tabs.sendMessage(activeTab.id, {"message":"clicked_browser_action"});
 });
 });*/

var tabsToSend = {};
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
    if (request.message === "open_new_login") {
        const loginLink = request.loginLink;
        const username = request.username;
        const userId = request.userId;
        const appId = request.appId;
        const origin = request.origin;
        //const password = request.password;

        chrome.tabs.create({"url": loginLink}, function (tab) {
            tabsToSend[tab.id] = {"username": username, "url": loginLink};
            getPassword(username, userId, appId, origin, tab.id);
        });
    }
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    //alert("tab.url:"+ tab.url);
    if (tabsToSend[tabId]) {//从background js里创建的（收到zenID的request才打开的tab）
        if ($.inArray(tabsToSend[tabId].url, iframeSiteList) > -1) {//在iframeSiteList名单里
            if (changeInfo.status === "complete") {
                tabsToSend[tabId].doneLoadingPage = true;
                loginIfReady(tabId);
            }
        }
    }
});

//chrome.webNavigation.onDOMContentLoaded.addListener(function (details) {//对于大部分网站,webNavigation.onComplete来login
chrome.webNavigation.onCompleted.addListener(function (details) {//对于大部分网站,webNavigation.onComplete来login
    const tabId = details.tabId;
    if (tabsToSend[tabId]) {
        console.log("webNavigation.onCompleted.tabsToSend[tabId]",tabsToSend[tabId]);
        if ($.inArray(tabsToSend[tabId].url, iframeSiteList) === -1) {//不包含在iframeSiteList的名单里
            tabsToSend[tabId].doneLoadingPage = true;
            loginIfReady(tabId);
        }
    }
});

function getPassword(username, userId, appId, origin, tabId) {
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
                const password = credentialObj[objKey]["publicApps"][0]["password"];

                tabsToSend[tabId].password = password;
                tabsToSend[tabId].doneGettingPwd = true;
                //console.log("doneGettingPwd - tabsToSend[tabId]", tabsToSend[tabId]);
                loginIfReady(tabId);

            })
            .fail(function (err) {
                console.log('there is some error', err);
            });
    });
}

function loginIfReady(tabId) {
    if (tabsToSend[tabId].doneGettingPwd && tabsToSend[tabId].doneLoadingPage) {
        const username = tabsToSend[tabId].username;
        const password = tabsToSend[tabId].password;
        console.log("login start for ",tabsToSend[tabId].url);
        delete tabsToSend[tabId];

        setTimeout(function () {
            chrome.tabs.sendMessage(tabId,
                {event: "new_login_opened", username: username, password: password},
                function (response) {
                    console.log(response);
                });
        }, 100);
    }
}

//chrome.tabs.query({active:true,currentWindow:true},function(tabs){
//  var activeTab = tabs[0];
//  chrome.tabs.sendMessage(activeTab.id,{"message":"new_login_opened"});
//  //chrome.tabs.sendMessage(activeTab.id,{"message":"new_login_opened", "username":username, "password":password});
//
// });


/*
 chrome.runtime.onMessage.addListener(
 function(request, sender, sendResponse){
 if (request.message==="open_new_tab"){
 console.log("openNewTab from backend script");
 chrome.tabs.create({"url":request.url});
 }
 });*/
