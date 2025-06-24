import axios from 'axios';
import { logRed, logYellow } from '../../src/funciones/logsCustom.js';
import CustomException from '../../classes/custom_exception.js';
import { connectionsPools, executeQuery, executeQueryFromPool, getProdDbConfig } from '../../db.js';
import mysql2 from 'mysql2';
import { connect } from 'amqplib';

export async function identification(company) {
    let pool = connectionsPools[company.did];
    const imageUrl = company.url + "/app-assets/images/logo/logo.png";
    const depotQuery =
        "SELECT id, latitud, longitud, nombre, cod  FROM `depositos`";
    const resultsFromDepotQuery = await executeQueryFromPool(
        pool,
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
            depots: resultsFromDepotQuery.map(depot => ({
                id: depot.id,
                name: depot.nombre,
                latitude: depot.latitud,
                longitude: depot.longitud,
                abreviation: 'dep',
            })),
            image: imageBase64,
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
    }
}
