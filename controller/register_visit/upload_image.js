import { getProdDbConfig, executeQuery, executeQueryFromPool, connectionsPools } from "../../db.js";
import mysql2 from 'mysql2';
import axios from "axios";
import { logRed } from "../../src/funciones/logsCustom.js";
import CustomException from "../../classes/custom_exception.js";

export async function uploadImage(company, shipmentId, userId, shipmentState, image, lineId) {
    const pool = connectionsPools[company.did];

    try {

        const companyId = company.did;
        const reqBody = { imagen: image, didenvio: shipmentId, quien: userId, idEmpresa: companyId };
        const server = 1;
        const url = 'https://files.lightdata.app/upload.php';

        const response = await axios.post(url, reqBody, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.data) {
            throw new CustomException({
                title: 'Error en subida de imagen',
                message: 'No se pudo subir la imagen',
            });
        }

        const insertQuery = "INSERT INTO envios_fotos (didEnvio, nombre, server, quien, id_estado, estado) VALUES (?, ?, ?, ?, ?, ?)";

        await executeQueryFromPool(pool, insertQuery, [shipmentId, response.data, server, userId, lineId, shipmentState]);
        return {
            message: "Imagen subida correctamente",

        }
    } catch (error) {
        logRed(`Error en uploadImage: ${error.stack}`);
        if (error instanceof CustomException) {
            throw error;
        }
        throw new CustomException({
            title: 'Error en subida de imagen',
            message: error.message,
            stack: error.stack
        });
    }
}
