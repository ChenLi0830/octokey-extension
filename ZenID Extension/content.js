//console.log("Hello from content script!");

window.addEventListener("message", receiveMessage, false);
function receiveMessage(event) {
    var origin = event.origin || event.originalEvent.origin; // For Chrome, the origin property is in the
                                                             // event.originalEvent object.
    //if (origin !== "http://example.org:8080")
    //  return;
    if (event.data[0] !== "goToLink") {
        return;
    }
    //console.log("event.data", event.data);
    //console.log("event.origin", event.origin);

    const userId = event.data[1];
    const appId = event.data[2];
    const loginLink = event.data[3];
    const username = event.data[4];
    const password = event.data[5];

    //Todo 加入extensionId
    chrome.runtime.sendMessage(/*extensionId,*/
        {
            "message": "open_new_login",
            "userId": userId,
            "appId": appId,
            "loginLink": loginLink,
            "username": username,
            "password":password,
            "origin": origin,
        }
    );
}




























