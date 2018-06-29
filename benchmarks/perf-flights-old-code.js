'use strict'

const autocannon = require('autocannon')

const url = 'http://localhost:9080/rest/api/flights/queryflights'
const postData = 'fromAirport=BOM&toAirport=AMS&fromDate=Thu%20Jun%2021%202018%2000%3A00%3A00%20GMT-0500%20(Central%20Daylight%20Time)&returnDate=Thu%20Jun%2021%202018%2000%3A00%3A00%20GMT-0500%20(Central%20Daylight%20Time)&oneWay=false'

const instance = autocannon({
  title: 'acmeair-flights-old-code',
  url,
  method: 'POST',
  body: postData,
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Cookie': 'sessionid=ec9a7f57-bc75-4baa-9fa7-0014bfaa0b49; loggedinuser=uid0%40email.com'
  },
  connections: 10,
  pipelining: 1,
  duration: 30
}, console.log)

process.once('SIGINT', () => {
  instance.stop()
})

autocannon.track(instance)
