//console.log("Hello from content script!");
var isInstalledNode = document.createElement('div');
isInstalledNode.id = 'extension-is-installed-nehponjfbiigcobaphdahhhiemfpaeob';

window.onload = function () {
    document.body.appendChild(isInstalledNode);
};

window.addEventListener("message", function (event) {
    console.log("event", event);
    console.log("event.data", event.data);
    //console.log(document.location.origin);
    var origin = event.origin || event.originalEvent.origin; // For Chrome, the origin property is in the
                                                             // event.originalEvent object.
    if (origin !== document.location.origin) {//make sure message comes from the web app.
        return;
    }
    if (event.data.type === "logIn") {
        this.handleLogin(event, origin);
    }
    else if (event.data.type === "register") {
        this.handleRegister(event, origin);
    }
}, false);


function handleLogin(event, origin) {
    if (event.data.type == "logIn") {
        //console.log("event.data", event.data);
        //console.log("event.origin", event.origin);
        event.data.message = "new_tab_login";
        event.data.origin = origin;
        chrome.runtime.sendMessage(event.data);
    } else {
        console.log("Invalid call for handleLogin function.")
    }
}

function handleRegister(event, origin) {
    if (event.data.type == "register") {

        /* Initialization */
        event.data.message = "new_tab_register";

        //const registerLink = "https://reg.taobao.com/member/reg/fill_mobile.htm";
        //const registerLink = "//user.quna.com/Reg.aspx";
        //const registerLink = "https://www.dropbox.com/login";
        const registerLink = "https://github.com/join";
        event.data.registerLink = registerLink;

        //Todo send this only to our extension: extensionId
        //完成register部分
        chrome.runtime.sendMessage(event.data);
    } else {
        console.log("Invalid call for handleRegister function.")
    }
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.type === "registerProgress") {
        var progress = request.progress,
            message = request.message;
        console.log("request", request);
    }
    window.postMessage(//Communicate with plugin
        {
            type: "registerProgress",
            progress: progress,
            message: message,
        },
        document.location.origin
    );
});
