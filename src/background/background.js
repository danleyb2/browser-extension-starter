import {User,Api} from "../api";

import {
    ACTION_ERROR,
    ACTION_LOGGED_IN,
    TAB_LOAD_COMPLETE
} from "../actions";


var browser = null;
if (chrome){
    browser = chrome;
}


let ports = [];


function retrieveTokens(){
    return new Promise((resolve,reject) => {
        browser.storage.local.get(["access_token",'refresh_token'], (item) => {
            if (item['access_token']) {
                resolve([
                    item['access_token'],
                    item['refresh_token']
                ])
            }else {
                resolve([null,null])
            }
        })
    })
}

function isAuthenticated() {
    console.log('isAuthenticated check');
    return retrieveTokens().then((tokens)=>{
        if (tokens[0]){
            return true;
        } else {
            return false;
        }
    });
}

let popupPort = function(){ return ports.find( (port) =>port.name == 'popup'); };
// let csPort = null;

browser.runtime.onMessage.addListener( function (request, sender, sendResponse) {
    console.log(request);

    if (request.type == 'feedback'){

        let endpoint = 'path1';
        let data = {};

        authenticatedRequest(endpoint, data ).then(res=>{
            console.log(res);
            sendResponse(res);
        }).catch(error=>{
            sendResponse({error: error});
        });

        return true;


    } else {
        // Error
        var report = new FormData();
        report.append('subject','Error');
        report.append('body','An Error Occurred');

        // this turns the base 64 string to a [File] object
        const buff = [];

        // clone so we can rename, and put into array for easy proccessing
        let file = new File([buff], `screenshot.jpg`, {type: 'image/jpeg',});
        report.append('screen_shoot',file);

        authenticatedRequest( "path_upload", report ).then(res=>{
            console.log(res);
            sendResponse(res);
        }).catch(error=>{
            sendResponse({error: error});
        });

        return true

    }

});



browser.runtime.onMessageExternal.addListener(function(request, sender, sendResponse) {

        if (request.accessToken && request.refreshToken) {

            browser.storage.local.set({
                "access_token": request.accessToken,
                "refresh_token": request.refreshToken,
                "email":request.email,
                "username":''
            }, () =>{

                //  Data's been saved
                console.log('saved access and refresh tokens');
                sendResponse({success:true})
            });

        }else {

            sendResponse({success:false})
        }

        return true;
});





function authenticatedRequest(endpoint,data) {

    return new Promise((resolve,reject) => {

        return retrieveTokens().then(tokens => {
            const accessToken = tokens[0];
            const refreshToken = tokens[1];

            if (accessToken) {
                let api = new Api(accessToken);

                api.post(endpoint,data).then(res=>{
                    console.log(res);
                    resolve(res);
                }).catch(error=>{
                    console.log(error);
                    // TODO check status code
                    if ('code' in error){
                        if (error['code'] == 'token_not_valid'){
                            // Refresh
                            let user = new User();
                            user.tokenRefresh( refreshToken )
                                .then(res=>{
                                    // console.log(res);
                                    resolve(authenticatedRequest(endpoint,data));
                                }).catch(error=>{
                                console.log(error);
                                user.logout().then(res=>{
                                    reject(error);
                                }).catch(err=>{
                                    reject(error);
                                })
                            });
                        }else {
                            reject(error);
                        }

                    }else if('detail' in error && error['detail'] == 'Request was throttled.') {
                        // Manually trigger code not valid flow
                        error['code'] = 'request_throttled';
                        reject(error);
                    }else {
                        reject(error);
                    }
                });

            }else {
                console.log('No access token');
                reject({detail: "Token is invalid or expired", code: "token_not_valid"})
            }
        });

    })
}


const MAX_TRIES = 10;

/**
 * Makes repeated requests to an endpoint upto MAX_TRIES
 * The endpoint returns a status that is forwarded to content
 *
 * @param endp
 * @param res
 * @param csPort
 * @param source
 * @param tries
 */
function  pollEndpoint(endp,res, csPort, source, tries = 1) {

    // let interval = setInterval(async function () {
    let p = Number( tries /MAX_TRIES *100).toFixed();

        authenticatedRequest(endp,  { id: res.id , action_id:res.action_id}).then(res=>{
            // console.log(res);

            if ('request' in res && res.request == 'success') {

                csPort.postMessage({
                    event: ACTION_PROGRESS,
                    status: 'complete',
                    res: res,
                    value: p,
                    source: source,

                    endpoint: endp,
                    pageId: res.id,
                    actionId: res.action_id
                });

            } else if ('request' in res && res.request == 'fail') { // dont retry failed

                csPort.postMessage({
                    event:ACTION_PROGRESS,
                    status:'incomplete',
                    res:'MAX_TRIES',
                    value: 100,
                    source:source
                });

            }else if (tries>MAX_TRIES ){ // TODO or port disconnected
                csPort.postMessage({
                    event:ACTION_PROGRESS,
                    status:'incomplete',
                    res:'MAX_TRIES',
                    value: 100,
                    source:source
                });

            // }else if (tries>=2 ){ throw new Error('Testing Error'); // TODO Testing Error

            }else {

                csPort.postMessage({
                    event: ACTION_PROGRESS,
                    status:'running',
                    value: p,
                    source:source
                });

                setTimeout(() => {
                    pollEndpoint(endp, res, csPort,source, tries+=1)
                },3000)
            }
        }).catch(error=>{
            console.log(error);
            // clearInterval(interval);
            csPort.postMessage({
                event:ACTION_ERROR,
                error:error,
                source:source
            });
        });
    // },2000);
}



