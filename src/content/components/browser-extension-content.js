import {html, LitElement} from "lit-element";


class BrowserExtensionContent extends LitElement {
    static get is() {
        return 'browser-extension-content'
    }

    render() {

        return html`
<style>
:host{
    margin: auto;
    display: block;
    max-width: 32px;
}
*, ::after, ::before { -webkit-box-sizing: border-box; box-sizing: border-box; }

</style>
<span>Loading .. </span>
`
    }

}

customElements.define(BrowserExtensionContent.is, BrowserExtensionContent);
