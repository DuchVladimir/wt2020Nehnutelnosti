let auth2 = {};

function renderUserInfo(googleUser, htmlElmId) {
    const profile = googleUser.getBasicProfile();
    const htmlStringSk=
        `
            <p>PouÄ¹Ä¾ÄÂ­vateÃÄ¾ prihlÄËsenÄË</p>
            <ul>
                <li> ID: ${profile.getId()}
                <li>  PlnÄÂ© meno: ${profile.getName()}
                <li>  KrstnÄÂ© meno: ${profile.getGivenName()}
                <li>  Priezvisko: ${profile.getFamilyName()}
                <li>  URL obrÄËzka: ${profile.getImageUrl()}
                <li>  Email: ${profile.getEmail()}
            </ul>
        `;
    const htmlStringEn=
        `
            <p>User logged in.</p>
            <ul>
                <li> ID: ${profile.getId()}
                <li>  Full name: ${profile.getName()}
                <li>  Given name: ${profile.getGivenName()}
                <li>  Family name: ${profile.getFamilyName()}
                <li>  Image URL: ${profile.getImageUrl()}
                <li>  Email: ${profile.getEmail()}
            </ul>
        `;
    //Id z profile.getId() sa nema pouzivat na komunikaciu s vlastnym serverom (you should not use the id from profile.getId() for communication with your server)
    document.getElementById("userStatus").innerHTML=htmlStringSk+htmlStringEn;
}

function renderLogOutInfo(htmlElmId) {
    const htmlString=
        `
                <p>PouÄ¹Ä¾ÄÂ­vateÃÄ¾ nie je prihlÄËsenÄË</p>
                <p>User not signed in</p>
                `;
    document.getElementById(htmlElmId).innerHTML=htmlString;
}

function signOut() {
    if(auth2.signOut) auth2.signOut();
    if(auth2.disconnect) auth2.disconnect();
    setUserName("")
    setUserEmail("")
}

function userChanged(user){
    document.getElementById("userName").innerHTML=user.getBasicProfile().getName();


    let userInfoElm = document.getElementById("userStatus");
    let userNameInputElm = document.getElementById("nameElm");



    if(userInfoElm ){// pre/for 82GoogleAccessBetter.html
        renderUserInfo(user,"userStatus");
    }else if (userNameInputElm){// pre 82GoogleAccessBetterAddArt.html
       // userNameInputElm.value=user.getBasicProfile().getName();
       // setUserName(user.getBasicProfile().getName());
       // userNameInputElm.value=user.getBasicProfile().getEmail();
       // setUserEmail(user.getBasicProfile().getEmail());
    }
}


let updateSignIn = function () {
    let sgnd = auth2.isSignedIn.get();
    if (sgnd) {
        document.getElementById("SignInButton").classList.add("hiddenElm");
        document.getElementById("SignedIn").classList.remove("hiddenElm");
        document.getElementById("userName").innerHTML = auth2.currentUser.get().getBasicProfile().getName();
        setUserName(auth2.currentUser.get().getBasicProfile().getName());
        setUserEmail(auth2.currentUser.get().getBasicProfile().getEmail());
    } else {
        document.getElementById("SignInButton").classList.remove("hiddenElm");
        document.getElementById("SignedIn").classList.add("hiddenElm");
    }

    let userInfoElm = document.getElementById("userStatus");
    let userNameInputElm = document.getElementById("nameElm");
    let userEmailInputElm = document.getElementById("emlElm");

    if (userInfoElm) {// pre 82GoogleAccessBetter.html
        if (sgnd) {
            renderUserInfo(auth2.currentUser.get(), "userStatus");

        } else {
            renderLogOutInfo("userStatus");
        }
    } else if (userNameInputElm) {// pre/for 82GoogleAccessBetterAddArt.html
        if (sgnd) {
            userNameInputElm.value = auth2.currentUser.get().getBasicProfile().getName();
            userEmailInputElm.value = auth2.currentUser.get().getBasicProfile().getEmail();
        } else {
            userNameInputElm.value = "";
            userEmailInputElm.value=""
        }


    }

};

function startGSingIn() {
    gapi.load('auth2', function() {
        gapi.signin2.render('SignInButton', {
            'width': 240,
            'height': 50,
            'longtitle': true,
            'theme': 'dark',
            'onsuccess': onSuccess,
            'onfailure': onFailure
        });
        gapi.auth2.init().then( //zavolat po inicializÄËcii OAuth 2.0  (called after OAuth 2.0 initialisation)
            function (){
                console.log('init');
                auth2 = gapi.auth2.getAuthInstance();
                auth2.currentUser.listen(userChanged);
                auth2.isSignedIn.listen(updateSignIn);
                auth2.then(updateSignIn); //tiez po inicializacii (later after initialisation)
            });
    });

}

function onSuccess(googleUser) {
    setUserName(user.getBasicProfile().getName());
    console.log('Logged in as: ' + googleUser.getBasicProfile().getName());
}
function onFailure(error) {
    console.log(error);
}