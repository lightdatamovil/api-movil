import { LightdataORM } from "lightdata-tools";

export async function whatsappMessagesList(dbConnection) {
  const data = await LightdataORM.select({
    dbConnection,
    table: "mensajeria_app",
    where: {},
    select: "texto"
  });

  return {
    success: true,
    data,
    message: "Mensajes traídos correctamente",
    meta: { total: data.length }
  };
}
