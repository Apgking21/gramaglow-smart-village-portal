function write(level, event, details = {}) {
  const record = {
    timestamp: new Date().toISOString(),
    level,
    event,
    ...details
  };
  const line = JSON.stringify(record);
  (level === 'error' ? console.error : console.log)(line);
}

module.exports = {
  info: (event, details) => write('info', event, details),
  warn: (event, details) => write('warn', event, details),
  error: (event, details) => write('error', event, details)
};
