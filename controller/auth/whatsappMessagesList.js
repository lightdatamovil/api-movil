import { LightdataORM } from "lightdata-tools";

export async function whatsappMessagesList({ db }) {
  const data = await LightdataORM.select({
    db,
    table: "mensajeria_app",
    select: "texto"
  });

  return {
    success: true,
    data,
    message: "Mensajes traídos correctamente",
    meta: { total: data.length }
  };
}
