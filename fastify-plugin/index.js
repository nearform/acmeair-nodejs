'use strict'

const fp = require('fastify-plugin')

const fs = require('fs'),
      log4js = require('log4js'),
      settings = JSON.parse(fs.readFileSync('settings.json', 'utf8')),
      schema = require('../routes/schema.js'),
      Service = require('./service')


const logger = log4js.getLogger('app');
logger.setLevel(settings.loggerLevel);

// disable process.env.PORT for now as it cause problem on mesos slave
const port = (process.env.VMC_APP_PORT || process.env.VCAP_APP_PORT || settings.port);
const host = (process.env.VCAP_APP_HOST || 'localhost');

logger.info("host:port=="+host+":"+port);

let authService,
    authModule;
const authServiceLocation = process.env.AUTH_SERVICE;
if (authServiceLocation) {
	logger.info("Use authservice:"+authServiceLocation);
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

let dbtype = process.env.dbtype || "mongo";

// Calculate the backend datastore type if run inside BLuemix or cloud foundry
if (process.env.VCAP_SERVICES) {
	var env = JSON.parse(process.env.VCAP_SERVICES);
      	logger.info("env: %j",env);
	var serviceKey = Object.keys(env)[0];
	if (serviceKey && serviceKey.indexOf('cloudant')>-1)
		dbtype="cloudant";
	else if (serviceKey && serviceKey.indexOf('redis')>-1)
		dbtype="redis";
}
// XXX
dbtype = 'cassandra'
logger.info("db type=="+dbtype);

//let initialized = false

/*
 * This is the login plugin
 * A plugin is a self contained component, so we need to made some operations:
 * - check the configuration (fastify-env)
 * - connect to mongodb (fastify-mongodb)
 * - configure JWT library (fastify-jwt)
 * - build business login objects
 * - define the HTTP API
 */
module.exports = async function (fastify, opts) {
  // This is a plugin registration inside a plugin
  // fastify-env checks and coerces `opts` and save the result in `fastify.config`
  // See https://github.com/fastify/fastify-env
  fastify.register(require('fastify-env'), {
    schema: {
      type: 'object',
      required: [ 'dbtype' ],
      properties: {
        dbtype: { type: 'string', default: 'mongo' },
        VMC_APP_PORT: {type: 'string'},
        VCAP_APP_PORT: {type: 'string'},
        VCAP_APP_HOST: {type: 'string', default: 'localhost'},
        AUTH_SERVICE: {type: 'string'}
      }
    },
    data: opts
  })
  logger.info('registered environment')

  // This registration is made in order to wait the previous one
  // `avvio` (https://github.com/mcollina/avvio), the startup manager of `fastify`,
  // registers this plugin only when the previous plugin has been registered
  fastify.register(async function (fastify, opts) {
    logger.info('config:', fastify.config)
    // We need a connection database:
    // `fastify-mongodb` makes this connection and store the database instance into `fastify.mongo.db`
    // See https://github.com/fastify/fastify-mongodb
//    const dbtype = fastify.config['dbtype']
    const dbtype = 'cassandra'
    if ('mongo' === dbtype) {
      fastify.register(require('fastify-mongodb'), {
        url: `mongodb://${settings.mongoHost}:${settings.mongoPort}/acmeair`
      })
      // Add another business logic object to `fastify` instance
      // Again, `fastify-plugin` is used in order to access to `fastify.service` from outside
      fastify.register(fp(async function (fastify, opts) {
        const service = new Service(fastify.mongo, require('../dataaccess/mongo')(fastify.mongo))
        fastify.decorate('service', service)
      }))
    } else if ('redis' === dbtype) {
      // XXX - this is wrong
      fastify.register(require('fastify-redis'), {
        host: settings.redisHost || '127.0.0.1',
        port: settings.redisPort || 6379
      })
      // Add another business logic object to `fastify` instance
      // Again, `fastify-plugin` is used in order to access to `fastify.service` from outside
      fastify.register(fp(async function (fastify, opts) {
        const service = new Service(fastify.redis)
        fastify.decorate('service', service)
      }))
    } else if ('cassandra' === dbtype) {
      // XXX - this is wrong
      fastify.register(require('fastify-cassandra'), {
        url: settings.cassandraHost || '127.0.0.1',
        name: settings.cassandraDbName || null,
        contactPoints: ['127.0.0.1'],
        keyspace: 'acmeair_keyspace'
      })
      logger.info('called register fastify-cassandra')
      // Add another business logic object to `fastify` instance
      // Again, `fastify-plugin` is used in order to access to `fastify.service` from outside
      fastify.register(fp(async function (fastify, opts) {
        const service = new Service(fastify.cassandra)
        fastify.decorate('service', service)
      }))
    }

    // Natively, `fastify` only accepts JSON, `fastify-formbody` will help us to 
    // process `Content-Type: application/x-www-form-urlencoded`
    fastify.register(require('fastify-formbody'))

    // The `fastify-cookie` plugin is obviously for handling HTTP cookies
    fastify.register(require('fastify-cookie'), err => {
      if (err) throw err
    })

    // Finally we're registering out routes
    fastify.register(registerRoutes)
  })
}

async function registerRoutes (fastify, opts) {
  const { service } = fastify
  console.log('fastify:', service.provider)

  // XXX This is mongo-specific and it has to be portable
  const dataaccess = require('../dataaccess/mongo')(fastify.mongo.db)

  const loader = new require('../loader/loader.js')(dataaccess, settings)
  const routes = new require('../routes')(dataaccess, service, settings)

  fastify.post('/login', { schema: schema.login }, routes.login)
  fastify.get('/login/logout', routes.logout)
  fastify.get('/loader/load', {}, async (req, reply) => {
    loader.startLoadDatabase(req, reply);
  });
  fastify.get('/loader/query', {}, loader.getNumConfiguredCustomers);
  fastify.get('/config/runtime', {}, routes.configRuntime);
  fastify.get('/config/dataServices', {}, routes.configDataServices);
  fastify.get('/config/activeDataService', {}, async (req, reply) => {
    reply.send(dbtype);
  });
  fastify.get('/config/countCustomers', {}, routes.countCustomers);
  fastify.get('/config/countSessions', {}, routes.countSessions);
  fastify.get('/config/countFlights', {}, routes.countFlights);
  fastify.get('/config/countFlightSegments', {}, routes.countFlightSegments);
  fastify.get('/config/countBookings', {}, routes.countBookings);
  fastify.get('/config/countAirports', {}, routes.countAirports);
  fastify.post('/flights/queryflights',
    { schema: schema.queryFlights, beforeHandler: routes.checkForValidSessionCookie }, 
    routes.queryFlights);
  fastify.post('/bookings/bookflights',
    { schema: schema.bookFlights, beforeHandler: routes.checkForValidSessionCookie },
    routes.bookFlights);
  fastify.get('/bookings/byuser/:user',
    { schema: schema.bookingsByUser, beforeHandler: routes.checkForValidSessionCookie },
    routes.bookingsByUser);
  fastify.post('/bookings/cancelbooking',
    { schema: schema.cancelBooking, beforeHandler: routes.checkForValidSessionCookie },
    routes.cancelBooking);
  fastify.get('/customer/byid/:user',
    { schema: schema.getCustomerById, beforeHandler: routes.checkForValidSessionCookie },
    routes.getCustomerById);
  fastify.post('/customer/byid/:user',
    { schema: schema.putCustomerById, beforeHandler: routes.checkForValidSessionCookie },
    routes.putCustomerById);
}
