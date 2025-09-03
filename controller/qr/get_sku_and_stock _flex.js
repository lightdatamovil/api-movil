import { getTokenMLconMasParametros } from "../../src/funciones/getTokenMLconMasParametros.js";
import { getShipmentFromMLByTracking, getTitleAndImageFromMLByTracking, } from "../../src/funciones/getItemsFromMLByShipmentId.js";

export async function getSkuAndStockFlex(company, dataQr) {
    try {
        const token = await getTokenMLconMasParametros(3, 28, company.did);
        const shipment = await getShipmentFromMLByTracking(dataQr.id, token);

        // Generas un array de promesas que ya incluye title e image
        const itemsConDatos = await Promise.all(
            shipment.shipping_items.map(async ({ id, quantity }) => {
                const { title, thumbnail } = await getTitleAndImageFromMLByTracking(id, token);
                return {
                    id,
                    cantidad: quantity,
                    title,
                    image: thumbnail
                };
            })
        );

        return {
            body: itemsConDatos,
            message: "Datos obtenidos correctamente",
            success: true
        };
    } catch (error) {
        return { message: error.message, success: false };
    }
}
