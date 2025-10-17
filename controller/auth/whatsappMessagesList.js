import { LightdataORM } from "lightdata-tools";

export async function whatsappMessagesList(dbConnection) {
  const results = await LightdataORM.select({
    dbConnection,
    table: "mensajeria_app",
    where: {},
    select: "texto"
  });

  const data = results.map(r => r.texto);

  return {
    success: true,
    data,
    message: "Mensajes traídos correctamente",
    meta: { total: data.length }
  };
}
