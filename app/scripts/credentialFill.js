/**
 * Created by Chen on 2016-01-13.
 */

(function () {
  //定义caseInsensitive 的 contains 函数
  //$.expr[":"].icontains = $.expr.createPseudo(function(arg) {
  //  return function( elem ) {
  //    return $(elem).text().toUpperCase().indexOf(arg.toUpperCase()) >= 0;
  //  };
  //});

  chrome.runtime.onMessage.addListener(
      function (message, sender, sendResponse) {

        $.expr[":"].icontains = $.expr.createPseudo(function (arg) {
          return function (elem) {
            return $(elem).text().toUpperCase().indexOf(arg.toUpperCase()) >= 0;
          };
        });

        console.log("credentialFill start");
        //alert("credentialFill start");

        switch (message.event) {
          case "new_login_opened":

            /*//如果需要点击登录按钮,就先点登录按钮
             if (message.popUpLogin === true) {
             findPopUpButton(message.url);
             }*/

            var maxLoginCounter = 3;
            var smartFillInterval = setInterval(
                smartFillIn.bind(window, message.username, message.password, message.popUpLogin,
                    message.url),
                1000);
            break;

          case "stop_login":
            console.log("credentialFill cancel");
            chrome.runtime.sendMessage(
                {message: "close_login_overflow", status: "stopped_by_background"});
            clearInterval(smartFillInterval);//Stop smart filling interval
        }

        function smartFillIn(username, password, popUpLogin, loginUrl) {
          //console.log("start login trail");
          maxLoginCounter--;
          if (maxLoginCounter === 0) {
            chrome.runtime.sendMessage(
                {message: "close_login_overflow", status: "reachMaximum"});
            clearInterval(smartFillInterval);//Stop smart filling interval
            return "Reached maximum login trail";
          }

          //如果需要点击登录按钮,就先点登录按钮
          if (popUpLogin === true) {
            findPopUpButton(loginUrl);
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
            var potentialCapts = $(
                "*[id*='captcha']:visible,[id*='verifyCode']:visible,[name*='captcha']:visible,[name*='verifyCode']:visible,[placeholder*='验证码']:visible, [placeholder*='拼图']:visible, [placeholder*='滑块']:visible, [name*='securityCode']:visible, [id*='securityCode']:visible"
            );
            console.log("potentialCapts", potentialCapts);
            var captchasFound = findAndFill(potentialCapts, {name: "captcha"});

            if (captchasFound.length > 0) {
              captchasFound.length === 1 && captchasFound[0].type === "text" &&
              captchasFound[0].focus();
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

            loginButtons[0].click();//Todo 判断是否真的登录了,没有的话重复以上步骤但不click
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
            console.log("brute force search for username");
            elIsFound = bruteForceFillUsername(targetEl.value);
          }

          if (elIsFound) {//Log founded elements
            targetEl.name === "captcha" && console.log("found captcha");
            targetEl.name === "username" && console.log("found username");
            targetEl.name === "password" && console.log("found password");
            console.log("founded " + targetEl.name + " : ", elementsFound);
          }

          if (targetEl.name === "username") return elIsFound;
          if (targetEl.name === "password") return {
            isFound: elIsFound,
            passwordForms: passwordForms
          };
          if (targetEl.name === "captcha") return elementsFound;

        }

        function isVisible(el) {//Check if the element is visible
          return (el.offsetParent !== null && $(el).height() > 0 && $(el).width() > 0)
        }

        function isPassword(input) {
          //if (input.type == "password"){alert("input.type==password!")}
          //if ((input.type == "password" && (input.name.toLowerCase().indexOf("auth") == -1)) ||
          //  input.name.toLowerCase() =="loginform:password")
          //console.log("check for password");
          return (input.type == "password" && (input.name.toLowerCase().indexOf("auth") == -1));
        }

        function isUsername(input) {
          return (
              (input.type == "text" || input.type == "email") && (
                //包含下面中的一个
                  input.name.toLowerCase().indexOf("mail") != -1 ||
                  input.name.toLowerCase().indexOf("login") != -1 ||
                  input.name.toLowerCase().indexOf("user") != -1 ||
                  input.name.toLowerCase().indexOf("username") != -1 ||
                  input.name.toLowerCase().indexOf("email") != -1 ||
                  input.name.toLowerCase().indexOf("passport") != -1 ||
                  input.id.toLowerCase().indexOf("mail") != -1 ||
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
              ) && (//不是验证码和密码
                  input.name.toLowerCase().indexOf("verifycode") === -1 &&
                  input.name.toLowerCase().indexOf("verification") === -1 &&
                  input.name.toLowerCase().indexOf("pwd") === -1 &&
                  input.name.toLowerCase().indexOf("password") === -1 &&
                  input.name.toLowerCase().indexOf("validcode") === -1 &&
                  input.id.toLowerCase().indexOf("verifycode") === -1 &&
                  input.id.toLowerCase().indexOf("verification") === -1 &&
                  input.id.toLowerCase().indexOf("pwd") === -1 &&
                  input.id.toLowerCase().indexOf("password") === -1 &&
                  input.id.toLowerCase().indexOf("validcode") === -1
              )
          )
        }

        function isLoginElement(element) {
          //if (element.type && element.type === "submit")
          //    return true;
          const innerText = $(element).text().replace(/\s|&nbsp;/g, "").toLowerCase();

          //console.log("innerText", innerText, element);
          return innerText === "登录" || innerText === "立即登录" ||
              innerText.indexOf(">登录<") != -1 || innerText.indexOf(">立即登录<") != -1 ||
              innerText.indexOf("signin") != -1 || innerText.indexOf("login") != -1 ||

                /*element.innerHTML.replace(/\s|&nbsp;/g, "") === "登录" ||
                 element.innerHTML.replace(/\s|&nbsp;/g, "") === "立即登录" ||
                 element.innerHTML.replace(/\s|&nbsp;/g, "").indexOf(">登录<") != -1 ||
                 element.innerHTML.replace(/\s|&nbsp;/g, "").indexOf(">立即登录<") != -1 ||
                 element.innerHTML.toLowerCase().indexOf("sign in") != -1 ||
                 element.innerHTML.toLowerCase().indexOf("log in") != -1 ||*/
              (element.value && element.value.toLowerCase().indexOf("sign in") != -1) ||
              (element.value && element.value.toLowerCase().indexOf("log in") != -1) ||
              (element.value && element.value.toLowerCase().replace(/\s/g, "") === ("登录")) ||
              (element.value && element.value.toLowerCase().replace(/\s/g, "") === ("立即登录")) ||
              (element.placeholder && element.placeholder.replace(/\s|&nbsp;/g, "") === ("立即登录")) ||
              (element.placeholder && element.placeholder.replace(/\s|&nbsp;/g, "") === ("登录")) ||
              (element.className && element.className.toLowerCase() === "smb_btn") ||
              (element.title && element.title.replace(/\s|&nbsp;/g, "") === "登录")
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
                  Array.prototype.slice.call(
                      form.querySelectorAll(
                          "a[href^='javascript'], a[href^='#'], a[href^='null']")));
              buttons = buttons.concat(Array.prototype.slice.call(form.querySelectorAll("button")));
              inputs = inputs.concat(Array.prototype.slice.call(form.querySelectorAll("input")));
            }
          }
          else {// 处理0个form的情况:找登录anchor
            console.log("0 password form");
            console.log("searching for anchors and buttons from the entire page");
            anchors =
                document.querySelectorAll("a[href^='javascript'], a[href^='#'], a:not([href])," +
                    " a[href^='null']");
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

        //获得popUpBtns之后,找到对应的popUpBtn并点击
        function clickPopUpButton(popUpBtnsFound) {
          console.log("popUpBtnsFound[0]", popUpBtnsFound[0]);
          if (popUpBtnsFound.length === 0) {
            return false;
          }
          if (popUpBtnsFound.length === 1) {
            console.log("pop up button found.", popUpBtnsFound, " Clicking");
            //("pop up button found. Clicking");
            popUpBtnsFound[0].click();
            return true;
          }
          if (popUpBtnsFound.length > 1) {
            console.log("more than 1 pop up button found. ", popUpBtnsFound, "first is clicked");
            popUpBtnsFound[0].click();
            return true;
          }
        }

        function findPopUpButton(loginUrl) {
          var popUpBtnsFound = $(
              'a:contains("账户登录"):visible, a:contains("账号登录"):visible, a:contains("帐户登录"):visible, a:contains("帐号登录"):visible')
              .filter(function (index) {
                //baseURI可以筛选第三方登录方式, length可以进行进一步filter
                return $(this)[0].baseURI === loginUrl && $(this).text().trim().length < 8;
                //return $(this).text().length<=4
              });

          var result = clickPopUpButton(popUpBtnsFound);
          if (!result) {//如果用“账户登录”没有找到popUpButton,就用“登录”找
            /*var popUpBtnsFound2 = $('a:contains("登录"):visible, a:contains("登 录"):visible').filter(function (index) {
             //baseURI可以筛选第三方登录方式, length可以进行进一步filter
             return $(this)[0].baseURI === loginUrl && $(this).text().trim().length < 4;
             });*/
            var popUpBtnsFound2 = $('a:contains("登录"):visible, a:contains("登 录"):visible')
                .filter(function (index) {
                  //baseURI可以筛选第三方登录方式, length可以进行进一步filter
                  const loginFromOrigin = $(this)[0].baseURI.indexOf(loginUrl) > -1 ||
                      loginUrl($(this)[0].baseURI.indexOf) > -1;
                  return loginFromOrigin && $(this).text().trim().length < 4;
                });
            console.log("popUpBtnsFound2", popUpBtnsFound2);
            var result2 = clickPopUpButton(popUpBtnsFound2);
            if (!result2) {//查找特殊的登录btn（用图片写‘登录’的）
              var popUpBtnsFound3 = $('a.login').filter(function (index) {
                //baseURI可以筛选第三方登录方式, length可以进行进一步filter
                return $(this)[0].baseURI === loginUrl && $(this).text().trim().length < 4;
              });
              var result3 = clickPopUpButton(popUpBtnsFound3);
              if (!result3) {
                console.log("Can't find popUp login Btn");
              }
            }
          }
        }
      });

})();