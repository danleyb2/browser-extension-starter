var browser = null;
if (chrome){
    browser = chrome;
}

const CHROME_WEB_STORE_ID = 'jpccajplgimbggconemgolhnmdifpnap';


export const HOST = `https://${browser.runtime.id==CHROME_WEB_STORE_ID?'api.sifhic.com':'dev.sifhic.com'}/`;


export class Api {
    constructor(bearerToken=null) {
        this.bearerToken = bearerToken;
    }

    /**
     * Parses the JSON returned by a network request
     *
     * @param  {object} response A response from a network request
     *
     * @return {object}          The parsed JSON, status from the response
     */
    parseJSON(response) {
        return new Promise((resolve,reject) => response.json()
            .then((json) => resolve({
                status: response.status,
                ok: response.ok,
                json,
            })).catch((error)=>reject({
                status: response.status,
                ok: response.ok,
                error:error.message
            })));
    }

    /**
     * Requests a URL, returning a promise
     *
     * @param  {string} url       The URL we want to request
     * @param  {object} [options] The options we want to pass to "fetch"
     *
     * @return {Promise}           The request promise
     */
    request(method, endpoint, data) {

        let headers = {
            // 'Content-Type': 'application/x-www-form-urlencoded',
        };

        if (this.bearerToken){
            headers['Authorization'] = `Bearer ${this.bearerToken}`;
        }

        if (data instanceof FormData){

        }else {
            headers['Content-Type']='application/json'
        }

        let init = {
            method: method,
            headers: headers
        };


        if (method === 'POST') {
            // console.log(typeof data )

            init['body'] = data instanceof FormData?data: JSON.stringify(data)

        } else {

        }

        return new Promise((resolve, reject) => {
            fetch(HOST + endpoint, init)
                .then(this.parseJSON)
                .then((response) => {
                    if (response.ok) {
                        resolve(response.json);
                    }
                    // extract the error from the server's json
                    reject(response.json); //.meta.error
                })
                .catch((error) => {
                    console.error(error);
                    reject(error);
                    // reject({
                    //     networkError: JSON.stringify(error),
                    // })
                });

        });
    }

    get(endpoint, params) {
        return this.request('GET', endpoint, params)
    }

    post(endpoint, data) {
        return this.request('POST', endpoint, data)
    }

}


export class User extends Api {
    constructor() {
        super();
        this.base = 'user/'
    }

    registration(username, email, password1, password2) {
        let d = {
            // username: username,
            email: email,
            password1: password1,
            password2: password2
        };

        let endpoint = this.base + 'registration/';

        return this.post(endpoint, d).then(snippet => {
            console.log(snippet);
            return snippet;
        });


    }

    login(username, email, password) {
        let d = {
            // username: username,
            email: email,
            password: password,

        };

        let endpoint = this.base + 'login/';

        return this.post(endpoint, d).then(snippet => {
            console.log(snippet);
            // save token
            return new Promise((resolve )=> {
                browser.storage.local.set({
                    "access_token": snippet['access_token'],
                    "refresh_token": snippet['refresh_token']
                }, () =>{
                    //  Data's been saved
                    resolve(snippet['user']);
                });
            });

        });


    }

    tokenRefresh(refresh) {
        let d = {
            refresh
        };

        let endpoint = this.base + 'token/refresh/';

        return this.post(endpoint, d).then(snippet => {
            console.log(snippet);
            // access
            return new Promise((resolve )=> {
                browser.storage.local.set({"access_token": snippet['access']}, () =>{
                    //  Data's been saved
                    resolve(snippet['access']);
                });
            });

        });


    }
    passwordReset(email) {
        let d = {
            email
        };

        let endpoint = this.base + 'password/reset/';
        return this.post(endpoint, d);

    }

    logout() {
        let endpoint = this.base + 'logout/';
        return this.post(endpoint,{}).then(res => {
            // TODO delete token
            return new Promise((resolve) => {
                browser.storage.local.set({"access_token": null, "refresh_token": null}, () => {
                    resolve(res);
                });
            })
        }).catch(error=>{
            return new Promise((resolve,reject) => {
                browser.storage.local.set({"access_token": null, "refresh_token": null}, () => {
                    reject(error);
                });
            })
        })
    }


}
