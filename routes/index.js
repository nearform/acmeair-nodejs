const uuid = require('node-uuid')

module.exports = function (dataAccess, fastifyService, settings, authService) {
  const dataaccess = dataAccess,
      service = fastifyService,
      flightCache = require('ttl-lru-cache')({maxLength:settings.flightDataCacheMaxSize});
      flightDataCacheTTL = settings.flightDataCacheTTL == -1 ? null : settings.flightDataCacheTTL,
      flightSegmentCache = require('ttl-lru-cache')({maxLength:settings.flightDataCacheMaxSize});

  module.login = async (req, reply) => {
    const login = req.body.login,
          password = req.body.password;
    reply.setCookie('sessionid', '');
    const response = await service.login(login, password);
    reply.setCookie('sessionid', response);
    reply.send('logged in');
  }

  module.logout = async (req, reply) => {
    const sessionid = req.cookies.sessionid;
    const response = await service.logout(sessionid);
    reply.setCookie('sessionid', '');
    reply.send('logged out');
  }

  module.configRuntime = async (req, reply) => {
    let runtimeInfo = [];
	runtimeInfo.push({"name":"Runtime","description":"NodeJS"});
	const versions = process.versions;
	for (var key in versions) {
	  runtimeInfo.push({"name":key,"description":versions[key]});
	}
	reply.send(JSON.stringify(runtimeInfo));
  }

  module.configDataServices = async (req, reply) => {
    const dataServices = [{"name":"cassandra","description":"Apache Cassandra NoSQL DB"},
        {"name":"cloudant","description":"IBM Distributed DBaaS"},
        {"name":"mongo","description":"MongoDB NoSQL DB"}];
    reply.send(JSON.stringify(dataServices));
  }

  module.countCustomers = async (req, reply) => {
    try {
      const count = await service.countItems(dataaccess.dbNames.customerName);
	  reply.send(count.toString());
    }
    catch (e) {
      reply.send("-1");
    }
  }

  module.countSessions = async (req, reply) => {
    try {
      const count = await service.countItems(dataaccess.dbNames.customerSessionName);
	  reply.send(count.toString());
    }
    catch (e) {
      reply.send("-1");
    }    
  }

  module.countFlights = async (req, reply) => {
    try {
      const count = await service.countItems(dataaccess.dbNames.flightName);
	  reply.send(count.toString());
    }
    catch (e) {
      reply.send("-1");
    }    
  }

  module.countFlightSegments = async (req, reply) => {
    try {
      const count = await service.countItems(dataaccess.dbNames.flightSegmentName);
	  reply.send(count.toString());
    }
    catch (e) {
      reply.send("-1");
    }    
  }

  module.countBookings = async (req, reply) => {
    try {
      const count = await service.countItems(dataaccess.dbNames.bookingName);
	  reply.send(count.toString());
    }
    catch (e) {
      reply.send("-1");
    }    
  }

  module.countAirports = async (req, reply) => {
    try {
      const count = await service.countItems(dataaccess.dbNames.airportCodeMappingName)
			reply.send(count.toString());
    }
    catch (e) {
      reply.send("-1");
    }    
  }

  module.checkForValidSessionCookie = async (req, reply, done) => {
    let sessionid = req.cookies.sessionid;
    if (sessionid) {
      sessionid = sessionid.trim();
    }
    if (!sessionid || sessionid == '') {
      reply.code(403).send('Forbidden');
      return;
    }        
    try {
      const customerid = await service.validateSession(sessionid)
      if (customerid) {
        req.acmeair_login_user = customerid;
        done();
        return;
      } else {
        reply.code(403).send('Forbidden');          
        return;
      }
    }
    catch (error) {
      reply.code(500).send('Internal Server Eror');
      return;
    }
  }

  module.queryFlights = async (req, reply) => {

    const getFlightByAirportsAndDepartureDate = async function (fromAirport, toAirport, flightDate) {
//      logger.info("getFlightByAirportsAndDepartureDate " + fromAirport + " " + toAirport + " " + flightDate);
      
      try {
        const flightsegment = await getFlightSegmentByOriginPortAndDestPort(fromAirport, toAirport)
//        logger.debug("flightsegment = " + JSON.stringify(flightsegment));
        if (!flightsegment) {
          return {flightsegment: null, flights: null}
        }
        const date = new Date(flightDate.getFullYear(), flightDate.getMonth(), flightDate.getDate(),0,0,0,0);
    
        var cacheKey = flightsegment._id + "-" + date.getTime();
        if (settings.useFlightDataRelatedCaching) {
          var flights = flightCache.get(cacheKey);
          if (flights) {
//            logger.debug("cache hit - flight search, key = " + cacheKey)
            return {flightsegment: flightsegment, flights: (flights == "NULL" ? null : flights)}
          }
//          logger.debug("cache miss - flight search, key = " + cacheKey + " flightCache size = " + flightCache.size())
        }
        const searchCriteria = {flightSegmentId: flightsegment._id, scheduledDepartureTime: date};
        console.log('looking for flights')
        try {
          const docs = await service.findBy(dataaccess.dbNames.flightName, searchCriteria);
          ("after cache miss - key = " + cacheKey + ", docs = " + JSON.stringify(docs));
    
          const docsEmpty = !docs || docs.length === 0;
        
          if (settings.useFlightDataRelatedCaching) {
            const cacheValue = (docsEmpty ? "NULL" : docs);
            ("about to populate the cache with flights key = " + cacheKey + " with value of " + JSON.stringify(cacheValue));
            flightCache.set(cacheKey, cacheValue, flightDataCacheTTL);
            ("after cache populate with key = " + cacheKey + ", flightCacheSize = " + flightCache.size())
          }
          return {flightsegment: flightsegment, flights: docs}
        }
        catch (err) {
//          logger.error("hit error:"+err);
          throw err            
        }
      }
      catch (error) {
//        logger.error("Hit error:"+error);
        throw error;
      }
    }

    const getFlightSegmentByOriginPortAndDestPort = async function (fromAirport, toAirport, callback /* error, flightsegment */) {
//      logger.info('getFlightSegmentByOriginPortAndDestPort')
      let segment;
      
      if (settings.useFlightDataRelatedCaching) {
        segment = flightSegmentCache.get(fromAirport+toAirport);
//        logger.info('segment:', segment)
        if (segment) {
          ("cache hit - flightsegment search, key = " + fromAirport+toAirport);
          return segment === "NULL" ? null : segment;
        }
        ("cache miss - flightsegment search, key = " + fromAirport+toAirport + ", flightSegmentCache size = " + flightSegmentCache.size());
      }
      console.log('looking for segments')
      try {
        const docs = await service.findBy(dataaccess.dbNames.flightSegmentName, {originPort: fromAirport, destPort: toAirport})
        segment = docs[0];
        if (segment === undefined) {
          segment = null;
        }
        if (settings.useFlightDataRelatedCaching) {
          ("about to populate the cache with flightsegment key = " + fromAirport+toAirport + " with value of " + JSON.stringify(segment));
          flightSegmentCache.set(fromAirport+toAirport, (segment == null ? "NULL" : segment), flightDataCacheTTL);
          ("after cache populate with key = " + fromAirport+toAirport + ", flightSegmentCacheSize = " + flightSegmentCache.size())
        }
        return segment
      }
      catch (error) {
        throw error
      }
    }
    
//    logger.info('querying flights');

    const fromAirport = req.body.fromAirport,
          toAirport = req.body.toAirport,
          fromDateWeb = new Date(req.body.fromDate),
          fromDate = new Date(fromDateWeb.getFullYear(), fromDateWeb.getMonth(), fromDateWeb.getDate()), // convert date to local timezone
          oneWay = (req.body.oneWay == 'true'),
          returnDateWeb = new Date(req.body.returnDate);
    let returnDate;
    if (!oneWay) {
      returnDate = new Date(returnDateWeb.getFullYear(), returnDateWeb.getMonth(), returnDateWeb.getDate()); // convert date to local timezone
    }
    try {
      const res = await getFlightByAirportsAndDepartureDate(fromAirport, toAirport, fromDate)
      const flightSegmentOutbound = res.flightsegment
      let flightsOutbound = res.flights
//      logger.info('flightsOutbound = ' + flightsOutbound);
      if (flightsOutbound) {
        for (let i = 0; i < flightsOutbound.length; i++) {
          flightsOutbound[i].flightSegment = flightSegmentOutbound;
        }
      } else {
        flightsOutbound = [];
      }
      if (!oneWay) {
        const result = await getFlightByAirportsAndDepartureDate(toAirport, fromAirport, returnDate)
        const flightSegmentReturn = result.flightsegment;
        let flightsReturn = result.flights;
//        logger.info('flightsReturn = ' + JSON.stringify(flightsReturn));
        if (flightsReturn) {
          for (let i = 0; i < flightsReturn.length; i++) {
            flightsReturn[i].flightSegment = flightSegmentReturn;
          }
        } else {
          flightsReturn = [];
        }
        const options = {"tripFlights":
          [
           {"numPages":1,"flightsOptions": flightsOutbound,"currentPage":0,"hasMoreOptions":false,"pageSize":10},
           {"numPages":1,"flightsOptions": flightsReturn,"currentPage":0,"hasMoreOptions":false,"pageSize":10}
          ], "tripLegs":2};
        reply.send(options);
      } else {
        const options = {"tripFlights":
          [
           {"numPages":1,"flightsOptions": flightsOutbound,"currentPage":0,"hasMoreOptions":false,"pageSize":10}
          ], "tripLegs":1};
        reply.send(options);
      }
    }
    catch (e) {
      console.log('error:', e)
    }
  }

  module.bookFlights = async (req, reply) => {
	// logger.debug('booking flights');
		
	const userid = req.body.userid,
		toFlight = req.body.toFlightId,
		retFlight = req.body.retFlightId,
		oneWay = (req.body.oneWayFlight == 'true');
		
	// logger.debug("toFlight:"+toFlight+",retFlight:"+retFlight);		
    const toBookingId = await bookFlight(toFlight, userid);
    let bookingInfo;
	if (!oneWay) {
	  const retBookingId = await bookFlight(retFlight, userid);
	  bookingInfo = {"oneWay":false,"returnBookingId":retBookingId,"departBookingId":toBookingId};
	} else {
	  bookingInfo = {"oneWay":true,"departBookingId":toBookingId};
	}
    reply
      .header('Cache-Control', 'no-cache')
      .send(bookingInfo);
  }

  const bookFlight = async (flightId, userid) => {
	const now = new Date(),
		docId = uuid.v4(),
		document = { "_id" : docId, "customerId" : userid, "flightId" : flightId, "dateOfBooking" : now };    
    try {
      await service.insertOne(dataaccess.dbNames.bookingName, document)
      return docId
    }
    catch (e) {
      console.log('error:', e)
      return null
    }
  }

  module.bookingsByUser = async (req, reply) => {
    // logger.debug('listing booked flights by user ' + req.params.user);
    try {
      const bookings = await getBookingsByUser(req.params.user)
      reply.send(bookings);
    }
    catch (err) {
      reply.code(500).send('Internal Server Error');
    }
  }

  const getBookingsByUser = async (username) => {
    return await service.findBy(dataaccess.dbNames.bookingName, {'customerId':username})
  }

  module.cancelBooking = async (req, reply) => {
    // logger.debug('canceling booking');	
    const number = req.body.number,
        userid = req.body.userid;
    try {
      await cancelBooking(number, userid)
      reply.send({'status':'success'});
    }
    catch (error) {
      reply.send({'status':'error'});
    }
  }

  const cancelBooking = async (bookingid, userid) => {
    return await service.remove(dataaccess.dbNames.bookingName, {'_id':bookingid, 'customerId':userid})
  }

  module.getCustomerById = async (req, reply) => {
    // logger.debug('getting customer by user ' + req.params.user);
    try {
      const customer = await getCustomer(req.params.user)
      reply.send(customer);
    }
    catch (err) {
      reply.code(500).send('Internal Server Error');
    }
  }

  const getCustomer = async (username) => {
    const result = await service.findOne(dataaccess.dbNames.customerName, username);
    return result;
  }

  module.putCustomerById = async (req, reply) => {
    // logger.debug('putting customer by user ' + req.params.user);
    try {
      const customer = await updateCustomer(req.params.user, req.body)
      reply.send(customer);
    }
    catch (err) {
      reply.code(500).send('Internal Server Error');
    }
  }

  const updateCustomer = async (login, customer) => {
	return await service.update(dataaccess.dbNames.customerName, customer)
  }

  return module;
}
