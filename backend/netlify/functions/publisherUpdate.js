"use strict"

const headers = require('./headersCORS');
const redis = require('./redisDB');

const list = "bookstore";

exports.handler = async (event, context) => {

  if (event.httpMethod == "OPTIONS") {
    return { statusCode: 200, headers, body: "OK" };
  }

  try {
    const id = parseInt(event.path.split("/").reverse()[0]);
    const body = JSON.parse(event.body);

    // Mensaje JSON válido (comillas dobles) para que publisherTasks pueda reconstruirlo.
    await redis.rpush(list, JSON.stringify({ entity: "publisher", op: "update", data: { ...body, id } }));

    return { statusCode: 200, headers, body: 'OK'};
  } catch (error) {
    console.log(error);
    return { statusCode: 422, headers, body: JSON.stringify({ error: error.message }) };
  }
};
