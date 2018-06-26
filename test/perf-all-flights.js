'use strict'

const autocannon = require('autocannon')

const url = 'http://localhost:9080/rest/api/flights'
const postData = 'fromAirport=&toAirport=&fromDate=Thu%20Jun%2021%202018%2000%3A00%3A00%20GMT-0500%20(Central%20Daylight%20Time)&returnDate=Thu%20Jun%2021%202018%2000%3A00%3A00%20GMT-0500%20(Central%20Daylight%20Time)&oneWay=false'

autocannon({
  title: 'acmeair-all-flights',
  url,
  method: 'POST',
  body: postData,
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  connections: 10,
  pipelining: 1,
  duration: 10
}, console.log)
