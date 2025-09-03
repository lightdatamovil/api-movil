import axios from 'axios';
import CustomException from '../../classes/custom_exception.js';
import { executeQuery, getProdDbConfig } from '../../db.js';
import mysql2 from 'mysql2';
import LogisticaConf from '../../classes/logisticas_conf.js';

export async function identification(company) {
    const dbConfig = getProdDbConfig(company);
    const dbConnection = mysql2.createConnection(dbConfig);
    dbConnection.connect();


    const depotQuery =
        "SELECT id, latitud, longitud, nombre, cod  FROM `depositos`";
    const resultsFromDepotQuery = await executeQuery(dbConnection, depotQuery, [],);

    try {
        let imageBase64;

        try {
            const imageUrl = company.url + "/app-assets/images/logo/logo.png";
            const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
            const imageBuffer = Buffer.from(response.data, 'binary');
            imageBase64 = imageBuffer.toString('base64');
        } catch (error) {
            imageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8v+d+AAAAWElEQVRIDbXBAQEAAAABIP6PzgpV+QUwbGR2rqlzdkcNoiCqk73A0B9H5KLVmr4YdTiO8gaCGg8VmYWqJf2zxeI1icT24tFS0hDJ01gg7LMEx6qI3SCqA6Uq8gRJbAqioBgCRH0CpvI0dpjlGr6hQJYtsDRS0BQ==';
        }

        const depots = resultsFromDepotQuery.map(depot => ({
            id: depot.id,
            name: depot.nombre,
            latitude: depot.latitud,
            longitude: depot.longitud,
            abreviation: 'dep',
        }));

        const result = {
            id: company.did * 1,
            plan: company.plan * 1,
            url: company.url,
            country: company.pais * 1,
            name: company.empresa,
            appPro: LogisticaConf.hasAppPro.includes(company.did * 1),
            colectaPro: false,
            obligatoryImageOnRegisterVisit: LogisticaConf.hasObligatoryImageOnRegisterVisitEnabled(company.did),
            obligatoryDniAndNameOnRegisterVisit: LogisticaConf.hasObligatoryDniAndNameOnRegisterVisitEnabled(company.did),
            depots: LogisticaConf.hasMultiDepotEnabled(company.did) ? depots : depots.length > 0 ? [depots[0]] : [],
            image: imageBase64,
            hasBarcode: LogisticaConf.hasBarcodeEnabled(company.did),
            hasProductsQr: LogisticaConf.hasProductsQrEnabled(company.did),
            hasEnvioFoto: LogisticaConf.hasEnvioFotoEnabled(company.did),
        };

        return result;

    } catch (error) {
        if (error instanceof CustomException) {
            throw error;
        }
        throw new CustomException({
            title: 'Error en identificación',
            message: error.message,
            stack: error.stack
        });
    } finally {
        dbConnection.end();
    }
}
