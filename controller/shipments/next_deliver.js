import { executeQuery, getProdDbConfig } from '../../db.js';
import mysql2 from 'mysql2';
import { logRed } from '../../src/funciones/logsCustom.js';
import CustomException from '../../classes/custom_exception.js';
import { getFechaConHoraLocalDePais } from '../../src/funciones/getFechaConHoraLocalByPais.js';


export async function nextDeliver(dbConnection, company, userId, req) {
    const shipmentId = req.body.shipmentId;

    const date = getFechaConHoraLocalDePais(company.pais);
    const query = "INSERT INTO proximas_entregas (didEnvio, fecha, quien) VALUES (?, ?, ?)";

    await executeQuery(dbConnection, query, [shipmentId, date, userId]);

}