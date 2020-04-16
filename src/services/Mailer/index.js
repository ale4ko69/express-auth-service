'use strict';

const to = require('await-to-js').default;
const SMTPDriver = require('./drivers/Smtp');
const SendGridDriver = require('./drivers/SenGrid');

class Mailer {
  constructor() {
    this.mailDriver = null
  }

  detectDriver(connection) {
    if (connection === 'smtp') {
      this.mailDriver = new SMTPDriver();
      this.mailDriver.setConfig();
    } else {
      this.mailDriver = new SendGridDriver();
    }
  }

  async send(content, connection = 'smtp') {
    if (!connection) throw new Error('Please configure mail connection to send email.')
    this.detectDriver(connection);

    return await to(this.mailDriver.send(content))
  }
}

module.exports = new Mailer()
