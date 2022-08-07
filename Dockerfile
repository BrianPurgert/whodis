FROM node:16

COPY . .
RUN yarn

ARG 
CMD ["yarn", "start"]