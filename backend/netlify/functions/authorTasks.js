"use strict"

const headers = require('./headersCORS');
const redis = require('./redisDB');

const list = "bookstore";
const entity = "author";

exports.handler = async (event, context) => {

  if (event.httpMethod == "OPTIONS") {
    return { statusCode: 200, headers, body: "OK" };
  }

  // URL del propio sitio: Netlify la define en process.env.URL.
  const url = (process.env.URL || 'https://' + event.headers.host) + '/.netlify/functions/';

  try {
    // Recorre la lista completa, de izquierda a derecha (orden de llegada).
    const items = await redis.lrange(list, 0, -1);
    let processed = 0;
    let failed = null;

    for (const raw of items) {
      let request;
      try {
        request = JSON.parse(raw);
      } catch (e) {
        continue; // No es un mensaje válido: se deja en la lista.
      }
      if (request.entity !== entity) continue; // Le corresponde a otra función de tareas.

      const data = request.data || {};
      let response;
      switch (request.op) {
        case "delete":
          response = await fetch(url+'authorDeleteBatch/'+data.id, {
            method: "DELETE",
            headers: {"Content-type": "application/json"}});
          break;
        case "update":
          response = await fetch(url+'authorUpdateBatch/'+data.id, {
            headers: {"Content-type": "application/json"},
            method: "PUT", body: JSON.stringify(data)});
          break;
        case "insert":
          response = await fetch(url+'authorInsertBatch', {
            headers: {"Content-type": "application/json"},
            method: "POST", body: JSON.stringify(data)});
          break;
      }

      if (!response || !response.ok) {
        // Se detiene en el primer fallo: este mensaje y los siguientes de la
        // entidad se quedan en la lista para reintentarlos en orden.
        failed = { op: request.op, id: data.id,
                   error: response ? await response.text() : 'operación desconocida' };
        console.log(failed);
        break;
      }

      // LREM compara el string exacto: se usa el original devuelto por LRANGE.
      await redis.lrem(list, 1, raw);
      processed++;
    }

    const result = failed ? { processed, failed } : { processed };
    return { statusCode: 200, headers, body: JSON.stringify(result)};
  } catch (error) {
    console.log(error);
    return { statusCode: 422, headers, body: JSON.stringify({ error: error.message }) };
  }
};
