(function () {
    /* Make Jquery throw error when its selector is null*/

    jQuery.debug = true;
    $ = function (selector, context) {
        if (jQuery.debug && typeof selector === "string" &&
            !jQuery(selector, context ? context : undefined).length) throw new Error("Element not found!");
        return jQuery.apply(this, arguments);
    };

/*    chrome.runtime.onMessage.addListener(
        function (request, sender, sendResponse) {
            if (request.event !== "new_login_waitForPwd") {
                alert("triggered");
                var canvas = document.createElement("canvas");
                canvas.setAttribute("id", "canvas");
                var body = document.querySelector("body");
                body.appendChild(canvas);
                return;
            }
        })*/
})();


