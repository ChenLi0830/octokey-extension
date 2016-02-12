//console.log("Hello from content script!");
var isInstalledNode = document.createElement('div');
isInstalledNode.id = 'extension-is-installed-nehponjfbiigcobaphdahhhiemfpaeob';
var isTop = true;

//<iframe src="http://www.w3schools.com">   <p>Your browser does not support iframes.</p> </iframe>

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
    else if (event.data[0] === "register") {
        this.handleRegister(event, origin);
    }
}


function handleLogin(event, origin) {
    if (event.data[0] == "logIn") {
        //console.log("event.data", event.data);
        //console.log("event.origin", event.origin);

        const userId = event.data[1];
        const appId = event.data[2];
        const loginLink = event.data[3];
        const username = event.data[4];
        const password = event.data[5];
        const hexIv = event.data[6];
        const hexKey = event.data[7];

        //Todo send this only to our extension: extensionId
        chrome.runtime.sendMessage(/*extensionId,*/
            {
                "message": "new_tab_login",
                "userId": userId,
                "appId": appId,
                "loginLink": loginLink,
                "username": username,
                "password": password,
                "hexIv": hexIv,
                "hexKey": hexKey,
                "origin": origin,
            }
        );
    } else {
        console.log("Invalid call for handleLogin function.")
    }
}


function handleRegister(event, origin) {
    if (event.data[0] == "register") {

        /* Initialization */
        const userId = event.data[1];
        const appId = event.data[2];
        //const registerLink = event.data[3];
        const regType = event.data[4];
        const account = event.data[5];
        //const registerLink = "https://reg.taobao.com/member/reg/fill_mobile.htm";
        //const registerLink = "//user.quna.com/Reg.aspx";
        const registerLink = "https://www.dropbox.com/login";
        //const registerLink = "https://github.com/join";

        ///* generate an iFrame */
        /*var iframe = document.createElement('iframe');
         iframe.src = registerLink;
         iframe.width = "800";
         iframe.height = "800";
         iframe.style.marginLeft = "200";
         iframe.style.marginTop = "200";
         iframe.sandbox = "allow-same-origin allow-scripts allow-popups allow-forms allow-pointer-lock";//查这个的作用*/

        //iframe.id = "iframe";
        //iframe.style.display = 'none';
        //document.body.appendChild(iframe);

        /* call background script */

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
            },
            function (response) {

            });


    } else {
        console.log("Invalid call for handleRegister function.")
    }
}



