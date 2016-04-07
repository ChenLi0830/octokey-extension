(function () {
    chrome.runtime.onMessage.addListener(
        function (request, sender, sendResponse) {
            if (request.event !== "new_register_opened") {
                return;
            }

            const ramdomNumber = Math.floor(Math.random() * 10000);
            const cellNumber = "7097490481";
            //const cellNumber = "2024997664";
            const password = "Geoffery0830";
            const nickName = "ChenLizhangyu" + ramdomNumber;
            const email = "lulugeo.liaccount" + ramdomNumber + "@gmail.com";
            const firstName = "Chen";
            const lastName = "Li";

            console.log("step:", request.step);

            //Taobao
            try {
                switch (request.step) {
                    case 0:
                        $("#J_AgreementBtn").click();
                        setTimeout(function () {
                            try {
                                //$("#J_Mobile").val(cellNumber);
                                $("#J_Email").val(email);
                                $('#_n1z').simulate("drag-n-drop",
                                    {dx: 300, interpolation: {stepWidth: 20, stepDelay: 50}});
                                var interval = setInterval(function () {
                                    try {
                                        if ($("#J_BtnEmailForm").attr('class').indexOf("btn-disabled") === -1) {
                                            $("#J_BtnEmailForm").click();
                                        //if ($("#J_BtnMobileForm").attr('class').indexOf("btn-disabled") === -1) {
                                        //    $("#J_BtnMobileForm").click();
                                            clearInterval(interval);
                                            sendResponse({step: 1, progress: 50, message: "填写登录信息", require:"mobileCaptcha"});
                                        }
                                    } catch (e) {
                                        clearInterval(interval);
                                        handleError(e);
                                    }
                                }, 1000);
                            } catch (e) {
                                handleError(e);
                            }
                        }, 500);
                        break;
                    case 1:
                        request.captcha = 123;
                        if (request.captcha) {//Received captcha
                            $("#J_MobileCode").val(request.captcha);
                            //$("#J_BtnMobileCodeForm").click();
                            sendResponse({step: 2, progress: 70, message: "填写验证码"});
                        }
                        break;
                    case 2:
                        sendResponse({step: -1, progress: 100, message: "注册成功!"});
                        //if (request.MobileCaptcha && request.MobileCaptcha.length>0){
                        //    $("#J_MobileCode").val(MobileCaptcha);
                        //    $("#J_BtnMobileCodeForm").click();
                        //    sendResponse({step: 2, progress: 70, message: "填写验证码"});
                        //}
                        break;
                }
            }
            catch
                (e) {
                handleError(e);
            }

            function handleError(e) {
                console.log("error", e);
                sendResponse({
                    step: -2,
                    progress: -100,
                    message: "自动注册出错, 可能由原因导致: 1. 您的帐号已经注册过该网站 2. 注册前您已经登录该网站 3. 网站注册数据出错"
                });
            }

            return true;//So that I can use sendResponse asynchronously
        }
    );
})();