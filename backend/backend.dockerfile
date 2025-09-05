FROM node:alpine
WORKDIR /home/app
COPY ./package.json /home/app/package.json
COPY ./package-lock.json /home/app/package-lock.json
RUN npm install
COPY . /home/app/
RUN tsc -b
EXPOSE 8001
CMD [ "node", "dist/index.js" ]