
import {
    ACTION_LOGGED_IN,
    ACTION_SUMMARIZE,
    ACTION_UPLOAD,
    TAB_LOAD_COMPLETE
} from "../actions";


import './components/browser-extension'


var browser = null;
if (chrome){
    browser = chrome;
}

// TODO should the name be unique
var port = browser.runtime.connect({name: "knockknock"});


// Browser Extension
const browserExtension = document.createElement('browser-extension');
browserExtension.port = port;
window.browserExtension = browserExtension;
document.body.appendChild(browserExtension);

let ignoreTabLoads = 1;

port.onMessage.addListener(function (msg) {

    console.log(msg);
    if (msg.event == ACTION_SUMMARIZE){
        browserExtension.initSomething()

    }else if (msg.event == ACTION_UPLOAD){

    }else if (msg.event == TAB_LOAD_COMPLETE) {
        console.log('TAB_LOAD_COMPLETE event');
        // console.log(document.readyState);
        // select the target node
        if (ignoreTabLoads == 0){

            // Observe a part of page whose change shows load completion
            var target = document.querySelector('title');

            // create an observer instance
            var observer = new MutationObserver(function(mutations) {
                // We need only first event and only new value of the title
                // console.log(mutations[0].target.nodeValue);
                browserExtension.init();
                observer.disconnect();

            });

            // configuration of the observer:
            var config = { subtree: true, characterData: true, childList: true };

            // pass in the target node, as well as the observer options
            observer.observe(target, config);
        } else {
            ignoreTabLoads -= 1
        }

    }else if (msg.event == ACTION_LOGGED_IN){
        browserExtension.init();
    }

});


window.addEventListener('mousedown', e => {
    // Hide popup on outside click
    if (browserExtension.popupActive && e.path.indexOf(browserExtension._popup) < 1){
        browserExtension.popup(false);
    }
});
