import AWS = require('aws-sdk');
import {Observable} from 'rxjs/Rx';
import moment = require('moment');

AWS.config.update({
  region: 'eu-central-1'
});
const db = new AWS.DynamoDB();
const docClient = new AWS.DynamoDB.DocumentClient();

const schema = {
  KeySchema: [       
    { AttributeName: 'partition', KeyType: 'HASH'},
    { AttributeName: 'timestamp', KeyType: 'RANGE' }
  ],
  AttributeDefinitions: [       
      { AttributeName: 'partition', AttributeType: 'N' },
      { AttributeName: 'timestamp', AttributeType: 'N' },
  ],
  ProvisionedThroughput: {       
      ReadCapacityUnits: 2, 
      WriteCapacityUnits: 2
  }
};

export function save(time: number, partition: number, status: number, eventGroup: number, event: number) {
  const tableName = getTableName(moment.utc(time));
  const query = {
    TableName: tableName,
    Item:{
      'timestamp': time,
      'partition': partition,
      'eventGroup': eventGroup,
      'event': event,
      'status': status,
    }
  };
  docClient.put(query, (err, data) => {
    if (err) {
      console.error('Unable to add item. Error JSON:', JSON.stringify(err, null, 2));
    }
  });
}

export function ensureTableExists() {
  const now = moment.utc();
  createTableIfNeeded(getTableName(now));
  createTableIfNeeded(getTableName(now.startOf('month').add(1, 'month')));
}

function getTableName(date: moment.Moment) {
  return `events-${date.format('YYYY-MM')}`;
}

function createTableIfNeeded(tableName: string) {
  const listTables = Observable.bindNodeCallback(db.listTables.bind(db));
  const createTable: any = Observable.bindNodeCallback(db.createTable.bind(db));
  
  listTables()
  .do(({TableNames}) => console.log('Existing tables', TableNames))
  .map(({TableNames}) => TableNames.find(t => t === tableName) !== undefined)
  .do(exists => console.log(`Need to create table ${tableName}: ${!exists}`,))
  .filter(exists => !exists)
  .do(() => console.log('Creating table ', tableName))
  .flatMap(() => createTable(Object.assign({}, schema, {TableName : tableName })))
  .subscribe(
    r => {  console.log('Table created ', tableName); }, 
    e => { 
      console.error(e)
      throw e;
    }
  )
}