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
        const password = request.password;

        chrome.tabs.create({"url": loginLink}, function (tab) {
            tabsToSend[tab.id] = {"username": username, "password": password, "url": loginLink};
        });
    }
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    //alert("tab.url:"+ tab.url);
    if ($.inArray(tab.url, iframeSiteList) > -1) {//在iframeSiteList名单里
        if (tabsToSend[tabId]) {//从background js里创建的（收到zenID的request才打开的tab）
            if (changeInfo.status === "complete") {
                //console.log("tabs.onUpdate tab.url: " + tab.url);
                const username = tabsToSend[tabId].username;
                const password = tabsToSend[tabId].password;
                delete tabsToSend[tabId];

                setTimeout(function () {
                    chrome.tabs.sendMessage(tabId,
                        {event: "new_login_opened", username: username, password: password},
                        function (response) {
                            console.log(response);
                        });
                }, 100);
                //再多等0.1秒保证DOM都mount好
            }
        }
    }
});

chrome.webNavigation.onDOMContentLoaded.addListener(function (details) {//对于大部分网站,webNavigation.onComplete来login
//chrome.webNavigation.onCompleted.addListener(function (details) {//对于大部分网站,webNavigation.onComplete来login
    const tabId = details.tabId;
    if (tabsToSend[tabId]) {
        if ($.inArray(tabsToSend[tabId].url, iframeSiteList) === -1) {//不包含在iframeSiteList的名单里
            //console.log("webNavigation, details.url: " + details.url);
            const username = tabsToSend[tabId].username;
            const password = tabsToSend[tabId].password;
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
});

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
