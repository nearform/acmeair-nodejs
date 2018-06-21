# Acme Air in NodeJS 

An implementation of the Acme Air sample application for NodeJS.  This implementation can support multiple datastores, can run in several application modes, and can support running on a variety of runtime platforms including standalone bare metal  system, Virtual Machines, docker containers, IBM Bluemix, IBM Bluemix Container Service.

# Dependencies
[Node.js 8.11.3](https://nodejs.org/en/download/)

### Your choice of Database:
[MongoDB](http://www.mongodb.org) 
[Cloudant](http://cloudant.com) 

## How to get started
Make sure you have set the appropriate environment variables for your database of choice.

**example .env**
```
DBTYPE=mongo
MONGO_HOST=127.0.0.1
MONGO_PORT=27017
MONGO_POOLSIZE=10
```
Then run the following npm commands
```
npm install
npm start
```
You can now access the application at [http://localhost:9080/](http://localhost:9080/)

You can also run acmeair with [Docker](README_Docker.md)

### Environment Variables
Acmeair uses [fastify-env](https://github.com/fastify/fastify-env) to configure the backend API.  We set `dotenv: true` in our schema which enables the usage of [dotenv](https://github.com/motdotla/dotenv) in the plugin. Now when our application starts all of the values in our .env file will be available to the `determine-env` plugin.

Name | Default | Meaning
--- | --- | ---
DBTYPE | mongo | Currently handles `mongo` and `couch`. When running on Bluemix, dbtype is automactially discovered from the service the application is bound to.
MONGO_HOST||example: 127.0.0.1
MONGO_PORT||example: 27017
MONGO_POOLSIZE||example: 10
CLOUDANT_USERNAME||username listed in your service credentials *
CLOUDANT_PASSWORD||password listed in your service credentials *
CLOUDANT_URL||host listed in your service credentials *

*You can find this in your [IBM Cloudant Console](https://console.bluemix.net/services/) under service credentials

### Datastore Choices
The environment variable `DBTYPE` is used to determine the datastore. By default, the app will assume you have MongoDB. See under "More on configurations".

* [MongoDB](http://www.mongodb.org) 
* [Cloudant](http://cloudant.com) 

### Configuration for Loading Data
Default values are defined [here](settings.json)
```
"loader": {
	"maxCustomers": 10000,
	"maxDaysToScheduleFlights": 5,
	"maxFlightsPerDay": 1
}
```
Name | Default | Meaning
--- |:---:| ---
MAX_CUSTOMERS | 10000 |  number of customers
MAX_DAYS_TO_SCHEDULE_FLIGHTS | 5 | max number of days to schedule flights
MAX_FLIGHTS_PER_DAY | 1 | max flights per day
