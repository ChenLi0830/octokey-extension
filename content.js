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

  const urlSplit = origin.split("//");
  //console.log("urlSplit",urlSplit);
  const DdpUri = "ws://"+urlSplit[1]+"/websocket";
  //console.log("DdpUri",DdpUri);
  var ddp = new MeteorDdp(DdpUri);

  ddp.connect().then(function () {
    //console.log("ddp.connect successful for", "appId ", appId, " username ", username);
    ddp.subscribe("appCredential", [userId, appId, username])
      .then(function () {
        //console.log("subscribeCollection successful",ddp.getCollection("userAppCredentials"));
        var credentialObj = ddp.getCollection("userAppCredentials");
        const objKey = Object.keys(credentialObj)[0];
        const password = credentialObj[objKey]["publicApps"][0]["password"];

        //Todo 加入extensionId
        chrome.runtime.sendMessage(/*extensionId,*/
          {
            "message": "open_new_login",
            "loginLink": loginLink,
            "username": username,
            "password": password
          }
        )
      })
      .fail(function (err) {
        console.log('there is some error', err);
      });
  });
}

chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    console.log("content.js received request");
    console.log(sender.tab ?
    "from a content script:" + sender.tab.url :
      "from the extension");
    if (request.event == "hello")
      sendResponse({farewell: "goodbye"});
  });


//chrome.runtime.onMessage.addListener(
//function (request, sender, sendResponse) {
//if (request.message === "clicked_browser_action") {
//  var firstHref = $("a[href^='http']").eq(0).attr("href");
//  console.log(firstHref);
//
//  chrome.runtime.sendMessage({"message": "open_new_tab", "url": firstHref});
//}
//});






