function sendData(port,endpoint,msg,endpoint2,source ){
    port.postMessage({event:ACTION_UPLOAD,source:source});
    authenticatedRequest(endpoint,msg.content).then(res=>{
        port.postMessage({event:ACTION_UPLOADED,res:res,source:source});

        pollEndpoint(endpoint2, res,port,source);

    }).catch(error=>{
        let errorMessage = `${error.status} - ${error.error}`;

        port.postMessage({
            event: ACTION_ERROR,
            error: error.code? error: errorMessage,
            source:source
        });
    });
}

//menu item for simplify
const MENU_SIMPLIFY = "simplify";
let contextMenuItem1 = {
    "id": MENU_SIMPLIFY,
    "title": "Summarise Selection",
    "contexts": ["selection"]
};
browser.contextMenus.create(contextMenuItem1);



browser.contextMenus.onClicked.addListener(function(clickData,tab){

    if (clickData.selectionText){
        let body = clickData.selectionText;
        console.log(clickData.selectionText);

            for (let i = 0; i < ports.length; i++) {
                let port = ports[i];
                if (port.sender.tab && port.sender.tab.id == tab.id ){
                    let msg = {
                        event:null,
                        selection:body
                    };
                    switch (clickData.menuItemId) {
                        case MENU_SIMPLIFY:
                            msg.event = INIT_SIMPLIFY;
                            break;
                    }
                    port.postMessage(msg);
                    return;
                }
            }
            throw Error('contextMenus tap not found')
    }
});



browser.runtime.onConnect.addListener(function (port) {

    ports.push(port);

    port.onDisconnect.addListener(function (msg) {
        // console.log(msg);
        const index = ports.indexOf(port);
        if (index > -1) {
            ports.splice(index, 1);
        }

    });

    if (port.name == 'popup'){

        port.onMessage.addListener(function (msg) {
            // Trigger closing of the popup
            if (msg.event == ACTION_LOGGED_IN ){
                // Notify all tabs to init
                browser.tabs.query({url:'*://*/*'}, function(tabs) {
                    for(var i = 0; i < tabs.length; i++) {
                        let tab = tabs[i];
                        for (let j = 0; j < ports.length; j++) {
                            let openPort = ports[j];
                            if (openPort.sender.tab && openPort.sender.tab.id == tab.id) {
                                openPort.postMessage({event: ACTION_LOGGED_IN});
                                break
                            }
                        }
                    }
                });
            }else if (msg.event == ACTION_SUMMARIZE) {
                // Get Active tab
                browser.tabs.query({active: true, lastFocusedWindow: true}, function (tabs) {
                    console.log(tabs);
                    let tab = tabs[0];
                    for (let i = 0; i < ports.length; i++) {
                        let port = ports[i];
                        if (port.sender.tab && port.sender.tab.id == tab.id) {
                            port.postMessage({event: ACTION_SUMMARIZE});
                            break
                        }
                    }
                });
            }
        });

    }else {

        // csPort = port;
        port.onMessage.addListener(function (msg) {
            // console.log(msg.content);
            let endpoint1 =null , endpoint2 = null, msgSource = null;

            isAuthenticated().then(function (loggedIn) {

                if (loggedIn){

                    if (msg.event ==  ACTION_SUMMARIZE){
                        endpoint1 = 'page/summarise/';
                        endpoint2 = 'page/summarise-ret/';
                        msgSource = FROM_POPUP;
                    } else {
                        console.info('unknown event')
                    }


                }else {

                    throw new Error('NOT IMPLEMENTED')
                }

                sendData(
                    port,
                    endpoint1,
                    msg,
                    endpoint2,
                    msgSource
                )

            });

        });

    }

});


/**
 * Tracking navigation by javascript , Sends events to content script
 *
 */
browser.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete') {

        for (let i = 0; i < ports.length; i++) {
            let port = ports[i];
            if (port.sender.tab && port.sender.tab.id == tab.id ){

                let msg = {
                    event:TAB_LOAD_COMPLETE,
                    // url: tab.url
                };

                port.postMessage(msg);
                return;
            }
        }
    }
});


// Check whether new version is installed
browser.runtime.onInstalled.addListener(function(details){
    if(details.reason == "install"){
        console.log("This is a first install!");
        browser.tabs.query({url:'*://*/*'}, function(tabs) {
            for(var i = 0; i < tabs.length; i++) {
               console.log(`tab ${tabs[i].id}`);
               browser.tabs.insertCSS(tabs[i].id, { file: "content.css" }, function() {});
               browser.tabs.executeScript(tabs[i].id, { file: "webcomponents-bundle.js" }, function() {});
               browser.tabs.executeScript(tabs[i].id, { file: "content.js" }, function() {});
            }
        });

    }else if(details.reason == "update"){
        var thisVersion = chrome.runtime.getManifest().version;
        console.log("Updated from " + details.previousVersion + " to " + thisVersion + "!");
    }
});
