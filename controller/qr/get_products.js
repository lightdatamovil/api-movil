import axios from 'axios';
import { logRed } from "../../src/funciones/logsCustom.js";
import CustomException from "../../classes/custom_exception.js";
import { getToken } from '../../src/funciones/getTokenML.js';

export async function getProductsFromShipment(dataQr) {
    try {
        const shipmentId = dataQr.id;

        const senderid = dataQr.sender_id;

        const token = await getToken(senderid);

        const Ashipment = await getShipmentDetails(shipmentId, token);

        if (Ashipment.receiver_id) {
            const Aventa = await getSaleDetails(Ashipment.order_id, token);
            const Aorder_items = Aventa.order_items || [];

            const Aitems = [];
            for (const Aitem of Aorder_items) {
                const itemdata = Aitem.item;
                const cantidadpedida = Aitem.quantity;
                const descripcion = itemdata.title;
                const sku = itemdata.seller_sku;
                const iditem = itemdata.id;
                const variation_id = itemdata.variation_id;

                let stock = 0;
                let imagen = '';

                if (variation_id) {
                    const dataitem = await getItemData(iditem, token);
                    const Avariations = dataitem.variations;
                    for (const variant of Avariations) {
                        if (variant.id === variation_id) {
                            stock = variant.available_quantity;
                            imagen = `https://http2.mlstatic.com/D_${variant.picture_ids[0]}-O.jpg` || '';
                        }
                    }
                } else {
                    const dataitem = await getItemData(iditem, token);
                    imagen = dataitem.pictures[0]?.secure_url || '';
                    stock = dataitem.available_quantity;
                }

                Aitems.push({ imagen, stock, cantidadpedida, descripcion, variacion: "", sku });
            }

            return Aitems;
        } else {
            throw new CustomException({
                title: 'Error obteniendo productos del envío',
                message: 'No se encontró el receptor del envío',
            });
        }
    } catch (error) {

        if (error instanceof CustomException) {
            throw error;
        }
        throw new CustomException({
            title: 'Error obteniendo productos del envío',
            message: error.message,
            stack: error.stack
        });
    }

}

async function getShipmentDetails(shipmentId, token) {
    const url = `https://api.mercadolibre.com/shipments/${shipmentId}?access_token=${token}`;

    try {
        const response = await axios.get(url, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        return response.data;
    } catch (error) {
        logRed(`Error obteniendo detalles del envío: ${error.stack}`);
        if (error instanceof CustomException) {
            throw error;
        }
        throw new CustomException({
            title: 'Error obteniendo detalles del envío',
            message: error.message,
            stack: error.stack
        });
    }
}

async function getSaleDetails(idventa, token) {
    const url = `https://api.mercadolibre.com/orders/${idventa}?access_token=${token}`;
    const response = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
    return response.data;
}

async function getItemData(iditem, token) {
    const url = `https://api.mercadolibre.com/items/${iditem}?access_token=${token}`;
    const response = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
    return response.data;
}

