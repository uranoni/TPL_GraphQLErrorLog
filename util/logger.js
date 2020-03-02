const winston = require("winston");
const _ = require("lodash");
const { json, timestamp, combine } = winston.format;

const productionLogger = winston.createLogger({
  exitOnError: false,
  transports: [
    new winston.transports.File({
      filename: `./logs/${new Date().toISOString().slice(0, 10)}.json`,
      level: "info",
      format: combine(timestamp(), json())
    })
  ]
});

function logObject(message) {
  if (_.isError(message)) {
    // manually extract out keys as they don't spread.
    return {
      message: message.message,
      code: message.code,
      stack: message.stack
    };
  } else if (_.isPlainObject(message)) {
    return message;
  }

  return { message };
}

function curryLog(method, metadata) {
  return function logger(message) {
    return productionLogger[method]({ ...metadata, ...logObject(message) });
  };
}

class Logger {
  constructor(metadata = {}) {
    this.metadata = metadata;
    this.silly = curryLog("silly", this.metadata);
    this.debug = curryLog("debug", this.metadata);
    this.verbose = curryLog("verbose", this.metadata);
    this.info = curryLog("info", this.metadata);
    this.warn = curryLog("warn", this.metadata);
    this.error = curryLog("error", this.metadata);
  }

  log(level, obj) {
    return productionLogger.log(level, { ...this.metadata, ...logObject(obj) });
  }

  extend(metadata) {
    return new Logger({ ...this.metadata, ...metadata });
  }
}

module.exports = new Logger();
