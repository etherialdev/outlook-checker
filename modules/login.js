const { header_1, header_2, header_3 } = require('../utils/headers.js');

async function get_login_url(session, email) {
    try {
        const response = await session.get(
            'https://login.microsoftonline.com/common/oauth2/v2.0/authorize', {
            headers: header_1(),
            searchParams: {
                "redirect_uri": "msauth://net.thunderbird.android/S9nqeF27sTJcEfaInpC%2BDHzHuCY%3D",
                "client_id": "e6f8716e-299d-4ed9-bbf3-453f192f44e5",
                "response_type": "code",
                "login_hint": email,
                "state": "v4WtWWgYCOSHR7rZivYT2A",
                "nonce": "MIgPdBlxPYQSDCh9SK1ocg",
                "scope": "https://outlook.office.com/IMAP.AccessAsUser.All https://outlook.office.com/SMTP.Send offline_access",
                "code_challenge": "ybj7gD4AewA9XLNLnunRS0LlY3wIf_iJuP8YfJE2LNA",
                "code_challenge_method": "S256"
            }
        })

        if (String(response.url).includes("oauth20_authorize.srf")) {
            return  {
                status: "success",
                response: response.body,
                redirect_url: response.url,
            };
        }else{
            return {
                status: "failed",
                response: response.body,
                redirect_url: null,
            };
        }
    } catch (error) {
        return {
            status: "failed",
            response: error,
            redirect_url: null,
        };
    }
}

async function get_login_params(session, login_params_url) {
    try {
        const response = await session.get(
            login_params_url, {
            headers: header_2()
        })

        if (String(response.body).includes("urlPost")) {
            const PPFT_value = response.body.match(/name="PPFT"[^>]*value="([^"]+)"/)?.[1];
            const url_post_value = response.body.match(/urlPost:'([^']+)'/)?.[1];

            return  {
                status: "success",
                response: response.body,
                redirect_url: url_post_value,
                PPFT: PPFT_value
            };
        }else{
            return {
                status: "failed",
                response: response.body,
                redirect_url: null,
                PPFT: null
            };
        }
    } catch (error) {
        return {
            status: "failed",
            response: error,
            PPFT: null
        };
    }
}


