console.log("Hello from content script!");

window.addEventListener("message", receiveMessage, false);

function receiveMessage(event)
{
  var origin = event.origin || event.originalEvent.origin; // For Chrome, the origin property is in the event.originalEvent object.
  // if (origin !== "http://example.org:8080")
  //   return;

	console.log("event.data",event.data);
	console.log("event.origin",event.origin);
  // ...
}

chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse){
	if (request.message === "clicked_browser_action"){
		var firstHref = $("a[href^='http']").eq(0).attr("href");
		console.log(firstHref);

		chrome.runtime.sendMessage({"message":"open_new_tab", "url":firstHref});
	}
});






























