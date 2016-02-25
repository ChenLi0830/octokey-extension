(function () {
    // Avoid recursive frame insertion...
    var extensionOrigin = 'chrome-extension://' + chrome.runtime.id;
    if (!location.ancestorOrigins.contains(extensionOrigin)) {
        var iframe = document.createElement('iframe');
        // Must be declared at web_accessible_resources in manifest.json
        iframe.setAttribute("id", "password_overlay");
        //iframe.style.background = "url("+chrome.extension.getURL('resources/loader.gif')+") no-repeat center center;";
        //iframe.style.background = "url(resources/loader.gif') no-repeat center center;";

        iframe.src = chrome.runtime.getURL('overlay.html');

        document.body.appendChild(iframe);

/*        var script   = document.createElement("script");
        script.type  = "text/javascript";
        script.text  = "var cancelBtn = document.getElementById('password_overlay').contentWindow.document.getElementById('scriptCancel');cancelBtn.onclick = alert('cancel');";

        var cancelBtn = document.getElementById('password_overlay').contentWindow.document.getElementById('scriptCancel');
        cancelBtn.onclick = alert('cancel');

        iframe.appendChild(script);*/

/*        console.log("iframe", document.getElementById("password_overlay"));
        console.log("iframe.contentDocument", iframe.contentDocument);
        console.log("iframe.contentWindow.document", iframe.contentWindow.document);
        var innerDoc = (iframe.contentDocument) ? iframe.contentDocument : iframe.contentWindow.document;
        console.log("innerDoc", innerDoc);
        var cancelBtn = innerDoc.getElementById('scriptCancel');
        console.log("cancelBtn", cancelBtn);*/

    }

/*    $(document).ready(function () {

        $(cancelBtn).click(
            function () {
                AlertSave();
            }
        );
    });

    function AlertSave() {
        alert("Cancel button OnClick");
    }*/

})();


