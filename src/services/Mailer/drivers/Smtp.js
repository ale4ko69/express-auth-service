'use strict';

const nodemailer = require('nodemailer');
const settings = require('../config');
const Message = require('../Message');

class Driver {
  constructor() {
    this.transporter = null;
  }

  setConfig(config = settings.smtp) {
    this.transporter = nodemailer.createTransport(config)
  }

  setContent(content) {
    const message = new Message();
    let subjectDefault = content.subject || config.subjectDefault;
    message.subject(subjectDefault);
    if (content.customerName) {
      message.to(content.email, content.customerName);
    } else {
      message.to(content.email);
    }
    if (content.text) {
      message.text(content.text)
    }
    if (content.html) {
      message.html(content.html)
    }
    if (content.attachFile) {
      message.attach(content.attachFile)
    }
    return message.toJSON();
  }

  async send(message) {
    if (!this.transporter) throw new Error('please config SMTP connection to send e-mail.');
    message = this.setContent(message);
    return await this.transporter.sendMail(message)
  }
}

module.exports = Driver
