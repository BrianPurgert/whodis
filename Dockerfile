FROM node:16

COPY . .
RUN yarn

CMD ["yarn", "start"]