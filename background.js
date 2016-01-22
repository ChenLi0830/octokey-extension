/*chrome.browserAction.onClicked.addListener(function(tab){
 //send a message to the active tab
 chrome.tabs.query({active:true, currentWindow: true}, function(tabs){
 var activeTab = tabs[0];
 chrome.tabs.sendMessage(activeTab.id, {"message":"clicked_browser_action"});
 });
 });*/

var tabsToSend = {};

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.message === "open_new_login") {
        const loginLink = request.loginLink;
        const username = request.username;
        const password = request.password;

        chrome.tabs.create({"url": loginLink}, function (tab) {
            tabsToSend[tab.id] = {"username": username, "password": password};
        });
    }

    if (request.message === "script_loading_complete") {
        alert("script_loading_complete");
        alert("sender tab id:" + sender.tab.id);
    }
});

chrome.webNavigation.onCompleted.addListener(function (details) {
    const tabId = details.tabId;
    if (tabsToSend[tabId]) {
        //alert("onDOMContentLoaded triggered");
        //if (info.status == "complete") {
        //if (info.status == "loading") {
        const username = tabsToSend[tabId].username;
        const password = tabsToSend[tabId].password;
        delete tabsToSend[tabId];

        chrome.tabs.sendMessage(tabId,
            {event: "new_login_opened", username: username, password: password},
            function (response) {
                console.log(response);
            });
        //}
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
