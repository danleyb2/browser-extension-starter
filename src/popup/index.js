import {User,HOST} from "../api";
import { LitElement, html,css } from 'lit-element';
import {ACTION_LOGGED_IN, ACTION_SUMMARIZE} from "../actions";


var browser = null;
if (chrome){
    browser = chrome;
}


const FORM_SIGN_IN = 0;
const FORM_SIGN_UP = 1;
const FORM_RECOVER = 2;


class BrowserExtension extends LitElement {


    static get properties() {
        return {
            authenticated: { type: Boolean },
            displayLogin: { type: Number },
            detail: { type: String },
            formErrors: { type: String },
            steps: { type: Array },
            username:{type:String},
            email:{type:String}

        };
    }

    constructor() {
        super();
        this.authenticated = false;
        this.port = null;
        // if (chrome.storage) {

            browser.storage.local.get(["access_token",'username', 'email'], (item) => {
                //  items = [ { "phasersTo": "awesome" } ]
                console.log('access_token');
                console.log(item);
                if (item['access_token']) {
                    this.authenticated = true;
                    this.username = item['username'];
                    this.email = item['email'];
                    // Open a 2 way communication to background
                    this.port = browser.runtime.connect({name: "popup"});
                    // port.postMessage({});
                    // window.close();
                }
            });

        // }

        this.displayLogin = FORM_SIGN_IN;
        this.detail = null;
        this.formErrors = null;

        this.steps = [];


    }

    _handlePopup(evt){
        if (this.port) {
            this.port.postMessage({event:ACTION_SUMMARIZE});
            window.close();
        }
    }


    createRenderRoot(){
        return this;
    }

    accountRecoveryForm(){
        return html`

        <input type="email" name="email" placeholder="Email">

        <button class="button-text" @click="${this._handleRecover}">Reset</button>

        <p>
             Recalled your password? <a href="#" @click="${this._toggleSignIn}">Sign In</a>
        </p>

        `
    }
    signInForm(){
        return html`
        <!--<input type="text" name="username" placeholder="Username">-->
        <input type="email" name="email" placeholder="Email">
        <input type="password" name="password" placeholder="Password">
        <button class="button-text" @click="${this._handleSignIn}">Sign in</button>

        <button class="loginBtn loginBtn--google button-text" @click="${this._handleGoogle}">
            Sign in with Google
        </button>

        <p><a href="#" @click="${this._toggleRecovery}" >Forgot Password</a></p>
        <p>
             Don't have an account? <a href="#" @click="${this._toggleSignUp}">Sign Up</a>
        </p>

        `
    }
    signUpForm(){
        return html`
        <!--<input type="text" name="username" placeholder="Username">-->
        <input type="email" name="email" placeholder="Email">
        <input type="password" name="password1" placeholder="Password">
        <input type="password" name="password2" placeholder="Confirm Password">

        <button class="button-text" @click="${this._handleSignUp}">Sign Up</button>

        <button class="loginBtn loginBtn--google button-text" @click="${this._handleGoogle}">
            Sign up with Google
        </button>

        <p>Already have an account <a class="" href="#" @click="${this._toggleSignIn}">Sign In</a>  </p>

        `
    }


    render() {
        return html`
 <div class="form">
${this.authenticated?html`

<img src="/img/logo.png" alt="">

<h3>Hello, ${this.email}</h3>
<p>
Open BrowserExtensionPopup in the dom.
</p>


<button class="" @click="${this._handlePopup}">Summarise</button>

<button   @click="${this._handleSignOut}">Logout</button>


`:html`

        <img src="/img/logo.png">

        ${this.detail ? html`
        <p>${this.detail}</p>
        ` : html`

        <p class="f-errors">${this.formErrors}</p>

        ${this.displayLogin === FORM_SIGN_IN ? this.signInForm() : html``}
        ${this.displayLogin === FORM_SIGN_UP ? this.signUpForm() : html``}
        ${this.displayLogin === FORM_RECOVER ? this.accountRecoveryForm() : html``}


        `}

`}

         </div>


        `;
    }


    _toggleSignUp(evt){
        this.formErrors = null;
        this.displayLogin = FORM_SIGN_UP;
    }

    _toggleSignIn(evt){
        this.formErrors = null;
        this.displayLogin = FORM_SIGN_IN;
    }

    _toggleRecovery(evt){
        this.formErrors = null;
        this.displayLogin = FORM_RECOVER;
    }

    _handleSignOut(evt){
        let userApi = new User();

        userApi.logout().then(res => {
            console.log(res);
            this.detail = null;
            this.authenticated = false;
        })

    }

    _handleRecover(evt){
        let email = this.querySelector('input[name=email]').value;
        if (!email ){
            console.log('No Email');
            this.formErrors = 'No Email';
            return
        }
        this.formErrors = null;

        let userApi = new User();
        userApi.passwordReset(email).then(res => {
            console.log(res);
            this.detail = res['detail'];
        }).catch(error=>{
            this.formErrors = JSON.stringify(error);
        })

    }

    _handleSignIn(evt){

        let username = ''; // this.querySelector('input[name=username]').value;
        let email = this.querySelector('input[name=email]').value;
        let password = this.querySelector('input[name=password]').value;

        // Verify required
        if (!email || !password){
            console.log('No Email or Password');
            this.formErrors = 'No Email or Password';
            return
        }
        this.formErrors = null;

        let userApi = new User();
        userApi.login(username,email,password).then(res => {
            console.log(res);
            browser.storage.local.set({'username': username, 'email':email}, () =>{
                this.username = username;
                this.email = email;
                this.authenticated = true;

                this.port = browser.runtime.connect({name: "popup"});
                this.port.postMessage({event:ACTION_LOGGED_IN});

            });
        }).catch(error=>{
            this.parseError(error);
        })


    }


    _handleSignUp(evt){

        let username = ''; // this.querySelector('input[name=username]').value;
        let email = this.querySelector('input[name=email]').value;
        let password1 = this.querySelector('input[name=password1]').value;
        let password2 = this.querySelector('input[name=password2]').value;

        // Verify required
        if (!email || !password1 || !password2){
            console.log('No Email or Passwords or Username');
            this.formErrors = 'No Email or Passwords or Username';

            return
        }


        if (password1 != password2){
            console.log('Passwords do not match');
            this.formErrors = 'Passwords do not match';
            return;
        }

        this.formErrors = null;
        let userApi = new User();

        userApi.registration(username,email,password1,password2).then(res => {
            console.log(res);
            this.detail = res['detail'];
            browser.storage.local.set({"username": username, "email":email});
        }).catch(error=>{
            this.parseError(error);
        })


    }

    parseError(error){
        let errors = '';
        if('non_field_errors' in error){
            errors = error['non_field_errors']
        }

        const keys = Object.keys(error);
        for (const key of keys) {
            if (key != 'non_field_errors') {
                errors = error[key];
                break;
            }
        }

        this.formErrors = errors;
    }

    _sendErrorReport(evt){

    }

    _handleGoogle(evt){
        browser.tabs.create({url: `${HOST}accounts/google/login` });
    }

    firstUpdated(){
        console.log('on firstUpdated');

    }

}

customElements.define('browser-extension', BrowserExtension);
