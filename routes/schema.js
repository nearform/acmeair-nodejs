module.exports = {
  login: {
    body: {
      type: 'object',
      required: ['login', 'password'],
      properties: {
        login: { type: 'string' },
        password: { type: 'string' }
      },
    }
  },
  logout: {
    querystring: {
      type: 'object',
      required: ['login'],
      properties: { 
        login: { type: 'string' }
      }
    }
  },
  queryFlights: {
    body: {
      type: 'object',
      required: ['fromAirport', 'fromDate', 'returnDate'],
      properties: {
        fromAirport: { type: 'string' },
        toAirport: { type: 'string' },
        fromDate: { type: 'string' },
        returnDate: { type: 'string' },
        oneWay: { type: 'boolean' }
      }
    }
  },
  bookFlights: {
    body: {
      type: 'object',
      required: ['userid', 'toFlightId'],
      properties: {
        userid: { type: 'string' },
        toFlightId: { type: 'string' },
        retFlightId: { type: 'string' },
        oneWay: { type: 'boolean' }
      }
    }
  },
  cancelBooking: {
    body: {
      type: 'object',
      required: ['userid', 'number'],
      properties: {
        userid: { type: 'string' },
        number: { type: 'string' }
      }
    }
  },
  bookingsByUser: {
    params: {
      type: 'object',
      required: ['user'],
      properties: {
        user: { type: 'string' }
      }
    }
  },
  getCustomerById: {
    params: {
      type: 'object',
      required: ['user'],
      properties: {
        user: { type: 'string' }
      }
    }
  },
  putCustomerById: {
    params: {
      type: 'object',
      required: ['user'],
      properties: {
        user: { type: 'string' }
      }
    },
    body: {
      type: 'object',
      properties: {
        _id: { type: 'string' },
        password: { type: 'string' },
        phoneNumber: { type: 'string' },
        phoneNumberType: { type: 'string' },
        address: {
          type: 'object',
          properties: {
            streetAddress1: { type: 'string' },
            streetAddress2: { type: 'string' },
            city: { type: 'string' },
            stateProvince: { type: 'string' },
            country: { type: 'string' },
            postalCode: { type: 'string' }
          }
        }
      }
    }
  }
}