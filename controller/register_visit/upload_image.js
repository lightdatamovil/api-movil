import { CustomException, executeQuery, LightdataORM } from "lightdata-tools";
import { urlRegisterVisitUploadImage, axiosInstance } from "../../db.js";

export async function uploadImage({ db, req, company }) {
    const companyId = company.did;
    const { shipmentId, userId, shipmentState, image, lineId } = req.body;
    const reqBody = { imagen: image, didenvio: shipmentId, quien: userId, idEmpresa: companyId };
    const server = 1;

    const response = await axiosInstance.post(urlRegisterVisitUploadImage, reqBody, {
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

    await LightdataORM.insert({
        db,
        table: 'envios_fotos',
        data: {
            didEnvio: shipmentId,
            nombre: response.data,
            server: server,
            quien: userId,
            id_estado: lineId,
            estado: shipmentState
        },
        quien: userId
    });

    if (companyId == 334 && (shipmentState == 6 || shipmentState == 10)) {
        await LightdataORM.update({
            db,
            table: 'envios_historial',
            data: { conFoto: 1 },
            where: { didEnvio: shipmentId },
        })
        const updateQuery = "UPDATE envios_historial SET conFoto = 1 WHERE didEnvio = ?  and elim = 0 and superado = 0 LIMIT 1";
        await executeQuery({ db, query: updateQuery, values: [shipmentId] });
    }

    return {
        message: "Imagen subida correctamente",
    }
}
