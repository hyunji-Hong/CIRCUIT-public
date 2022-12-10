const appRoot = require('app-root-path');    
const winston = require('winston');            // winston lib
const process = require('process');
const winstonDaily = require('winston-daily-rotate-file')
const dateUtils = require('date-utils');

const logger = winston.createLogger({
    level: 'debug', 
    transports: [
        new winston.transports.DailyRotateFile({
            filename : `${appRoot}/logs/CIRCUIT.log`, 
            zippedArchive: true, 
            format: winston.format.printf(
                info => `${new Date().toFormat('YYYY-MM-DD HH24:MI:SS')} [${info.level.toUpperCase()}] - ${info.message}`)
        }),
        new winston.transports.Console({
            format: winston.format.printf(
                info => `${new Date().toFormat('YYYY-MM-DD HH24:MI:SS')} [${info.level.toUpperCase()}] - ${info.message}`)
        })
    ]
});
 
module.exports = logger;