// https://github.com/kelektiv/node-cron
const CronJob = require('cron').CronJob;
const moment = require('moment');
const to = require('await-to-js').default;
const ModelToken = require('../Models/Token');

const TimeZoneVN = 'Asia/Ho_Chi_Minh';
const TAG = '[cronjob/cron.js]';
const defaultFormatDate = 'YYYY-MM-DD HH:mm:ss';

module.exports = {
  async start() {
    // abc
    try {
      job('0 0 8 * * *', autoCheckExpiredToken);
    } catch (e) {
      console.log(`${TAG} jobRemoveExpiredTokens error:`, e);
    }
  }
}; // module.exports

function job(time, cb) {
  return new CronJob(time, () => cb(), null, true, TimeZoneVN);
}

async function autoCheckExpiredToken() {
  const funcName = "jobRemoveExpiredTokens";
  console.log(`${TAG} ${funcName} start at ${moment().format(defaultFormatDate)}`);
  let [err, result] = await to(ModelToken.deleteByCondition({expiredAt: {$lte: Date.now()}}));
  if (err) {
    console.log(`${TAG} ${funcName} error:`, err);
  }
  console.log(`${TAG} ${funcName} end at ${moment().format(defaultFormatDate)}`, result);
}
