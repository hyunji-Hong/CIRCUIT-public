const appRoot = require('app-root-path');    // app root 경로를 가져오는 lib
const winston = require('winston');            // winston lib
const process = require('process');
const winstonDaily = require('winston-daily-rotate-file')
const dateUtils = require('date-utils');

const logger = winston.createLogger({
    level: 'debug', // 최소 레벨
    // 파일저장
    transports: [
        new winston.transports.DailyRotateFile({
            filename : `${appRoot}/logs/CIRCUIT.log`, // log 폴더에 system.log 이름으로 저장
            zippedArchive: true, // 압축여부
            format: winston.format.printf(
                info => `${new Date().toFormat('YYYY-MM-DD HH24:MI:SS')} [${info.level.toUpperCase()}] - ${info.message}`)
        }),
        // 콘솔 출력
        new winston.transports.Console({
            format: winston.format.printf(
                info => `${new Date().toFormat('YYYY-MM-DD HH24:MI:SS')} [${info.level.toUpperCase()}] - ${info.message}`)
        })
    ]
});
 
module.exports = logger;