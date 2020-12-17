var browser = null;
if (chrome){
    browser = chrome;
}


/**
 * Mixin re-useable functionality into components
 */
export const featureMixin = (baseElement) => class extends baseElement {

    feature(){
        console.log('applied feature called');

    }

};