async function login(session, email, password, ppft, login_params_url, login_url) {
    try {
        const payload = {
            "ps": "2",
            "psRNGCDefaultType": "",
            "psRNGCEntropy": "",
            "psRNGCSLK": "",
            "canary": "",
            "ctx": "",
            "hpgrequestid": "",
            "PPFT": ppft,
            "PPSX": "Pass",
            "NewUser": "1",
            "FoundMSAs": "",
            "fspost": "0",
            "i21": "0",
            "CookieDisclosure": "0",
            "IsFidoSupported": "1",
            "isSignupPost": "0",
            "isRecoveryAttemptPost": "0",
            "i13": "1",
            "login": email,
            "loginfmt": email,
            "type": "11",
            "LoginOptions": "1",
            "lrt": "",
            "lrtPartition": "",
            "hisRegion": "",
            "hisScaleUnit": "",
            "passwd": password
        }
        const response = await session.post(
            login_url, 
            {
                form: payload,
                headers: header_3(login_params_url),
            }
        )
        
        if (String(response.body).includes("account.live.com/Abuse")) {
            return {
                status: "locked",
                response: response.body,
                consent_link: null,
                pprid: null,
                ipt: null,
                uaid: null,
                client_id: null,
                scope: null,
                code: null
            };
        }else if (String(response.body).includes("Your account or password is incorrect.")) {
            return {
                status: "invalid",
                response: response.body,
                consent_link: null,
                pprid: null,
                ipt: null,
                uaid: null,
                client_id: null,
                scope: null,
                code: null
            };  
        }else if(String(response.body).includes("live.com/recover")){
            return {
                status: "recovery",
                response: response.body,
                consent_link: null,
                pprid: null,
                ipt: null,
                uaid: null,
                client_id: null,
                scope: null,
                code: null
            };  
        }else if(String(response.body).includes("ar/cancel")){
            return {
                status: "security_info_change",
                response: response.body,
                consent_link: null,
                pprid: null,
                ipt: null,
                uaid: null,
                client_id: null,
                scope: null,
                code: null
            }; 
        }else if(String(response.body).includes("live.com/ResetPassword")){
            return {
                status: "too_many_tries",
                response: response.body,
                consent_link: null,
                pprid: null,
                ipt: null,
                uaid: null,
                client_id: null,
                scope: null,
                code: null
            }; 
        }else if(String(response.body).includes('interrupt/passkey')){
            return {
                status: "passkey_interrupt",
                response: response.body,
                consent_link: null,
                pprid: null,
                ipt: null,
                uaid: null,
                client_id: null,
                scope: null,
                code: null
            };  
        }else if(String(response.body).includes('agreements/privacy')){
            return {
                status: "2fa_detected",
                response: response.body,
                consent_link: null,
                pprid: null,
                ipt: null,
                uaid: null,
                client_id: null,
                scope: null,
                code: null
            };  
        }else if(String(response.body).includes('id="client_id" value="')){

            const consent_link_value = response.body.match(/id="fmHF"[^>]*action="([^"]+)"/)?.[1];
            const pprid_value = response.body.match(/id="pprid"[^>]*value="([^"]+)"/)?.[1];
            const ipt_value = response.body.match(/id="ipt"[^>]*value="([^"]*)"/)?.[1];
            const uaid_value = response.body.match(/id="uaid"[^>]*value="([^"]+)"/)?.[1];
            const client_id_value = response.body.match(/id="client_id"[^>]*value="([^"]*)"/)?.[1];
            const scope_value = response.body.match(/id="scope"[^>]*value="([^"]*)"/)?.[1];

            return {
                status: "success",
                response: response.body,
                consent_link: consent_link_value,
                pprid: pprid_value,
                ipt: ipt_value,
                uaid: uaid_value,
                client_id: client_id_value,
                scope: scope_value,
                code: null
            };  
        }else {
            return {
                status: "failed",
                response: response.body,
                consent_link: null,
                pprid: null,
                ipt: null,
                uaid: null,
                client_id: null,
                scope: null,
                code: null
            }; 
        }
    } catch (error) {
        if (String(error.response.headers.location).includes("M.")) {
            return {    
                status: "already_connected",
                response: error,
                consent_link: null,
                pprid: null,
                ipt: null,
                uaid: null,
                client_id: null,
                scope: null,
                code: String(error.response.headers.location).split("?code=")[1].split("&")[0]
            };
        }else{
            return {    
                status: "failed",
                response: error,
                consent_link: null,
                pprid: null,
                ipt: null,
                uaid: null,
                client_id: null,
                scope: null,
                code: null
            };
        }
    }
}

async function login_func(session, email, email_password) {
    const login_params_url = await get_login_url(session, email)
    if (login_params_url.status == "success") {
        const login_params = await get_login_params(session, login_params_url.redirect_url)
        if (login_params.status == "success") {
            const try_login = await login(session, email, email_password, login_params.PPFT, login_params_url.redirect_url, login_params.redirect_url)

            if (try_login.status == "already_connected") {
                return {status: "already_connected", function: "login", login_properties: try_login}
            }else if (try_login.status == "2fa_detected") {
                return {status: "2fa_detected", function: "login", login_properties: try_login}
            }else if (try_login.status == "success") {
                return {status: "success", function: "login", login_properties: try_login}
            }else if(try_login.status == "locked"){
                return {status: "locked", function: "login", login_properties: try_login}
            }else if(try_login.status == "invalid"){
                return {status: "invalid", function: "login", login_properties: try_login}
            }else if(try_login.status == "passkey_interrupt"){
                return {status: "passkey_interrupt", function: "login", login_properties: try_login}
            }else if(try_login.status == "recovery"){
                return {status: "recovery", function: "login", login_properties: try_login}
            }else if(try_login.status == "too_many_tries"){
                return {status: "too_many_tries", function: "login", login_properties: try_login}
            }else if(try_login.status == "security_info_change"){
                return {status: "security_info_change", function: "login", login_properties: try_login}
            }else{
                return {status: "retry", function: "login", login_properties: try_login}
            }

        }else{
            return {status: "retry", function: "get_login_params", login_properties: null}
        }
    }else{
        return {status: "retry", function: "login_params_url", login_properties: null}
    }
}


module.exports = {
    login_func,
}