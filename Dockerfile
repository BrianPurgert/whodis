FROM node:16

# Needed for gyp for @discordjs/opus
RUN apt-get update
RUN apt install python -y

COPY . .
RUN yarn

CMD ["yarn", "start"]