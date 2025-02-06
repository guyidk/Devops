# Use an official Node.js runtime as a parent image
FROM node:20
# Set the working directory in the container
WORKDIR /usr/src/app
# Copy package.json and package-lock.json to the working directory
COPY package*.json ./
# Install app dependencies
RUN npm install
# Install PM2 globally
RUN npm install pm2 -g
ENV PM2_PUBLIC_KEY y23kbhh13nzxsn2
ENV PM2_SECRET_KEY c466pxy9vt66que
# Bundle app source
COPY . .
# Expose the port your app runs on
EXPOSE 5500
# Define the command to run your app
CMD ["pm2-runtime", "index.js"]