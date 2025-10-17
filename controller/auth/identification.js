import { LightdataORM, LogisticaConfig, logRed } from "lightdata-tools";
import { axiosInstance } from "../../db.js";

export async function identification(dbConnection, company) {
    const depotsResult = await LightdataORM.select({
        dbConnection,
        table: "depositos",
        select: "id, latitud, longitud, nombre, cod"
    });

    let imageBase64;

    try {
        const imageUrl = `${company.url}/app-assets/images/logo/logo.png`;
        const response = await axiosInstance.get(imageUrl, { responseType: "arraybuffer" });
        const imageBuffer = Buffer.from(response.data, "binary");
        imageBase64 = imageBuffer.toString("base64");
    } catch (error) {
        logRed(error.message);
        imageBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8v+d+AAAAWElEQVRIDbXBAQEAAAABIP6PzgpV+QUwbGR2rqlzdkcNoiCqk73A0B9H5KLVmr4YdTiO8gaCGg8VmYWqJf2zxeI1icT24tFS0hDJ01gg7LMEx6qI3SCqA6Uq8gRJbAqioBgCRH0CpvI0dpjlGr6hQJYtsDRS0BQ==";
    }

    const depots = depotsResult.map(d => ({
        id: d.id,
        name: d.nombre,
        latitude: d.latitud,
        longitude: d.longitud,
        abreviation: "dep"
    }));

    const messagesResult = await LightdataORM.select({
        dbConnection,
        table: "mensajeria_app",
        select: "texto"
    });

    const messages = messagesResult.map(m => m.texto);

    const data = {
        id: company.did * 1,
        plan: company.plan * 1,
        url: company.url,
        country: company.pais * 1,
        name: company.empresa,
        appPro: LogisticaConfig.hasAppPro.includes(company.did * 1),
        colectaPro: false,
        obligatoryImageOnRegisterVisit: LogisticaConfig.hasObligatoryImageOnRegisterVisitEnabled(company.did),
        obligatoryDniAndNameOnRegisterVisit: LogisticaConfig.hasObligatoryDniAndNameOnRegisterVisitEnabled(company.did),
        depots: LogisticaConfig.hasMultiDepotEnabled(company.did)
            ? depots
            : depots.length > 0
                ? [depots[0]]
                : [],
        image: imageBase64,
        hasBarcode: LogisticaConfig.hasBarcodeEnabled(company.did),
        hasProductsQr: LogisticaConfig.hasProductsQrEnabled(company.did),
        hasEnvioFoto: LogisticaConfig.hasEnvioFotoEnabled(company.did),
        adminsCanRegisterVisits: LogisticaConfig.adminsCanRegisterVisitEnabled(company.did),
        driversWithoutProcessingPlant: LogisticaConfig.driversWithoutProcessingPlantEnabled(company.did),
        whatsappMessages: messages
    };

    return {
        success: true,
        data,
        message: "Empresa identificada correctamente",
        meta: { depots: depots.length, messages: messages.length }
    };
}
