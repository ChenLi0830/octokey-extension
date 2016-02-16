(function () {
    chrome.runtime.onMessage.addListener(
        function (request, sender, sendResponse) {
            if (request.event !== "new_register_opened") {
                return;
            }

            console.log("step:", request.step);
            //Dropbox
            try {
                switch (request.step) {
                    case 0:
                        setTimeout(function () {
                            try {
                                document.getElementsByClassName("login-register-switch-link")[0].click();
                                setTimeout(function () {
                                    try {
                                        document.querySelectorAll("input[name='fname']")[0].value =
                                            request.profile.firstName;
                                        document.querySelectorAll("input[name='lname']")[0].value =
                                            request.profile.lastName;
                                        document.querySelectorAll("input[name='email'][type='email']")[0].value =
                                            request.profile.email;
                                        document.querySelectorAll("input[name='password'][type='password']")[0].value =
                                            request.password;
                                        document.querySelectorAll(
                                            "input[type='checkbox'][name='tos_agree']")[0].checked =
                                            true;
                                        document.querySelectorAll(
                                            "button[class='login-button button-primary'][type='submit']")[2].click();
                                        sendResponse({
                                            step: 1, progress: 50, message: "填写登录信息",
                                            username: request.profile.email,
                                            password: request.password,
                                        });
                                    } catch (e) {
                                        handleError(e);
                                    }
                                }, 500);
                            } catch (e) {
                                handleError(e);
                            }
                        }, 500);
                        break;
                    case 1:
                        sendResponse({step: 2, progress: 70, message: "发送注册信息"});
                        break;
                    case 2:
                        sendResponse({step: 3, progress: 90, message: "发送注册信息"});
                        break;
                    case 3:
                        sendResponse({step: 4, progress: 100, message: "注册成功!"});
                        break;
                    case 4:
                        sendResponse({step: -1, progress: 100, message: "注册成功!"});
                        break;
                }
            } catch (e) {
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

            return true;
        });
})();