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
                  $(".login-register-switch-link")[0].click();
                  setTimeout(function () {
                    try {
                      $("input[name='fname']").val(request.profile.firstName);
                      $("input[name='lname']").val(request.profile.lastName);
                      $("input[name='email'][type='email']").val(request.profile.email);
                      $("input[name='password'][type='password']").val(request.password);
                      $("input[type='checkbox'][name='tos_agree']")[0].checked = true;
                      $("button[class='login-button button-primary'][type='submit']")[2].click();

                      sendResponse({
                        step: 1, progress: 50, message: "ext_msg_credential",
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
              $("#react-signup-recaptcha-challenge-div").height() === 0 ?
                  sendResponse({step: 2, progress: 70, message: "ext_msg_register"})
                  : sendResponse({step: 2, progress: 70, message: "ext_msg_register"})
              break;
            case 2:
              sendResponse({step: 3, progress: 90, message: "ext_msg_redirect"});
              break;
            case 3:
              sendResponse({step: 4, progress: 100, message: "ext_msg_success"});
              break;
            case 4:
              sendResponse({step: -1, progress: 100, message: "ext_msg_success"});
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
            message: "ext_msg_error"
          });
        }

        return true;
      });
})();