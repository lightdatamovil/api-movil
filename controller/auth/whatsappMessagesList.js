import { executeQuery } from "lightdata-tools";

export async function whatsappMessagesList(dbConnection) {
  const queryTexts =
    "SELECT texto FROM `mensajeria_app` WHERE superado = 0 ORDER BY tipo ASC;";
  const results = await executeQuery(dbConnection, queryTexts, []);

  return { body: results.map((row) => row.texto), message: "Mensajes traidos correctamente" };

}
