(function () {
  var iframe = document.getElementById('password_overlay');

  iframe.src = chrome.runtime.getURL('overlay_complete.html');

  setTimeout(function () {
    iframe.style.zIndex = -2147483647;
    iframe.style.display = "none"
  }, 500);

  /*//document.removeChild(iframe);
   var transitionTime = 1;
   var transitionStyle = "opacity " + transitionTime + "s, background-color " + transitionTime + "s, -webkit-transform " +
   transitionTime + "s";

   iframe.style.transition = transitionStyle;
   iframe.style.webkitTransition = transitionStyle;

   iframe.style.opacity = 0;

   setTimeout(function(){iframe.style.zIndex=-2147483647},transitionTime*1000);*/

})();


