"use strict"

const sql = require('./db');
const headers = require('./headersCORS');

// Convierte "" o valores no numéricos en NULL para las columnas INTEGER.
const num = (value) => (value === "" || value == null || isNaN(value)) ? null : parseInt(value);

exports.handler = async (event, context) => {

  if (event.httpMethod == "OPTIONS") {
    return { statusCode: 200, headers, body: "OK" };
  }

  try {
    const p = JSON.parse(event.body);

    // Idempotente: si el mensaje se procesa dos veces, la fila queda igual.
    await sql`INSERT INTO publishers (id, publisher, country, founded, genere)
      VALUES (${num(p.id)}, ${p.publisher}, ${p.country}, ${num(p.founded)}, ${p.genere})
      ON CONFLICT (id) DO UPDATE SET
        publisher = EXCLUDED.publisher, country = EXCLUDED.country,
        founded = EXCLUDED.founded, genere = EXCLUDED.genere`;

    return { statusCode: 200, headers, body: 'OK'};
  } catch (error) {
    console.log(error);
    return { statusCode: 422, headers, body: JSON.stringify({ error: error.message }) };
  }
};
