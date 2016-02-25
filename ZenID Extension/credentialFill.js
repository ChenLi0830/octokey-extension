/**
 * Created by Chen on 2016-01-13.
 */

(function () {
    chrome.runtime.onMessage.addListener(
        function (message, sender, sendResponse) {

            switch (message.event) {
                case "new_login_opened":
                    var maxLoginCounter = 10;
                    var smartFillInterval = setInterval(
                        smartFillIn.bind(window, message.username, message.password, false, false), 1000);
                    break;

                case "stop_login":
                    console.log("credentialFill cancel");
                    chrome.runtime.sendMessage(
                        {message: "close_login_overflow", status: "stopped_by_background"});
                    clearInterval(smartFillInterval);//Stop smart filling interval
            }

            function smartFillIn(username, password) {
                //console.log("start login trail");
                maxLoginCounter--;
                if (maxLoginCounter === 0) {
                    chrome.runtime.sendMessage(
                        {message: "close_login_overflow", status: "reachMaximum"});
                    clearInterval(smartFillInterval);//Stop smart filling interval
                    return "Reached maximum login trail";
                }

                var inputs = document.getElementsByTagName("input");    //look for all inputs

                /* Fill in necessary information */
                var filledUsername = findAndFill(inputs, {name: "username", value: username});
                var passResult = findAndFill(inputs, {name: "password", value: password});
                var filledPassword = passResult.isFound;
                var passwordForms = passResult.passwordForms;

                var loginButtons = getLoginButtons(passwordForms);

                //validate if login can be processed
                if (!filledUsername || !filledPassword) {
                    console.log("filledUsername", filledUsername, "filledPassword", filledPassword);
                    return "can't find username or password";
                }

                if (loginButtons.length != 1) {
                    console.log("there are", loginButtons.length, "login anchor+button", loginButtons);
                    if (loginButtons.length > 1) {
                        chrome.runtime.sendMessage(
                            {message: "close_login_overflow", status: "needManualClick"});
                        clearInterval(smartFillInterval);//Stop smart filling interval
                        return "Too many loginButtons";
                    } else {
                        return "Can't find loginButton";
                    }
                }

                /* 开始login */
                setTimeout(function () {
                    /* 检查captcha */
                    var potentialCapts = $('*[id*=captcha]:visible');
                    var captchasFound = findAndFill(potentialCapts, {name: "captcha"});

                    if (captchasFound.length > 0) {
                        captchasFound.length === 1 && captchasFound[0].type === "text" && captchasFound[0].focus();
                        chrome.runtime.sendMessage(
                            {message: "close_login_overflow", status: "captchaExist"});
                        clearInterval(smartFillInterval);//Stop smart filling interval
                        return "有验证码, 暂停登录";
                    }

                    /* login */
                    console.log("find 1 login anchor, click", loginButtons[0]);
                    chrome.runtime.sendMessage(
                        {message: "close_login_overflow", status: "successful"});
                    clearInterval(smartFillInterval);//Stop trying when finds all the elements

                    //loginButtons[0].click();//Todo 判断是否真的登录了,没有的话重复以上步骤但不click
                    return "login clicked";
                }, 1000);
            }

            function findAndFill(elementArray, targetEl) {
                var elIsFound = false,
                    elementsFound = [],
                    fill = (targetEl.value != null),//fill-in flag for whether filling targetEl with value
                    passwordForms = [];

                for (var i = 0; i < elementArray.length; i++) {
                    var element = elementArray[i];//look at whatever input

                    if (isVisible(element)) {//Make sure the login is visible

                        if (targetEl.name === "captcha" && isCaptcha(element)) {
                            elementsFound.push(element);
                            elIsFound = true;
                        }

                        if (targetEl.name === "username" && isUsername(element)) {
                            elementsFound.push(element);
                            elIsFound = true;

                            if (fill) {
                                element.focus();
                                element.value = targetEl.value;
                                element.blur();
                            }
                        }

                        if (targetEl.name === "password" && isPassword(element)) {
                            elementsFound.push(element);
                            elIsFound = true;

                            if (fill) {
                                element.focus();
                                element.value = targetEl.value;
                                element.blur();
                            }

                            var passwordForm = element.form || $(element).closest("form")[0];//找到这个password对应的form
                            console.log("element", element);
                            console.log("passwordForm", passwordForm);
                            if (passwordForm) passwordForms.push(passwordForm);
                        }
                    }
                }

                if (targetEl.name === "username" && targetEl.value && !elIsFound) {//If username needs to be filled,
                    // try brute force
                    elIsFound = bruteForceFillUsername(targetEl.value);
                }

                if (elIsFound) {//Log founded elements
                    targetEl.name === "captcha" && console.log("found captcha");
                    targetEl.name === "username" && console.log("found username");
                    targetEl.name === "password" && console.log("found password");
                    console.log("founded " + targetEl.name + " : ", elementsFound);
                }

                if (targetEl.name === "username") return elIsFound;
                if (targetEl.name === "password") return {isFound: elIsFound, passwordForms: passwordForms};
                if (targetEl.name === "captcha") return elementsFound;

            }

            function isVisible(el) {//Check if the element is visible
                return (el.offsetParent !== null && $(el).height() > 0 && $(el).width() > 0)
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

            function isCaptcha(element) {
                return true;
                //return (element.type == "text" && element.placeholder.indexOf("验证码") != -1);
            }

            function getLoginButtons(passwordForms) {
                var buttons = [];
                var anchors = [];
                var inputs = [];
                if (passwordForms.length > 0) {//有form的情况:只在forms里找anchor
                    for (i = 0; i < passwordForms.length; i++) {
                        var form = passwordForms[i].form || passwordForms[i];
                        console.log("passwordform", form);
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

            function bruteForceFillUsername(username) {
                var inputs = document.querySelectorAll("input[type='text'], input[type='email']");
                var filledUsername = false;
                for (i = 0; i < inputs.length; i++) {
                    var input = inputs[i];
                    if (isVisible(input)) {
                        input.focus();
                        input.value = username;
                        input.blur();
                        filledUsername = true;
                    }
                }
                return filledUsername;
            }
        });

})();