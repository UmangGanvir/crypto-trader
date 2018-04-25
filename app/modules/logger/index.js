const {createLogger, format, transports} = require('winston');
const {combine, timestamp, colorize, align, label, printf} = format;

const appLogFormat = printf(info => {
    if (typeof info.message !== 'string') {
        info.message = JSON.stringify(info.message);
    }
    return `${info.timestamp} [${info.label}] ${info.level}: ${info.message}`;
});

module.exports = (moduleName) => {
    return createLogger({
        level: 'silly',
        format: combine(
            label({label: moduleName}),
            timestamp(),
            colorize(),
            appLogFormat,
            align()
        ),
        transports: [new transports.Console({
            json: true
        })]
    });
};
