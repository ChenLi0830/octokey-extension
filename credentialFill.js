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
    //const username = "test";
    //const password = "1234567";
    //alert("start to fill in");

    var inputs = document.getElementsByTagName("input");    //look for all inputs
    var passwordForms = [];

    for (var i = 0; i < inputs.length; i++) {
      {    //for each input on document
        var input = inputs[i];     //look at whatever input
        if ((input.type == "password" && (input.name.toLowerCase().indexOf("auth") == -1)) ||
          input.name.toLowerCase() ==
          "loginform:password") {
          {
            input.value = password;
            //console.log("find one", input);
            var parentForm = closest(input, "form");
            console.log(parentForm);
            if (parentForm) passwordForms.push(parentForm);
          }
        }
        if (((input.type == "text" || input.type == "email" ) &&
          (input.name.toLowerCase().indexOf("login") != -1 || input.name.toLowerCase().indexOf("user") != -1 ||
          input.name == "AgentAccount"))
          || input.name.toLowerCase() == "loginform:username") {
          {
            input.value = username
          }
        }
      }
    }
    //alert("passwordForms length is "+passwordForms.length);
    if (passwordForms.length==1){//如果只找到一个合适的form
      passwordForms[0].submit();
    }

    else {//多个form的情况:分辨那个是真的
      // 处理0个form的情况:找登录button

    }


    function closest(el, selector) {//similar to jquery's closest method
      var matchesSelector = el.matches || el.webkitMatchesSelector || el.mozMatchesSelector || el.msMatchesSelector;

      while (el) {
        if (matchesSelector.call(el, selector)) {
          break;
        }
        el = el.parentElement;
      }
      return el;
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
