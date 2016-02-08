//console.log("Hello from content script!");
var isInstalledNode = document.createElement('div');
isInstalledNode.id = 'extension-is-installed-nehponjfbiigcobaphdahhhiemfpaeob';
window.onload = function () {
    document.body.appendChild(isInstalledNode);
};

window.addEventListener("message", receiveMessage, false);

function receiveMessage(event) {
    var origin = event.origin || event.originalEvent.origin; // For Chrome, the origin property is in the
                                                             // event.originalEvent object.
    //if (origin !== "http://example.org:8080")
    //  return;
    if (event.data[0] === "logIn") {
        this.handleLogin(event, origin);
    }
    else if (event.data[0] === "register"){
        this.handleRegister(event, origin);
    }
}


function handleLogin(event, origin){
    if (event.data[0] == "logIn") {
        //console.log("event.data", event.data);
        //console.log("event.origin", event.origin);

        const userId = event.data[1];
        const appId = event.data[2];
        const loginLink = event.data[3];
        const username = event.data[4];
        const password = event.data[5];

        //Todo send this only to our extension: extensionId
        chrome.runtime.sendMessage(/*extensionId,*/
            {
                "message": "new_tab_login",
                "userId": userId,
                "appId": appId,
                "loginLink": loginLink,
                "username": username,
                "password": password,
                "origin": origin,
            }
        );
    } else {
        console.log("Invalid call for handleLogin function.")
    }
}


function handleRegister(event, origin){
    if (event.data[0] == "register") {
        //console.log("event.data", event.data);
        //console.log("event.origin", event.origin);
        const userId = event.data[1];
        const appId = event.data[2];
        const registerLink = event.data[3];
        const regType = event.data[4];
        const account = event.data[5];

        //Todo send this only to our extension: extensionId
        //完成register部分
        chrome.runtime.sendMessage(/*extensionId,*/
            {
                "message": "new_tab_register",
                "userId": userId,
                "appId": appId,
                "registerLink": registerLink,
                "regType": regType,
                "account": account,
                "origin": origin,
            }
        );
    } else {
        console.log("Invalid call for handleRegister function.")
    }
}



