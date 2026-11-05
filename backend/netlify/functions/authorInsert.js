"use strict"

const headers = require('./headersCORS');
const redis = require('./redisDB');

const list = "bookstore";

exports.handler = async (event, context) => {

  if (event.httpMethod == "OPTIONS") {
    return { statusCode: 200, headers, body: "OK" };
  }

  try {
    const data = JSON.parse(event.body);

    // Mensaje JSON válido (comillas dobles) para que authorTasks pueda reconstruirlo.
    await redis.rpush(list, JSON.stringify({ entity: "author", op: "insert", data }));

    return { statusCode: 200, headers, body: 'OK'};
  } catch (error) {
    console.log(error);
    return { statusCode: 422, headers, body: JSON.stringify({ error: error.message }) };
  }
};
