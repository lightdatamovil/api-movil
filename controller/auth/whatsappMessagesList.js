import mysql2 from "mysql2";
import { executeQuery, getProdDbConfig } from "../../db.js";
import CustomException from "../../classes/custom_exception.js";

export async function whatsappMessagesList(company, startTime) {
  const dbConfig = getProdDbConfig(company);
  const dbConnection = mysql2.createConnection(dbConfig);
  dbConnection.connect();

  try {
    const queryTexts =
      "SELECT texto FROM `mensajeria_app` WHERE superado = 0 ORDER BY tipo ASC;";
    const results = await executeQuery(dbConnection, queryTexts, []);
    return results.map((row) => row.texto);
  } catch (error) {
    if (error instanceof CustomException) {
      throw error;
    }
    throw new CustomException({
      title: "Error en la lista de mensajes de WhatsApp",
      message: error.message,
      stack: error.stack,
    });
  } finally {
    dbConnection.end();
  }
}
