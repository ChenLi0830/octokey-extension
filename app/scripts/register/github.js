(function () {
  chrome.runtime.onMessage.addListener(
      function (request, sender, sendResponse) {
        if (request.event !== "new_register_opened") {
          return;
        }

        const ramdomNumber = Math.floor(Math.random() * 10000);
        const cellNumber = "7097490481";
        const password = "Geoffery0830";
        const nickName = "ChenLizhangyu" + ramdomNumber;
        const email = "lulugeo.li+account" + ramdomNumber + "@gmail.com";
        const firstName = "Chen";
        const lastName = "Li";

        console.log("step:", request.step);

        //Github
        try {
          switch (request.step) {
            case 0:
              $("#user_login")[0].value = nickName;
              $("#user_email")[0].value = email;
              $("#user_password")[0].value = password;
              $("#signup_button")[0].click();
              sendResponse({step: 1, progress: 50, message: "填写登录信息"});
              break;
            case 1:
              //console.log("start click", $(".btn.btn-primary.js-choose-plan-submit"));
              $(".btn.btn-primary.js-choose-plan-submit").click();
              sendResponse({step: -1, progress: 100, message: "注册成功!"});
              break;
          }
        }
        catch (error) {
          sendResponse({
            step: -2,
            progress: -100,
            message: "自动注册出错, 可能由原因导致: 1. 您的帐号已经注册过该网站 2. 注册前您已经登录该网站 3. 网站注册数据出错"
          });
        }
      });
})();