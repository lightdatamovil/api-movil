import mysql2 from 'mysql';
import { executeQuery, getDbConfig } from '../db.js';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import { logRed } from '../src/funciones/logsCustom.js';
const CustomException = require('../clases/custom_exeption.js'); // <-- usando require


function generateToken(userId, idEmpresa, perfil) {
    const payload = { userId, perfil, idEmpresa };
    const options = { expiresIn: '2558h' };
    return jwt.sign(payload, 'ruteate', options);
}

export async function login(username, password, company) {
    const dbConfig = getDbConfig(company.did);
    const dbConnection = mysql2.createConnection(dbConfig);
    dbConnection.connect();

    try {
        const depotQuery = "SELECT latitud, longitud FROM `depositos` where did = 1";
        const resultsFromDepotQuery = await executeQuery(dbConnection, depotQuery, []);

        let depotLatitude, depotLongitude, userAddress = {};
        if (resultsFromDepotQuery.length > 0) {
            const row = resultsFromDepotQuery[0];
            depotLatitude = row.latitud;
            depotLongitude = row.longitud;
        }

        const userQuery = `SELECT did, bloqueado, nombre, apellido, email, telefono, pass, usuario, perfil, direccion
                           FROM sistema_usuarios 
                           WHERE usuario = ? AND superado = 0 AND elim = 0`;
        const resultsFromUserQuery = await executeQuery(dbConnection, userQuery, [username]);

        if (resultsFromUserQuery.length === 0) {
            throw new CustomException({
                title: 'Usuario inválido',
                message: 'Usuario no encontrado en el sistema'
            });
        }

        const user = resultsFromUserQuery[0];

        if (user.bloqueado === 1) {
            throw new CustomException({
                title: 'Acceso denegado',
                message: 'El usuario se encuentra bloqueado'
            });
        }

        const hashPassword = crypto.createHash('sha256').update(password).digest('hex');
        if (user.pass !== hashPassword) {
            throw new CustomException({
                title: 'Contraseña incorrecta',
                message: 'La contraseña ingresada no coincide'
            });
        }

        const token = generateToken(user.did, company.did, user.perfil);

        let userHomeLatitude, userHomeLongitude;
        if (user.direccion != "") {
            userAddress = JSON.parse(user.direccion);
            userHomeLatitude = userAddress.lat;
            userHomeLongitude = userAddress.lng;
        }

        const userLocations = [
            { id: 2, name: "Casa", latitude: userHomeLatitude, longitude: userHomeLongitude },
            { id: 3, name: "Deposito", latitude: depotLatitude, longitude: depotLongitude }
        ];

        return {
            id: user.did,
            username: user.usuario,
            profile: user.perfil,
            email: user.email,
            profilePicture: "",
            hasShipmentProductsQr: company.did == 200,
            phone: user.telefono,
            token,
            locations: userLocations,
        };

    } catch (error) {
        logRed(`Error en login: ${error.stack}`);
        throw error;
    } finally {
        dbConnection.end();
    }
}

export async function identification(company) {
    const imageUrl = company.url + "/app-assets/images/logo/logo.png";

    try {
        let imageBase64;
        try {
            const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
            const imageBuffer = Buffer.from(response.data, 'binary');
            imageBase64 = imageBuffer.toString('base64');
        } catch (error) {
            imageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8v+d+AAAAWElEQVRIDbXBAQEAAAABIP6PzgpV+QUwbGR2rqlzdkcNoiCqk73A0B9H5KLVmr4YdTiO8gaCGg8VmYWqJf2zxeI1icT24tFS0hDJ01gg7LMEx6qI3SCqA6Uq8gRJbAqioBgCRH0CpvI0dpjlGr6hQJYtsDRS0BQ==';
        }

        return {
            id: company.did * 1,
            plan: company.plan * 1,
            url: company.url,
            country: company.pais * 1,
            name: company.empresa,
            appPro: company.did == 4,
            colectaPro: false,
            obligatoryImageOnRegisterVisit: company.did == 108,
            obligatoryDniAndNameOnRegisterVisit: company.did == 97,
            image: imageBase64,
        };

    } catch (error) {
        logRed(`Error en identification: ${error.stack}`);
        throw new CustomException({
            title: 'Error en identificación',
            message: 'No se pudo obtener la información de la empresa'
        });
    }
}

export async function whatsappMessagesList(company) {
    const dbConfig = getDbConfig(company.did);
    const dbConnection = mysql2.createConnection(dbConfig);
    dbConnection.connect();

    try {
        const queryTexts = "SELECT texto FROM `mensajeria_app` ORDER BY tipo ASC;";
        const results = await executeQuery(dbConnection, queryTexts, []);
        return results.map(row => row.texto);
    } catch (error) {
        logRed(`Error en whatsappMessagesList: ${error.stack}`);
        throw new CustomException({
            title: 'Error en mensajes',
            message: 'No se pudieron obtener los mensajes de WhatsApp'
        });
    } finally {
        dbConnection.end();
    }
}
