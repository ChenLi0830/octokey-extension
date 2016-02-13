(function() {
    getPassword = function (username, userId, appId, origin, tabId, hexIv, hexKey) {
        const urlSplit = origin.split("//");
        //console.log("urlSplit",urlSplit);
        const DdpUri = "ws://" + urlSplit[1] + "/websocket";
        //console.log("DdpUri",DdpUri);
        var ddp = new MeteorDdp(DdpUri);

        ddp.connect().then(function () {
            //console.log("ddp.connect successful for", "appId ", appId, " username ", username);
            ddp.subscribe("appCredential", [userId, appId, username])
                .then(function () {
                    //console.log("subscribeCollection successful",ddp.getCollection("userAppCredentials"));
                    var credentialObj = ddp.getCollection("userAppCredentials");
                    //console.log("credentialObj",credentialObj);
                    const objKey = Object.keys(credentialObj)[0];
                    const encryptedPwd = credentialObj[objKey]["publicApps"][0]["password"];

                    tabsOpened[tabId].password = decryptAES(encryptedPwd, hexIv, hexKey);
                    tabsOpened[tabId].doneGettingPwd = true;
                    //console.log("doneGettingPwd - tabsOpened[tabId]", tabsOpened[tabId]);
                    loginIfReady(tabId);

                })
                .fail(function (err) {
                    console.log('there is some error', err);
                });
        });
    }

    window.decryptAES = function (encryptedPwd, hexIv, hexKey) {
        var plaintextArray = CryptoJS.AES.decrypt(
            {ciphertext: CryptoJS.enc.Hex.parse(encryptedPwd)},
            CryptoJS.enc.Hex.parse(hexKey),
            {iv: CryptoJS.enc.Hex.parse(hexIv)}
        );

        plaintextArray = CryptoJS.enc.Hex.stringify(plaintextArray);

        function hex2a(hex) {
            var str = '';
            for (var i = 0; i < hex.length; i += 2)
                str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
            return str;
        }

        //console.log("decrypted text:", hex2a(plaintextArray.toString());
        return hex2a(plaintextArray.toString());
    }

    loginIfReady = function(tabId) {
        if (tabsOpened[tabId].doneGettingPwd && tabsOpened[tabId].doneLoadingPage) {
            const username = tabsOpened[tabId].username;
            const password = tabsOpened[tabId].password;
            console.log("login start for ", tabsOpened[tabId].url);
            delete tabsOpened[tabId];

            setTimeout(function () {
                chrome.tabs.sendMessage(tabId,
                    {event: "new_login_opened", username: username, password: password},
                    function (response) {
                        console.log(response);
                    });
            }, 100);
        }
    }
})();