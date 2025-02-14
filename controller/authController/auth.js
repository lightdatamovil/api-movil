const mysql = require('mysql');
const executeQuery = require('../../db').executeQuery;
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { getDbConfig } = require('../../db');

function generateToken(userId, idEmpresa, perfil) {
    const payload = {
        userId: userId,
        perfil: perfil,
        idEmpresa: idEmpresa
    };

    const options = {
        expiresIn: '2558h'
    };

    return jwt.sign(payload, 'ruteate', options);
}

async function login(username, password, company) {
    const dbConfig = getDbConfig(company.did);
    const dbConnection = mysql.createConnection(dbConfig);
    dbConnection.connect();

    try {
        const depotQuery = "SELECT latitud,longitud FROM `depositos` where did = 1";

        const resultsFromDepotQuery = await executeQuery(dbConnection, depotQuery, []);

        let depotLatitude = 0;
        let depotLongitude = 0;

        if (resultsFromDepotQuery.length > 0) {
            const row = resultsFromDepotQuery[0];
            depotLatitude = row.latitud;
            depotLongitude = row.longitud;
        }

        const userQuery = `SELECT did, bloqueado, nombre, apellido, email, telefono, pass, usuario, perfil, direccion
                       FROM sistema_usuarios 
                       WHERE usuario = ?`;

        const resultsFromUserQuery = await executeQuery(dbConnection, userQuery, [username]);

        if (resultsFromUserQuery.length === 0) {
            return { message: 'No se ha encontrado el usuario' };
        }

        const user = resultsFromUserQuery[0];

        if (user.bloqueado === 1) {
            return { message: 'Usuario bloqueado' };
        }

        const hashPassword = crypto.createHash('sha256').update(password).digest('hex');

        if (user.pass !== hashPassword) {
            return { message: 'Credenciales inválidas' };
        }

        const token = generateToken(user.did, company.did, user.perfil);

        if (user.direccion != "") {
            userAddress = JSON.parse(user.direccion);

            userHomeLatitude = userAddress.lat;
            userHomeLongitude = userAddress.lng;
        }

        let userLocations = [];
        userLocations.push({ "id": 2, "name": "Casa", "latitude": userHomeLatitude, "longitude": userHomeLongitude });
        userLocations.push({ "id": 3, "name": "Deposito", "latitude": depotLatitude, "longitude": depotLongitude });

        var image = "";

        return {
            "id": user.did,
            "username": user.usuario,
            "profile": user.perfil,
            "email": user.email,
            "profilePicture": image,
            "hasShipmentProductsQr": company.did == 200,
            "phone": user.telefono,
            "token": token,
            "locations": userLocations,
        };

    } catch (error) {
        throw error;
    } finally {
        dbConnection.end();
    }
}

async function identification(company) {

    const imageUrl = company.url + "/app-assets/images/logo/logo.png";

    try {
        const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const imageBuffer = Buffer.from(response.data, 'binary');
        const imageBase64 = imageBuffer.toString('base64');

        return {
            body: {
                "id": company.did * 1,
                "plan": company.plan * 1,
                "url": company.url,
                "country": company.pais * 1,
                "name": company.company,
                "authentication": true,
                "appPro": company.did == 4,
                "colectaPro": false,
                "obligatoryImageOnRegisterVisit": company.did * 1 == 108,
                "obligatoryDniAndNameOnRegisterVisit": company.did * 1 == 97,
                "image": imageBase64,
            },
            message: 'Empresa identificada correctamente'
        };

    } catch (error) {
        throw error;
    }
}

async function whatsappMessagesList(company) {

    const dbConfig = getDbConfig(company.did);
    const dbConnection = mysql.createConnection(dbConfig);
    dbConnection.connect();

    try {

        const whatsappMessagesList = [];

        const queryTexts = "SELECT texto FROM `mensajeria_app` ORDER BY tipo ASC;";

        const results = await executeQuery(dbConnection, queryTexts, []);

        results.forEach(row => whatsappMessagesList.push(row.texto));

        return results;
    } catch (error) {
        throw error;
    } finally {
        dbConnection.end();
    }
}

module.exports = {
    login,
    identification,
    whatsappMessagesList,
};