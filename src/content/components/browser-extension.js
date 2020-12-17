import {html, LitElement} from "lit-element";


import './browser-extension-popup'
import './browser-extension-content'


class BrowserExtension extends LitElement {

    constructor(){
        super();
        this._popup = null;
        this.popupActive = false;
        this.progress = 0;
        this.port = null;

    }

    static get properties() {
        return {
            popupActive: {
                type: Boolean,
            }
        };
    }


    render() {
        return html`

      <browser-extension-popup ?hidden="${!this.popupActive}"></browser-extension-popup>
      

    `;
    }


    /**
     * Run initialization tasks for new page content
     * firstUpdated is able to do this but this is moved here to allow for manual invocation
     */
    init(){

    }

    firstUpdated(){
        this._popup = this.shadowRoot.querySelector('browser-extension-popup');
        this.init();
    }


    popup(active=true){
        this.popupActive = active;

    }

    popupError(error){
        this.popup();
        this._popup.content = ERROR;
        this._popup.error = error;
    }

    initSomething(){
        console.log('initSomething')
    }


}

customElements.define('browser-extension', BrowserExtension);
