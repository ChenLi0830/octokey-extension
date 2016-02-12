/*
 if (!window.isTop) { // true  or  undefined
 //var data = 'test';
 //chrome.runtime.sendMessage({sendBack:true, data:data});
 alert("this is in iframe");
 } else {
 alert("this is not in iframe");
 }
 */

(function () {

    // just place a div at top right
    //alert("iframe start");

    const cellNumber = "7097490481";
    const password = "7097490481";
    const nickName = "ChenLizhangyu";
    const ramdomNumber = Math.floor(Math.random() * 1000);
    const email = "lulugeo.li+account" + ramdomNumber + "@gmail.com";
    const firstName = "Chen";
    const lastName = "Li";

    //Github
    //$("#user_login")[0].value = nickName;
    //$("#user_email")[0].value = email;
    //$("#user_password")[0].value = password;
    //$("#signup_button")[0].click();

    //Dropbox

    setTimeout(function () {
        document.getElementsByClassName("login-register-switch-link")[0].click();
        setTimeout(function(){
            document.querySelectorAll("input[name='fname']")[0].value = firstName;
            document.querySelectorAll("input[name='lname']")[0].value = lastName;
            document.querySelectorAll("input[name='email'][type='email']")[0].value = email;
            document.querySelectorAll("input[name='password'][type='password']")[0].value = password;
            document.querySelectorAll("input[type='checkbox'][name='tos_agree']")[0].checked = true;
            document.querySelectorAll("button[class='login-button button-primary'][type='submit']")[2].click();
        },500)
    }, 200);

    //淘宝
    /*  const agreeButton = $("#J_AgreementBtn");
     agreeButton.click();
     setTimeout(function () {
     console.log("#J_Mobile", $("#J_Mobile"));
     console.log("cellNumber",cellNumber);
     //document.getElementById("J_Mobile").value = cellNumber;
     $("#J_Mobile").val(cellNumber);
     $('#_n1z')
     .simulate("drag-n-drop", {dx: 300, interpolation: {stepWidth: 10, stepDelay: 50}});
     setTimeout(function () {
     console.log("click button", document.getElementById("J_BtnMobileForm"));
     document.getElementById("J_BtnMobileForm").click();

     setTimeout(function () {
     document.getElementById("J_MobileCode").value = "700315";
     document.getElementById("J_BtnMobileCodeForm").click();

     setTimeout(function () {
     console.log("document", document);
     document.getElementById("J_Password").value = password;
     document.getElementById("J_RePassword").value = password;
     document.getElementById("J_Nick").value = username;
     document.getElementById("J_BtnInfoForm").click();
     }, 5000);

     }, 2000);

     }, 3000);
     }, 500);*/

})();