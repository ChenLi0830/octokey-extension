/*
/!**
 * Created by Chen on 2016-01-13.
 *!/

    //console.log("hello from credentialFill!");
    //chrome.runtime.sendMessage({"message":"script_loading_complete"});

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.event !== "new_register_opened") {
            console.log("not new_register_opened event");
            return;
        }

        const username = request.username;
        const password = request.password;

        const agreeButton = document.getElementById("J_AgreementBtn");
        agreeButton.click();

        //Todo make this a method and make it apply general cases
        setTimeout(function () {
            document.getElementById("J_Mobile").value = username;
            $('#_n1z')
                .simulate("drag-n-drop", {dx: 300, interpolation: {stepWidth: 10, stepDelay: 50}});
        }, 500);

        setTimeout(function () {
            document.getElementById("J_BtnMobileForm").click();
        }, 2000);

        /!*const username = request.username;
        const password = request.password;
        var filledUsername = false;
        var filledPassword = false;
        //console.log("trying to login using username", username, "password", password);
        //const username = "test";
        //const password = "1234567";

        var inputs = document.getElementsByTagName("input");    //look for all inputs
        //console.log("inputs",inputs);
        var passwordForms = [];
        var passwordInputs = [];
        var Captcha = null;

        for (var i = 0; i < inputs.length; i++) {
            //for each input on document
            var input = inputs[i];     //look at whatever input
            if (isVisible(input)) {//Make sure the login is visible
                console.log("input", i, input);
                if (isCaptcha(input)) {
                    console.log("found captcha");
                    Captcha = input;
                }
                else if (isUsername(input)) {
                    console.log("found username");
                    input.focus();
                    input.value = username;
                    input.blur();
                    filledUsername = true;
                }
                else if (isPassword(input)) {
                    console.log("found password");
                    //input.focus();
                    input.value = password;
                    filledPassword = true;
                    passwordInputs.push(input);
                    var parentForm = closest(input, "form");
                    console.log(parentForm);
                    if (parentForm) passwordForms.push(parentForm);
                }
                else console.log("input doesn't belong to anything:", input);
            }
        }

        //alert("passwordForms length is "+passwordForms.length);
        if (!Captcha) {//如果没有验证码 -> 登录
            console.log("doesn't have Captcha");
            console.log("passwordForms", passwordForms);
            console.log("passwordInputs.length", passwordInputs.length);

            if (!filledUsername) {//精确查找找不到username,就用brute force
                bruteForceFillUsername();
            }

            var loginButtons = getLoginButtons(passwordForms);

            setTimeout(function () {
                $('#_n1z')
                    .simulate("drag-n-drop", {dx: 300, interpolation: {stepWidth: 10, stepDelay: 50}});
            }, 1000);

            if (loginButtons.length === 1) {
                console.log("find 1 login anchor, click", loginButtons[0]);
                if (filledUsername && filledPassword) {
                    setTimeout(function () {
                        loginButtons[0].click()
                    }, 300);
                    //填好后等0.3秒再点,这个会解决部分网页的no response
                } else {
                    console.log("filledUsername", filledUsername, "filledPassword", filledPassword);
                }
            } else {
                console.log("there are", loginButtons.length, "login anchor+button", loginButtons)
            }

        } else {//如果有验证码,focus在验证码上
            Captcha.focus();
            console.log("有验证码,暂停登录");
        }*!/


    });
*/
