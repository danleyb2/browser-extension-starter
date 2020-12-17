import {html, LitElement} from "lit-element";
var browser = null;
if (chrome){
    browser = chrome;
}


export const ERROR= 2;



class BrowserExtensionPopup extends LitElement {

    constructor(){
        super();

        this.hidden = false;
    }

    static get properties() {
        return {
            hidden: {
                type: Boolean,
                reflect: true
            }
        };
    }

    render() {
        return html`
        <style>

        :host{
            display: block;
            position:fixed;
            right: 20px;
            top:20px;
            z-index: 100000000000;
            width: 500px;
            background-color: white;

        }

        :host([hidden]){
            display: none;
        }

        *, ::after, ::before { -webkit-box-sizing: border-box; box-sizing: border-box; }
        
        
/* New Styles */

.container {

    border: 1px solid #3EC5FF;
    box-sizing: border-box;
    border-radius: 10px;
    padding-top: 12px;
    padding-left: 12px;
    padding-right: 12px;

}

        .content{
            padding: 0 1px 40px 1px;
        }
        

</style>

<div class="container">


<div style="height:13px">

<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" @click="${this._closePopup}" style="float:right;">
<path d="M7.00023 5.58623L11.9502 0.63623L13.3642 2.05023L8.41423 7.00023L13.3642 11.9502L11.9502 13.3642L7.00023 8.41423L2.05023 13.3642L0.63623 11.9502L5.58623 7.00023L0.63623 2.05023L2.05023 0.63623L7.00023 5.58623Z" fill="#AFAFAF"/>
</svg>



</div>

<div class="content">

Browser Extension Starter By Sifhic.

</div>
</div>


    `;

    }

    open(){
        this.hidden = false;
    }
    close(){
        this.hidden = true;
    }

    _sendErrorReport(evt){

        browser.runtime.sendMessage({type:'error',  screenshotBuffer: evt.detail.screenshotBuffer }, (response) =>{
            console.log(response);

        });

    }

    _closePopup(evt){
        console.log('_closePopup');
        // TODO this.close();
        browserExtension.popup(false);

    }

}
customElements.define('browser-extension-popup', BrowserExtensionPopup);

