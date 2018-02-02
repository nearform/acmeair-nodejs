/*******************************************************************************
* Copyright (c) 2015 IBM Corp.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*    http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*******************************************************************************/

var Fastify = require('fastify')
  , fs = require('fs')
  , log4js = require('log4js')
  , path = require('path');
var settings = JSON.parse(fs.readFileSync('settings.json', 'utf8'));

var logger = log4js.getLogger('app');
logger.setLevel(settings.loggerLevel);

// disable process.env.PORT for now as it cause problem on mesos slave
var port = (process.env.VMC_APP_PORT || process.env.VCAP_APP_PORT || settings.port);
var host = (process.env.VCAP_APP_HOST || 'localhost');

logger.info("host:port=="+host+":"+port);

var authService;
var authServiceLocation = process.env.AUTH_SERVICE;
if (authServiceLocation)
{
	logger.info("Use authservice:"+authServiceLocation);
	var authModule;
	if (authServiceLocation.indexOf(":")>0) // This is to use micro services
		authModule = "acmeairhttp";
	else
		authModule= authServiceLocation;

	authService = new require('./'+authModule+'/index.js')(settings);
	if (authService && "true"==process.env.enableHystrix) // wrap into command pattern
	{
		logger.info("Enabled Hystrix");
		authService = new require('./acmeaircmd/index.js')(authService, settings);
	}
}

var dbtype = process.env.dbtype || "mongo";

// Calculate the backend datastore type if run inside BLuemix or cloud foundry
if(process.env.VCAP_SERVICES){
	var env = JSON.parse(process.env.VCAP_SERVICES);
      	logger.info("env: %j",env);
	var serviceKey = Object.keys(env)[0];
	if (serviceKey && serviceKey.indexOf('cloudant')>-1)
		dbtype="cloudant";
	else if (serviceKey && serviceKey.indexOf('redis')>-1)
		dbtype="redis";
}
logger.info("db type=="+dbtype);

var routes = new require('./routes/index.js')(dbtype, authService, settings);
var loader = new require('./loader/loader.js')(routes, settings);
var schema = require('./routes/schema.js');

// Setup fastify
var fastify = Fastify({ logger: settings.useDevLogger ? true : false }) // log every request to the console in development

fastify.register(require('fastify-static'), {
  root: path.join(__dirname, 'public') // set the static files location /public/img will be /img for users
});

fastify.register(require('fastify-cookie'))
fastify.register(require('fastify-formbody'))

function router (fastify, opts, next) {
	fastify.post('/login', { schema: schema.login }, login);
	fastify.get('/login/logout', { schema: schema.logout }, logout);
	fastify.post('/flights/queryflights', { schema: schema.queryFlights, beforeHandler: routes.checkForValidSessionCookie }, routes.queryflights);
	fastify.post('/bookings/bookflights', { schema: schema.bookFlights, beforeHandler: routes.checkForValidSessionCookie }, routes.bookflights);
	fastify.post('/bookings/cancelbooking', { schema: schema.cancelBooking, beforeHandler: routes.checkForValidSessionCookie }, routes.cancelBooking);
	fastify.get('/bookings/byuser/:user', { schema: schema.bookingsByUser, beforeHandler: routes.checkForValidSessionCookie }, routes.bookingsByUser);
	fastify.get('/customer/byid/:user', { schema: schema.getCustomerById, beforeHandler: routes.checkForValidSessionCookie }, routes.getCustomerById);
	fastify.post('/customer/byid/:user', { schema: schema.putCustomerById, beforeHandler: routes.checkForValidSessionCookie }, routes.putCustomerById);
	fastify.get('/config/runtime', {}, routes.getRuntimeInfo);
	fastify.get('/config/dataServices', {}, routes.getDataServiceInfo);
	fastify.get('/config/activeDataService', {}, routes.getActiveDataServiceInfo);
	fastify.get('/config/countBookings', {}, routes.countBookings);
	fastify.get('/config/countCustomers', {}, routes.countCustomer);
	fastify.get('/config/countSessions', {}, routes.countCustomerSessions);
	fastify.get('/config/countFlights', {}, routes.countFlights);
	fastify.get('/config/countFlightSegments', {}, routes.countFlightSegments);
	fastify.get('/config/countAirports', {}, routes.countAirports);
	// fastify.get('/loaddb', startLoadDatabase);
	fastify.get('/loader/load', {}, startLoadDatabase);
	fastify.get('/loader/query', {}, loader.getNumConfiguredCustomers);
	fastify.get('/checkstatus', {}, checkStatus);

	next()
}

if (authService && authService.hystrixStream)
	fastify.get('/rest/api/hystrix.stream', authService.hystrixStream);


// REGISTER OUR ROUTES so that all of routes will have prefix
fastify.register(router, {
	prefix: settings.contextRoot
})


// Only initialize DB after initialization of the authService is done
var initialized = false;
var serverStarted = false;

if (authService && authService.initialize)
{
	authService.initialize(function(){
		initDB();
	});
}
else
	initDB();

function checkStatus(req, reply) {
	reply.send("OK");
}

function login(req, reply) {
	if (!initialized) {
		logger.info("please wait for db connection initialized then trigger again.");
		initDB();
		reply.code(403).send('Forbidden');
	} else {
		routes.login(req, reply);
	}
}

function logout(req, reply){
	if (!initialized)
     {
		logger.info("please wait for db connection initialized then trigger again.");
		initDB();
		reply.code(400).send('Bad request');
	}else
		routes.logout(req, reply);
}


function startLoadDatabase(req, reply){
	if (!initialized)
     	{
		logger.info("please wait for db connection initialized then trigger again.");
		initDB();
		reply.code(400).send('Bad request');
	}else
		loader.startLoadDatabase(req, reply);
}

function initDB(){
	if (initialized ) return;
	routes.initializeDatabaseConnections(function(error) {
		if (error) {
			logger.info('Error connecting to database - exiting process: '+ error);
			// Do not stop the process for debug in container service
			//process.exit(1);
		} else {
			initialized =true;
		}

		logger.info("Initialized database connections");
		startServer();
	});
}


function startServer() {
	if (serverStarted) return;
	serverStarted = true;
	fastify.listen(port, function (err) {
    if (err) {
      logger.error("Error starting server " + err);
      process.exit(1)
    }
  });
	logger.info("Fastify server listening on port " + port);
}
