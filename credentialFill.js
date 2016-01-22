/**
 * Created by Chen on 2016-01-13.
 */

    //console.log("hello from credentialFill!");
    //chrome.runtime.sendMessage({"message":"script_loading_complete"});

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        //console.log("credentialFill received request");
        //console.log("request",request);
        if (request.event !== "new_login_opened") {
            console.log("not new_login_opened event");
            return;
        }
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

            //if (passwordForms.length===1 && passwordInputs.length===1){//如果只有一个密码field,focus, 提交form
            //    console.log("only one form, submit");
            //passwordInputs[0].focus();
            //passwordForms[0].submit();

            //var e = $.Event("keypress");
            //e.which = 13; // # Some key code value
            //e.keyCode = 13;
            ////$("input").trigger(e);
            //console.log("triggering keydown: ", e.which);
            //console.log("passwordInputs[0]",passwordInputs[0]);
            //var passwordField = $(passwordInputs[0]);
            //passwordField.focus();
            //passwordField.trigger(e);

            //} else {//多个密码field,点登录button
            var loginButtons = getLoginButtons(passwordForms);
            //console.log("loginAnchors",loginAnchors);
            if (loginButtons.length == 1) {
                console.log("find 1 login anchor, click", loginButtons[0]);
                if (filledUsername && filledPassword) {
                    loginButtons[0].click();
                } else {
                    console.log("filledUsername", filledUsername, "filledPassword", filledPassword);
                }
            } else {
                console.log("there are", loginButtons.length, "login anchor+button", loginButtons)
            }
            //}


        } else {//如果有验证码,focus在验证码上
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
            console.log(input['action-data']);
            return ((input.type == "text" || input.type == "email" ) &&
                (input.name.toLowerCase().indexOf("login") != -1 ||
                    input.name.toLowerCase().indexOf("user") != -1 ||
                    input.name.toLowerCase().indexOf("username") != -1 ||
                    input.id.toLowerCase().indexOf("login") != -1 ||
                    input.id.toLowerCase().indexOf("user") != -1 ||
                    input.id.toLowerCase().indexOf("username") != -1 ||
                    (input.placeholder && input.placeholder.indexOf("邮箱") != -1) ||
                    (input.placeholder && input.placeholder.indexOf("帐号") != -1) ||
                    (input.placeholder && input.placeholder.indexOf("用户名") != -1) ||
                    (input.innerHTML.indexOf("邮箱") != -1 || input.innerHTML.indexOf("帐号") != -1 ||
                    input.innerHTML.indexOf("用户名") != -1)
                )
            )
        }

        function isLoginElement(element) {
            console.log($(element).html());
            return element.innerHTML.replace(/\s/g, "") === "登录" ||
                    //element.innerHTML === "登录" ||
                    //element.innerHTML === "登 录" ||
                    //element.innerHTML === "登&nbsp;录" ||
                element.innerHTML.replace(/\s/g, "").indexOf(">登录<") != -1 ||
                    //element.innerHTML.indexOf(">登 录<") != -1 ||
                    //element.innerHTML.indexOf(">登&nbsp;录<") != -1 ||
                element.innerHTML.toLowerCase().indexOf("sign in") != -1 ||
                element.innerHTML.toLowerCase().indexOf("log in") != -1 ||
                (element.value && element.value.toLowerCase().indexOf("sign in") != -1) ||
                (element.value && element.value.toLowerCase().indexOf("log in") != -1) ||
                (element.value && element.value.toLowerCase().indexOf("登录") != -1) ||
                (element.value && element.value.toLowerCase().indexOf("登&nbsp;录") != -1) ||
                (element.value && element.value.toLowerCase().indexOf("登 录") != -1) ||
                (element.placeholder && element.placeholder.indexOf("登录") != -1) ||
                (element.placeholder && element.placeholder.indexOf("登&nbsp;录") != -1) ||
                (element.placeholder && element.placeholder.indexOf("登 录") != -1)
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
                    anchors = anchors.concat(Array.prototype.slice.call(form.getElementsByTagName("a")));
                    buttons = buttons.concat(Array.prototype.slice.call(form.getElementsByTagName("button")));
                    inputs = inputs.concat(Array.prototype.slice.call(form.getElementsByTagName("input")));
                }
            }
            else {// 处理0个form的情况:找登录anchor
                console.log("0 password form");
                console.log("searching for anchors and buttons from the entire page");
                anchors = document.getElementsByTagName("a");
                buttons = document.getElementsByTagName("button");
                inputs = document.getElementsByTagName("input");
            }

            console.log("anchors", anchors);
            console.log("buttons", buttons);
            console.log("inputs", inputs);
            var elements = Array.prototype.slice.call(inputs);
            if (buttons.length > 0) {
                console.log("elements.concat buttons");
                elements = elements.concat(Array.prototype.slice.call(buttons));
            }
            if (anchors.length > 0) {
                console.log("elements.concat anchors");
                elements = elements.concat(Array.prototype.slice.call(anchors));
            }

            console.log("elements", elements);

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
    });


//
//chrome.runtime.onMessage.addListener(fillInCredential);
//function fillInCredential(request, sender, sendResponse) {
//  console.log("in fillInCredential");
//  if (request.message !== "new_login_opened") {
//    console.log("not new_login_opened");
//    return;
//  }
//
//  console.log("is new_login_opened");
//  var inputs=document.getElementsByTagName("input");    //look for all inputs
//
//
//  for(var i=0;i<inputs.length;i++){{    //for each input on document
//
//    var input=inputs[i];     //look at whatever input
//
//    if((input.type=="password"&&(input.name.toLowerCase().indexOf("auth")==-1)) || input.name.toLowerCase() ==
//   "loginform:password"){ {input.value=pwd} }
//   if((input.type=="text"&&(input.name.toLowerCase().indexOf("login")!=-1||input.name.toLowerCase().indexOf("user")!=-1||input.name=="AgentAccount"))
// || input.name.toLowerCase() == "loginform:username"){ {input.value=usr} } }}; }
