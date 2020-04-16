'use strict';

const sendGrid = require('@sendgrid/mail');
const config = require('../config');
const {API_KEY, FROM} = config.sendGrid;
const Message = require('../Message');

class Driver {
  constructor() {
    this.driver = sendGrid;
    this.driver.setApiKey(API_KEY);
    this.data = {
      from: FROM
    }
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

  // data: {to, subject, text, html, from = null}
  async send(data) {
    data = this.setContent(data);
    data = {...this.data, ...data};
    return await this.driver.send(data)
  }
}

module.exports = Driver
