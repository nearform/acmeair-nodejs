# Acmeair in Docker
This runs the same application, just containerized.
# Dependencies
Verify you have [Docker](https://docs.docker.com/install/overview/) installed 
### Getting Started
The command below will pull the latest MongoDB container and build Acmeair based on our Dockerfile.  Once the command finishes you should see two containers running.
```
docker-compose up -d
```
Once the command finishes you should see two containers running.
```
$ docker ps
CONTAINER ID    IMAGE   PORTS   NAMES
c386c4ebcea6    mongo:latest    ...0.0.0.0:27017->27017/tcp   acmeair-mongo
6df5feb73455    acmeair:latest  ...0.0.0.0:9080->9080/tcp     acmeair-backend
```
### Build Acmeair
```
docker build . -t acmeair:latest
```

### Mongo
If you are running mongo in a container using our `docker-compose` you will need to modify your .env file to what is below

```
MONGO_HOST=acmeair-mongo
```