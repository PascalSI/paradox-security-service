import dgram = require('dgram');
import moment = require('moment');
const cron =  require('cron');

import * as storage from './storage';

const socket = dgram.createSocket('udp4');
socket.on('message', (msg: any, info) => {
  const status = msg[0], eventGroup = msg[1], event = msg[2], partition = msg[3];
  const time = moment.utc();
  if (status !== 0) {
    storage.save(time.valueOf(), partition, status, eventGroup, event);
  }
  console.log(time.format(), partition, status, eventGroup, event);
});

storage.ensureTableExists();

new cron.CronJob('00 00 23 * * *', () => {
  storage.ensureTableExists();
}, null, true, 'UTC');

socket.on('listening', () => {
    const address = socket.address();
    console.log(`listening on ${address.address}:${address.port}`);
});
socket.bind(5416);



