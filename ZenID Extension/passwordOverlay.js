(function () {
    // Avoid recursive frame insertion...
    var extensionOrigin = 'chrome-extension://' + chrome.runtime.id;
    if (!location.ancestorOrigins.contains(extensionOrigin)) {
        var iframe = document.createElement('iframe');
        // Must be declared at web_accessible_resources in manifest.json
        iframe.setAttribute("id","password_overlay");
        //iframe.style.background = "url("+chrome.extension.getURL('resources/loader.gif')+") no-repeat center center;";
        //iframe.style.background = "url(resources/loader.gif') no-repeat center center;";

        iframe.src = chrome.runtime.getURL('overlay.html');

        // Some styles for a fancy sidebar
        document.body.appendChild(iframe);

        //document.body.removeChild(iframe);
        //
        ////iframe.src = chrome.runtime.getURL('overlay.html');
        //iframe.src = chrome.runtime.getURL('overlay_complete.html');
        //document.body.appendChild(iframe);
    }

    //var body = document.querySelector("body");
    //body.onload = function() {
    //    var overlay = document.createElement('div');
    //    overlay.setAttribute("id", "password_overlay");
    //    overlay.style.opacity = .8;
    //    if(overlay.style.display == "block"){
    //        overlay.style.display = "none";
    //    } else {
    //        overlay.style.display = "block";
    //    }
    //    body.appendChild(overlay);
    //};
    //
    //var loader = document.createElement('img');
    //loader.setAttribute("class","loader");
    //loader.src = chrome.extension.getURL('resources/loader.gif');
    ////
    ////var body = document.querySelector("body");
    //body.appendChild(loader);
})();


