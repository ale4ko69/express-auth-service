const {
  MAIL_CONNECTION, RECEIVED_NOTIFY_EMAIL,
  SMTP_PORT, SMTP_HOST, SMTP_USERNAME, SMTP_PASSWORD,
  SEND_GRID_FROM, SEND_GRID_KEY
} = process.env;

module.exports = {
  connection: MAIL_CONNECTION || "smtp",
  smtp: {
    pool: true,
    port: SMTP_PORT || 587,
    host: SMTP_HOST || "smtp.gmail.com",
    secure: false,
    auth: {
      user: SMTP_USERNAME || "test@gmail.com",
      pass: SMTP_PASSWORD || "unknown"
    },
    maxConnections: 5,
    maxMessages: 100,
    rateLimit: 10
  },
  sendGrid: {
    FROM: SEND_GRID_FROM || "test@gmail.com",
    API_KEY: SEND_GRID_KEY || "unknown"
  },
  subjectDefault: "[Digital Media System]",
  RECEIVED_NOTIFY_EMAIL: RECEIVED_NOTIFY_EMAIL || 'receive.test@mqsolutions.com.vn'
}
