import {html, LitElement} from "lit-element";


class BrowserExtensionComponent extends LitElement {
    static get is() {
        return 'browser-extension-component'
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

customElements.define(BrowserExtensionComponent.is, BrowserExtensionComponent);
