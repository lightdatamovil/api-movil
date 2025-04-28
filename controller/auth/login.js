import mysql2 from 'mysql';
import { executeQuery, getDbConfig } from '../../db.js';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { logRed } from '../../src/funciones/logsCustom.js';
import CustomException from '../../classes/custom_exception.js';

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
        if (error instanceof CustomException) {
            throw error;
        }
        throw new CustomException({
            title: 'No pudimos iniciar sesión',
            message: error.message,
            stack: error.stack
        });
    } finally {
        dbConnection.end();
    }
}
