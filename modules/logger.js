const fs = require('fs');
const { Mutex } = require('async-mutex');
const { format } = require('date-fns');

class Log {
    static lock = new Mutex();
    static logFile = null;

    static setLogFile(filename) {
        Log.logFile = fs.createWriteStream(filename, { flags: 'a' });
    }

    static async _log(level, prefix, message) {
        const timestamp = format(new Date(), 'HH:mm:ss');
        const logMessage = `[\x1b[34m${timestamp}\x1b[0m] ${prefix} ${message}`;

        await Log.lock.runExclusive(async () => {
            if (Log.logFile) {
                Log.logFile.write(logMessage + '\n');
                Log.logFile.flush();
            }
            console.log(logMessage);
        });
    }

    static async Success(message, prefix = "(+)", color = "\x1b[32m") {
        await Log._log("SUCCESS", `${color}${prefix}\x1b[0m`, message);
    }

    static async Error(message, prefix = "(-)", color = "\x1b[31m") {
        await Log._log("ERROR", `${color}${prefix}\x1b[0m`, message);
    }

    static async Debug(message, prefix = "(#)", color = "\x1b[33m") {
        await Log._log("DEBUG", `${color}${prefix}\x1b[0m`, message);
    }

    static async Info(message, prefix = "(?)", color = "\x1b[37m") {
        await Log._log("INFO", `${color}${prefix}\x1b[0m`, message);
    }

    static async Warning(message, prefix = "(!)", color = "\x1b[35m") {
        await Log._log("WARNING", `${color}${prefix}\x1b[0m`, message);
    }

    static async info(message, prefix = "(?)", color = "\x1b[37m") {
        await Log._log("INFO", `${color}${prefix}\x1b[0m`, message);
    }

    static async error(message, prefix = "(-)", color = "\x1b[31m") {
        await Log._log("ERROR", `${color}${prefix}\x1b[0m`, message);
    }

    static async warning(message, prefix = "(!)", color = "\x1b[35m") {
        await Log._log("WARNING", `${color}${prefix}\x1b[0m`, message);
    }
}




module.exports = { Log };