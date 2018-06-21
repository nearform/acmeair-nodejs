FROM node:8.11.3

COPY package.json /tmp
WORKDIR /tmp
RUN npm install 

# copy code and delete local modules
COPY . /opt/app-root/src
# remove local node_modules
RUN rm -rf /usr/src/app/node_modules
# copy in our dependency install from above.
RUN cp -r /tmp/node_modules/ /opt/app-root/src/node_modules

EXPOSE 9080

WORKDIR /opt/app-root/src
CMD ["npm", "run", "start"]