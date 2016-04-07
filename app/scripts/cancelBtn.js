(function () {
    var cancelBtn = document.getElementById('scriptCancel');
    cancelBtn.onclick = function () {
        chrome.runtime.sendMessage({message:"stop_login"});
    };
})();