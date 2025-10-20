import { getProdDbConfig, executeQuery } from "../../db.js";
import mysql2 from 'mysql2';
import axios from "axios";
import { logRed } from "../../src/funciones/logsCustom.js";
import CustomException from "../../classes/custom_exception.js";

export async function uploadImage(company, shipmentId, userId, shipmentState, image, lineId) {
    const dbConfig = getProdDbConfig(company);
    const dbConnection = mysql2.createConnection(dbConfig);
    dbConnection.connect()

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

        await executeQuery(dbConnection, insertQuery, [shipmentId, response.data, server, userId, lineId, shipmentState]);

        // construir un bool si shipmentState es 5 || 10 en true
        const trueSiNadie = (shipmentState === 6 || shipmentState === 10);

        if (companyId == 334 && trueSiNadie) {
            console.log("Entro en la condicion especial de nadie JJJM");
            //insertar conFoto = 1 en envios historial
            const updateQuery = "UPDATE envios_historial SET conFoto = 1 WHERE didEnvio = ?  and elim = 0 and superado = 0 LIMIT 1";
            await executeQuery(dbConnection, updateQuery, [shipmentId]);
        }

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
    } finally {
        dbConnection.end();
    }
}
