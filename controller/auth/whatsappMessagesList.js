import { connectionsPools, executeQueryFromPool } from "../../db.js";
import { logRed, logYellow } from "../../src/funciones/logsCustom.js";
import CustomException from "../../classes/custom_exception.js";

export async function whatsappMessagesList(company, startTime) {
  let pool = connectionsPools[company.did];

  logYellow(`${performance.now() - startTime} ms - Conexión a la base de datos establecida`);
  try {
    const queryTexts =
      "SELECT texto FROM `mensajeria_app` WHERE superado = 0 ORDER BY tipo ASC;";
    const results = await executeQueryFromPool(pool, queryTexts, []);
    logYellow(`${performance.now() - startTime} ms - Consulta de mensajes de WhatsApp ejecutada`);
    return results.map((row) => row.texto);
  } catch (error) {
    logRed(`Error en whatsappMessagesList: ${error.stack}`);
    if (error instanceof CustomException) {
      throw error;
    }
    throw new CustomException({
      title: "Error en la lista de mensajes de WhatsApp",
      message: error.message,
      stack: error.stack,
    });
  }
}

