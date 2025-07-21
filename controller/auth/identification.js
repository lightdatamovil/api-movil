import axios from 'axios';
import { logRed } from '../../src/funciones/logsCustom.js';
import CustomException from '../../classes/custom_exception.js';
import { executeQuery, getProdDbConfig } from '../../db.js';
import mysql2 from 'mysql2';

export async function identification(company) {
    const dbConfig = getProdDbConfig(company);
    const dbConnection = mysql2.createConnection(dbConfig);
    dbConnection.connect();
    const imageUrl = company.url + "/app-assets/images/logo/logo.png";
    const depotQuery =
        "SELECT id, latitud, longitud, nombre, cod  FROM `depositos`";
    const resultsFromDepotQuery = await executeQuery(
        dbConnection,
        depotQuery,
        [],
    );
    try {
        let imageBase64;
        try {
            const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
            const imageBuffer = Buffer.from(response.data, 'binary');
            imageBase64 = imageBuffer.toString('base64');
        } catch (error) {
            imageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8v+d+AAAAWElEQVRIDbXBAQEAAAABIP6PzgpV+QUwbGR2rqlzdkcNoiCqk73A0B9H5KLVmr4YdTiO8gaCGg8VmYWqJf2zxeI1icT24tFS0hDJ01gg7LMEx6qI3SCqA6Uq8gRJbAqioBgCRH0CpvI0dpjlGr6hQJYtsDRS0BQ==';
        }
        const hasAditionalPay = [];
        const granLogisticaPlans = [24, 35, 52];
        const hasBarcode = [211, 20, 55];
        const hasProductsQr = [274, 200];
        const depots = resultsFromDepotQuery.map(depot => ({
            id: depot.id,
            name: depot.nombre,
            latitude: depot.latitud,
            longitude: depot.longitud,
            abreviation: 'dep',
        }));
        const hasMultiDepot = hasAditionalPay.includes(company.did * 1) || granLogisticaPlans.includes(company.plan * 1);
        const result = {
            id: company.did * 1,
            plan: company.plan * 1,
            url: company.url,
            country: company.pais * 1,
            name: company.empresa,
            appPro: company.did == 4,
            colectaPro: false,
            obligatoryImageOnRegisterVisit: company.did == 108,
            obligatoryDniAndNameOnRegisterVisit: company.did == 97,
            depots: hasMultiDepot ? depots : depots.length > 0 ? [depots[0]] : [],
            image: imageBase64,
            hasBarcode: hasBarcode.includes(company.plan * 1),
            hasProductsQr: hasProductsQr
        };

        return result;

    } catch (error) {
        logRed(`Error en identification: ${error.stack}`);
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
