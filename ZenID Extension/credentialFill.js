/**
 * Created by Chen on 2016-01-13.
 */

(function () {
    chrome.runtime.onMessage.addListener(
        function (request, sender, sendResponse) {
            //console.log("credentialFill received request");
            //console.log("request",request);
            if (request.event !== "new_login_opened") {
                //console.log("not new_login_opened event");
                return;
            }
            //alert("login start");
            const username = request.username;
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

                //Todo make this a method and make it apply general cases
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
            }


            function closest(el, selector) {//similar to jquery's closest method
                var matchesSelector = el.matches || el.webkitMatchesSelector || el.mozMatchesSelector ||
                    el.msMatchesSelector;

                while (el) {
                    if (matchesSelector.call(el, selector)) {
                        break;
                    }
                    el = el.parentElement;
                }
                return el;
            }

            function isVisible(el) {//Check if the element is visible
                return (el.offsetParent !== null)
            }

            function isPassword(input) {
                //if ((input.type == "password" && (input.name.toLowerCase().indexOf("auth") == -1)) ||
                //  input.name.toLowerCase() =="loginform:password")
                //console.log("check for password");
                return (input.type == "password" && (input.name.toLowerCase().indexOf("auth") == -1));
            }

            function isUsername(input) {
                return ((input.type == "text" || input.type == "email" ) &&
                    (input.name.toLowerCase().indexOf("login") != -1 ||
                        input.name.toLowerCase().indexOf("user") != -1 ||
                        input.name.toLowerCase().indexOf("username") != -1 ||
                        input.name.toLowerCase().indexOf("email") != -1 ||
                        input.name.toLowerCase().indexOf("passport") != -1 ||
                        input.id.toLowerCase().indexOf("login") != -1 ||
                        input.id.toLowerCase().indexOf("user") != -1 ||
                        input.id.toLowerCase().indexOf("username") != -1 ||
                        input.id.toLowerCase().indexOf("email") != -1 ||
                        input.id.toLowerCase().indexOf("passport") != -1 ||
                        (input.placeholder && input.placeholder.indexOf("邮箱") != -1) ||
                        (input.placeholder && input.placeholder.indexOf("帐号") != -1) ||
                        (input.placeholder && input.placeholder.indexOf("用户名") != -1) ||
                        (input.innerHTML.indexOf("邮箱") != -1 || input.innerHTML.indexOf("帐号") != -1 ||
                        input.innerHTML.indexOf("用户名") != -1)
                    )
                )
            }

            function isLoginElement(element) {
                //if (element.type && element.type === "submit")
                //    return true;
                return element.innerHTML.replace(/\s|&nbsp;/g, "") === "登录" ||
                    element.innerHTML.replace(/\s|&nbsp;/g, "").indexOf(">登录<") != -1 ||
                    element.innerHTML.toLowerCase().indexOf("sign in") != -1 ||
                    element.innerHTML.toLowerCase().indexOf("log in") != -1 ||
                    (element.value && element.value.toLowerCase().indexOf("sign in") != -1) ||
                    (element.value && element.value.toLowerCase().indexOf("log in") != -1) ||
                    (element.value && element.value.toLowerCase().replace(/\s/g, "") === ("登录")) ||
                    (element.placeholder && element.placeholder.replace(/\s|&nbsp;/g, "") === ("登录"))
            }

            function isCaptcha(input) {
                return (input.type == "text" && input.placeholder.indexOf("验证码") != -1);
            }

            function getLoginButtons(passwordForms) {
                var buttons = [];
                var anchors = [];
                var inputs = [];
                if (passwordForms.length > 0) {//有form的情况:只在forms里找anchor
                    console.log("password form number: ", passwordForms.length);
                    for (i = 0; i < passwordForms.length; i++) {
                        var form = passwordForms[i];
                        anchors = anchors.concat(
                            Array.prototype.slice.call(form.querySelectorAll("a[href^='javascript'], a[href^='#']")));
                        buttons = buttons.concat(Array.prototype.slice.call(form.querySelectorAll("button")));
                        inputs = inputs.concat(Array.prototype.slice.call(form.querySelectorAll("input")));
                    }
                }
                else {// 处理0个form的情况:找登录anchor
                    console.log("0 password form");
                    console.log("searching for anchors and buttons from the entire page");
                    anchors = document.querySelectorAll("a[href^='javascript'], a[href^='#'], a:not([href])");
                    buttons = document.querySelectorAll("button");
                    inputs = document.querySelectorAll("input");
                }

                console.log("anchors", anchors);
                console.log("buttons", buttons);
                console.log("inputs", inputs);
                var elements = Array.prototype.slice.call(inputs);
                if (buttons.length > 0) {
                    //console.log("elements.concat buttons");
                    elements = elements.concat(Array.prototype.slice.call(buttons));
                }
                if (anchors.length > 0) {
                    //console.log("elements.concat anchors");
                    elements = elements.concat(Array.prototype.slice.call(anchors));
                }

                console.log("all candidate elements", elements);

                var loginElements = [];
                for (i = 0; i < elements.length; i++) {
                    var element = elements[i];
                    if (isVisible(element)) {
                        if (isLoginElement(element)) {
                            loginElements.push(element);
                        }
                    }
                }
                return loginElements;
            }

            function bruteForceFillUsername() {
                inputs = document.querySelectorAll("input[type='text'], input[type='email']");
                for (i = 0; i < inputs.length; i++) {
                    var input = inputs[i];
                    if (isVisible(input)) {
                        input.focus();
                        input.value = username;
                        input.blur();
                        filledUsername = true;
                    }
                }
            }
        });

})();