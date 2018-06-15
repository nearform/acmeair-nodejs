'use strict'
const uuidv4 = require('uuid/v4')
const addHours = require('date-fns/add_hours')
const addDays = require('date-fns/add_days')
const startOfToday = require('date-fns/start_of_today')

const customerTemplate = (index) => {
  return {
    _id : uuidv4(),
    email: `uid${index}@email.com`,
    password : "password",
    status : "GOLD",
    total_miles : 1000000,
    miles_ytd : 1000,
    address : {
        streetAddress1 : "123 Main St.",
        city : "Anytown",
        stateProvince : "NC",
        country : "USA",
        postalCode : "27617"
    },
    phoneNumber : "919-123-4567",
    phoneNumberType : "BUSINESS"
  }
}

const flightSegmentTemplate = (_id, origin, destination, miles) => {
  return {
    _id,
    originPort : origin,
    destPort : destination,
    miles : miles
  }
}

const flightTemplate = (flightSegmentId, miles, daysToAdd) => {
  const departure = addDays(startOfToday(), daysToAdd) 
  const hoursTodAdd = Number(miles)/600
  const arrival = addHours(departure, hoursTodAdd)

  return {
    _id : uuidv4(),
    flightSegmentId,
    scheduledDepartureTime : departure,
    scheduledArrivalTime : arrival,
    firstClassBaseCost : 500,
    economyClassBaseCost : 200,
    numFirstClassSeats : 10,
    numEconomyClassSeats : 200,
    airplaneTypeId : "B747"
  }
}

module.exports = {
  customerTemplate,
  flightSegmentTemplate,
  flightTemplate
}
