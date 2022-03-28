import log4js from 'log4js';

class Log {

    constructor() {

        log4js.configure({
            appenders: {
                console: { type: 'stdout', layout: { type: 'coloured' } },
                data: { type: 'file', filename: 'logs/data.txt', encoding: 'UTF-8' },
                errors: { type: 'file', filename: 'logs/errors.txt', encoding: 'UTF-8' },
                datafilter: { type: 'logLevelFilter', appender: 'data', level: 'trace', maxLevel: 'warn' },
                errorsfilter: { type: 'logLevelFilter', appender: 'errors', level: 'error', maxLevel: 'fatal' }
            },
            categories: {
                default: { appenders: [ 'console', 'datafilter', 'errorsfilter' ], level: 'trace' }
            }
        });

        this.logger = log4js.getLogger('ytlinksearcher');
    }

    static get instance() {
        if (!Log._instance) {
            Log._instance = new Log();
        }
        return Log._instance;
    }

    // green
    static info(text) {
        Log.instance.logger.info(text);
    }
    
    // yellow
    static warn(text) {
        Log.instance.logger.warn(text);
    }

    // red
    static error(text) {
        Log.instance.logger.error(text);
    }
    
    // fatal
    static fatal(text) {
        Log.instance.logger.fatal(text);
    }

    // cyan
    static debug(text) {
        Log.instance.logger.debug(text);
    }
    
    // blue
    static trace(text) {
        Log.instance.logger.trace(text);
    }

    static debugVideoDetails(videoDetails, choosenIdList) {
        for (let index = 0; index < videoDetails.length; index++) {
            const current = videoDetails[index];
            let text = `{ id: ${current.id}, duration: ${current.durationSeconds}, views: ${current.views}, licensed: ${current.licensed}, rank: ${current.rank} }`; 
            choosenIdList.some(item => item.id === current.id) ? this.debug(text) : this.trace(text);
        }
    }
}

export { Log };