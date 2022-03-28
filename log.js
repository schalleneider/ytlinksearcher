import log4js from 'log4js';
import chalk from 'chalk';

class Log {

    constructor() {

        log4js.configure({
            appenders: {
                console: { type: 'stdout', layout: { type: 'coloured' } },
                everything: { type: 'file', filename: 'logs/logs.txt', encoding: 'UTF-8' }
            },
            categories: {
                default: { appenders: [ 'console', 'everything' ], level: 'trace' }
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
    static warning(text) {
        Log.instance.logger.warning(text);
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

    static debugVideoDetails(videoDetails) {
        for (let index = 0; index < videoDetails.length; index++) {
            const current = videoDetails[index];
            let text = `{ id: ${current.id}, duration: ${current.durationSeconds}, views: ${current.views}, licensed: ${current.licensed}, rank: ${current.rank} }`; 
            index === 0 ? this.debug(text) : this.trace(text);
        }
    }
}

export { Log };