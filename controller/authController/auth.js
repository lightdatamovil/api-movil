const mysql = require('mysql');
const executeQuery = require('../../db').executeQuery;
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const axios = require('axios');

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

async function loginUser(username, password, empresa) {
    let dbConfig = {
        host: "149.56.182.49",
        user: "ue" + empresa.id,
        password: "78451296",
        database: "e" + empresa.id,
        port: 44339
    };


    try {
        const dbConnection = mysql.createConnection(dbConfig);

        dbConnection.connect();

        var lat_dep = 0;
        var long_dep = 0;
        var adir = "";

        const querydeposito = "SELECT latitud,longitud FROM `depositos` where did = 1";

        const resultsdeposito = await executeQuery(dbConnection, querydeposito, []);

        if (resultsdeposito.length > 0) {
            const lineadeposito = resultsdeposito[0];
            lat_dep = lineadeposito.latitud;
            long_dep = lineadeposito.longitud;
        }

        const query = `SELECT did, bloqueado, nombre, apellido, email, telefono, pass, usuario, perfil, direccion
                       FROM sistema_usuarios 
                       WHERE usuario = ?`;

        const results = await executeQuery(dbConnection, query, [username]);

        if (results.length === 0) {
            return { estadoRespuesta: false, body: null, mensaje: 'No se ha encontrado el usuario' };
        }

        const usuario = results[0];

        if (usuario.bloqueado === 1) {
            return { estadoRespuesta: false, body: null, mensaje: 'Usuario bloqueado' };
        }

        const hashPassword = crypto.createHash('sha256').update(password).digest('hex');

        if (usuario.pass !== hashPassword) {
            return { estadoRespuesta: false, body: null, mensaje: 'Credenciales inválidas' };
        }

        const token = generateToken(usuario.did, empresa.id, usuario.perfil);

        var lat_casa = 0;
        var long_casa = 0;

        if (usuario.direccion != "") {
            adir = JSON.parse(usuario.direccion);
            lat_casa = adir.lat;
            long_casa = adir.lng;
        }

        if (empresa.id != 200) {
            menu_info_envio = false;
        } else {
            menu_info_envio = true;
        }

        var ubicaciones = [];
        ubicaciones.push({ "id": 2, "name": "Casa", "lat": lat_casa, "long": long_casa });
        ubicaciones.push({ "id": 3, "name": "Deposito", "lat": lat_dep, "long": long_dep });

        var imagen = "";

        return {
            estadoRespuesta: true,
            body: {
                "token": token,
                "id": usuario.did,
                "fotoPerfil": imagen,
                "username": usuario.usuario,
                "email": usuario.email,
                "tokenFCM": usuario.token_fcm,
                "perfil": perfil,
                "ubicaciones": ubicaciones,
                "menu_info_envio": menu_info_envio,
                "telefono": usuario.telefono
            },
            mensaje: 'OK'
        };

    } catch (error) {
        return { estadoRespuesta: false, body: null, respuesta: 'Error en la consulta Log' };
    } finally {
        dbConnection.end();
    }
}
async function install(empresa) {

    const imageUrl = empresa.url + "/app-assets/images/logo/logo.png";

    try {
        const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });

        const imageBuffer = Buffer.from(response.data, 'binary');
        const imageBase64 = imageBuffer.toString('base64');

        let colectapro = false;

        let apppro = false;

        if (empresa.id == 4) {
            apppro = true;
        }

        let result = {
            "id": empresa.id * 1,
            "plan": empresa.plan * 1,
            "url": empresa.url,
            "pais": empresa.pais * 1,
            "name": empresa.empresa,
            "b64": imageBase64,
            "authentication": true,
            "apppro": apppro,
            "colectapro": colectapro,
            "registroVisitaImagenObligatoria": empresa.id * 1 == 108,
            "registroVisitaDniYNombreObligatorio": empresa.id * 1 == 97,
        };

        return result;

    } catch (error) {
        throw error;
    }
}

module.exports = {
    loginUser,
    install,
};