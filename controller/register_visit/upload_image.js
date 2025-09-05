import axios from "axios";
import { CustomException, executeQuery } from "lightdata-tools";

export async function uploadImage(dbConnection, req, company) {
    const companyId = company.did;
    const { shipmentId, userId, shipmentState, image, lineId } = req.body;
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
    return {
        message: "Imagen subida correctamente",
    }
}
