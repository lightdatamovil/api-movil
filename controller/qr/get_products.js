import { getItemData } from "../../src/functions/ml/getItemData.js";
import { getSaleDetails } from "../../src/functions/ml/getSaleDetails.js";
import { getShipmentDetails } from "../../src/functions/ml/getShipmentDetails.js";
import { getToken } from "../../src/functions/ml/getTokenML.js";
import { CustomException, LightdataORM } from "lightdata-tools";

export async function getProductsFromShipment({ db, req }) {
    const { dataQr } = req.body;
    const shipmentId = dataQr.id;
    const senderId = dataQr.sender_id;

    const token = await getToken(senderId);

    const shipmentData = await getShipmentDetails(shipmentId, token);

    if (!shipmentData?.receiver_id) {
        throw new CustomException({
            title: "Error obteniendo productos del envío",
            message: "No se encontró el receptor del envío.",
        });
    }

    const saleData = await getSaleDetails(shipmentData.order_id, token);
    const orderItems = saleData.order_items || [];

    const items = [];
    for (const item of orderItems) {
        const itemData = item.item;
        const cantidadPedida = item.quantity;
        const descripcion = itemData.title;
        const sku = itemData.seller_sku;
        const idItem = itemData.id;
        const variationId = itemData.variation_id;

        let stock = 0;
        let imagen = "";

        if (variationId) {
            const dataItem = await getItemData(idItem, token);
            const variation = dataItem.variations?.find(v => v.id === variationId);
            if (variation) {
                stock = variation.available_quantity || 0;
                imagen = `https://http2.mlstatic.com/D_${variation.picture_ids?.[0]}-O.jpg`;
            }
        } else {
            const dataItem = await getItemData(idItem, token);
            imagen = dataItem.pictures?.[0]?.secure_url || "";
            stock = dataItem.available_quantity || 0;
        }

        const result = await LightdataORM.select({
            dbConnection: db,
            table: "fulfillment_productos",
            where: { sku },
            select: "ean",
        });

        items.push({
            imagen,
            stock,
            cantidadPedida,
            descripcion,
            variacion: "",
            sku,
            ean: result[0]?.ean || "Sin información",
        });
    }

    return {
        success: true,
        data: items,
        message: "Datos obtenidos correctamente",
        meta: {
            totalItems: items.length,
            shipmentId,
            senderId,
        },
    };
}
