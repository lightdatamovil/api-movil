
const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const redis = require('redis');

const redisClient = redis.createClient({
    socket: {
        host: '192.99.190.137',
        port: 50301,
    },
    password: 'sdJmdxXC8luknTrqmHceJS48NTyzExQg',
});

redisClient.on('error', (err) => {
    console.error('Error al conectar con Redis:', err);
});

let empresasDB = null;
var AclientesXEmpresa = new Object();
var AusuariosXEmpresa = new Object();
var AzonasXEmpresa = new Object();

const verifyToken = require('./src/funciones/verifyToken');
const InstallAPP = require('./src/clases/InstallAPP');
const Login = require('./src/clases/login');

const app = express();
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
const PORT = 3000;

async function crearLog(idEmpresa, operador, endpoint, result, quien, idDispositivo, modelo, marca, versionAndroid, versionApp) {
    const dbConfig = {
        host: "localhost",
        user: "apimovil_ulog",
        password: "}atbYkG0P,VS",
        database: "apimovil_log"
    };

    const dbConnection = mysql.createConnection(dbConfig);
    try {
        return new Promise((resolve, reject) => {
            dbConnection.connect((err) => {
                if (err) {
                    console.error('Error al conectar con la base de datos:', err.stack);
                    return reject({ error: "error", details: err.message });
                }

                const sql = `
                INSERT INTO logs (empresa, operador, request, response, quien, dispositivo, uid, appversion)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;

                const values = [
                    idEmpresa,
                    operador,
                    endpoint,
                    JSON.stringify(result),
                    quien,
                    `${modelo} ${marca} ${versionAndroid}`,
                    idDispositivo,
                    versionApp
                ];

                const queryString = mysql.format(sql, values);
                console.log("QUERY A EJECUTAR:", queryString);

                dbConnection.query(sql, values, (err, results) => {
                    dbConnection.end();
                    if (err) {
                        console.error('Error al ejecutar la consulta de logs:', err.stack);
                        return reject({ error: "error", details: err.message, query: queryString });
                    } else {
                        return resolve({ error: "no error", results: results, query: queryString });
                    }
                });
            });
        });
    } catch (error) {

    } finally {
        dbConnection.end();
    }

}

app.use(express.json());

app.post('/api/login', async (req, res) => {
    try {
        const { username, password, idEmpresa, idDispositivo, versionApp, marca, modelo, versionAndroid } = req.body;

        if (!username || !password) {
            return res.json({ estado: false, mensaje: "Algunos de los datos están vacíos." });
        }

        const loginHandler = new Login(empresasDB);
        const loginResult = await loginHandler.loginUser(username, password, idEmpresa);

        crearLog(idEmpresa, 0, "/api/login", loginResult, loginResult.body.id, idDispositivo, modelo, marca, versionAndroid, versionApp);

        res.json(loginResult);

    } catch (error) {
        console.error("Error en /api/login:", error);
        res.json({ status: false, error });
    }
});

app.post('/api/install', async (req, res) => {
    const { codigoEmpresa, idEmpresa, idDispositivo, versionApp, marca, modelo, versionAndroid } = req.body;

    const installHandler = new InstallAPP(empresasDB);
    const installResult = await installHandler.install(codigoEmpresa);

    const { b64, ...installResultFiltered } = installResult;

    // 	res.json({
    // 	    "empresa": installResultFiltered.id,
    // 	    "operador":0,
    // 	    "endpoint":"/api/installDEV",
    // 	    "result":installResultFiltered,
    // 	    "quien":0,
    // 	    "uid":idDispositivo,
    // 	    "dispositivo":`${modelo} ${marca} ${versionAndroid}`,
    // 	    "versionApp":versionApp
    // 	});

    crearLog(installResultFiltered.id, 0, "/api/install", installResultFiltered, 0, idDispositivo, modelo, marca, versionAndroid, versionApp);
    res.json(installResult);

});

app.post('/api/verificarrutacomenzada', verifyToken, async (req, res) => {
    const { didEmpresa, didUser, idDispositivo, modelo, marca, versionAndroid, versionApp } = req.body;
    const empresa = getDbConfig(didEmpresa);
    let dbConfig = {
        host: "bhsmysql1.lightdata.com.ar",
        user: empresa.dbuser,
        password: empresa.dbpass,
        database: empresa.dbname
    };

    const dbConnection = mysql.createConnection(dbConfig);
    dbConnection.connect();
    try {
        if (!empresa) {
            return res.status(400).json({ estadoRespuesta: false, body: {}, mensaje: 'Empresa no encontrada' });
        } else {



            const sql = `SELECT tipo FROM cadetes_movimientos WHERE didCadete = ${didUser} AND DATE(autofecha) = CURDATE() ORDER BY id DESC LIMIT 1`;

            dbConnection.query(sql, (err, results) => {
                if (err) {
                    res.status(200).json({ estadoRespuesta: false, body: {}, mensaje: "" });
                    console.error('Error al ejecutar la consulta: ' + err.stack);
                    return;
                }

                let esta = false;
                if (results.length > 0) {
                    esta2 = results[0].tipo;
                    if (esta2 == 0) {
                        esta = true;
                    }
                }
                dbConnection.end();
                // 	res.json({
                // 	    "empresa": didEmpresa,
                // 	    "operador":0,
                // 	    "endpoint":"/api/verificarrutacomenzada",
                // 	    "result":esta,
                // 	    "quien":didUser,
                // 	    "uid":idDispositivo,
                // 	    "dispositivo":`${modelo} ${marca} ${versionAndroid}`,
                // 	    "versionApp":versionApp
                // 	});
                crearLog(didEmpresa, 0, "/api/verificarrutacomenzada", esta, didUser, idDispositivo, modelo, marca, versionAndroid, versionApp);
                res.status(200).json({ estadoRespuesta: true, body: esta, mensaje: "" });

            });
        }
    } catch (e) {
        res.status(400).json({ estadoRespuesta: true, body: {}, mensaje: e });
    }
    finally {
        dbConnection.end();
    }
});

app.post('/api/listadochoferes', verifyToken, async (req, res) => {

    const { idEmpresa, diduser, idDispositivo, modelo, marca, versionAndroid, versionApp } = req.body;
    const empresa = getDbConfig(idEmpresa);
    if (!empresa) {
        return res.status(400).json({ estadoRespuesta: false, body: "", mensaje: 'Empresa no encontrada' });
    }
    let dbConfig = {
        host: "bhsmysql1.lightdata.com.ar",
        user: empresa.dbuser,
        password: empresa.dbpass,
        database: empresa.dbname
    };
    const dbConnection = mysql.createConnection(dbConfig);
    dbConnection.connect();
    try {
        var Atemp = [];

        let query = "SELECT u.did, concat( u.nombre,' ', u.apellido) as nombre FROM `sistema_usuarios` as u JOIN sistema_usuarios_accesos as a on ( a.elim=0 and a.superado=0 and a.usuario = u.did) where u.elim=0 and u.superado=0 and a.perfil=3 ORDER BY nombre ASC";
        const results = await executeQuery(dbConnection, query, []);
        for (i = 0; i < results.length; i++) {
            var row = results[i];
            var objetoJSON = {
                "id": row.did,
                "nombre": row.nombre
            }
            Atemp.push(objetoJSON);
        }

        dbConnection.end();
        // 	res.json({
        // 	    "empresa": idEmpresa,
        // 	    "operador":0,
        // 	    "endpoint":"/api/listadochoferes",
        // 	    "result":{ estadoRespuesta: true, body: Atemp , mensaje: ""},
        // 	    "quien":diduser,
        // 	    "uid":idDispositivo,
        // 	    "dispositivo":`${modelo} ${marca} ${versionAndroid}`,
        // 	    "versionApp":versionApp
        // 	});
        crearLog(idEmpresa, 0, "/api/listadochoferes", { estadoRespuesta: true, body: Atemp, mensaje: "" }, diduser, idDispositivo, modelo, marca, versionAndroid, versionApp);
        res.status(200).json({ estadoRespuesta: true, body: Atemp, mensaje: "" });

    } catch (error) {

    } finally {
        dbConnection.end();
    }
});

app.post('/api/listadowsp', verifyToken, async (req, res) => {
    try {
        const { idEmpresa, userId, idDispositivo, modelo, marca, versionAndroid, versionApp } = req.body;

        const empresa = getDbConfig(idEmpresa);

        let dbConfig = {
            host: "bhsmysql1.lightdata.com.ar",
            user: empresa.dbuser,
            password: empresa.dbpass,
            database: empresa.dbname
        };

        const dbConnection = mysql.createConnection(dbConfig);

        dbConnection.connect();

        if (!empresa) {
            return res.status(400).json({ estadoRespuesta: false, body: "", mensaje: 'Empresa no encontrada' });
        }

        const Atemp = [];

        const query = "SELECT texto FROM `mensajeria_app` WHERE superado=0 ORDER BY tipo ASC;";

        const results = await executeQuery(dbConnection, query, []);

        results.forEach(row => Atemp.push(row.texto));

        dbConnection.end();

        crearLog(idEmpresa, 0, "/api/listadowsp", { estadoRespuesta: true, body: Atemp, mensaje: "Mensajes traídos correctamente" }, userId, idDispositivo, modelo, marca, versionAndroid, versionApp);

        res.status(200).json({
            estadoRespuesta: true,
            body: Atemp,
            mensaje: "Mensajes traídos correctamente"
        });

    } catch (e) {
        res.status(500).json({
            estadoRespuesta: false,
            body: null,
            mensaje: `Algo falló... ${e}`
        });
    } finally {
        dbConnection.end();
    }
});


app.post('/api/testapi', async (req, res) => {
    res.status(200).json("Funciona");
});


function getDbConfig(idEmpresa) {
    data = -1;
    for (let j in empresasDB) {
        if (empresasDB[j]["id"] * 1 == idEmpresa) {
            data = empresasDB[j];
        }
    }
    return data;
}

async function actualizarEmpresas() {

    const empresasDataJson = await redisClient.get('empresasData');
    empresasDB = JSON.parse(empresasDataJson);
    module.exports.empresasDB = empresasDB;
    module.exports.app = app;
    obtenerClientes_cadetes();
}

async function executeQuery(connection, query, values) {
    return new Promise((resolve, reject) => {
        connection.query(query, values, (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
}

async function obtenerClientes_cadetes() {
    for (var j in empresasDB) {
        empresa = empresasDB[j];

        let dbConfig = {
            host: "bhsmysql1.lightdata.com.ar",
            user: empresa.dbuser,
            password: empresa.dbpass,
            database: empresa.dbname
        };

        const dbConnection = mysql.createConnection(dbConfig);
        AclientesXEmpresa[j] = new Object();
        var Atemp = [];
        var query = "SELECT did,codigo,nombre_fantasia,razon_social FROM `clientes` where superado=0 and elim=0;";
        var results = await executeQuery(dbConnection, query, []);
        for (i = 0; i < results.length; i++) {
            var row = results[i];
            var objetoJSON = { "did": row.did, "codigo": row.codigo, "nombre_fantasia": row.nombre_fantasia, "razon_social": row.razon_social };
            Atemp.push(objetoJSON);
        }
        AclientesXEmpresa[j] = Atemp;


        AusuariosXEmpresa[j] = new Object();
        Atemp = [];
        query = "SELECT did,nombre,apellido FROM `sistema_usuarios` Where superado=0 and elim=0;";
        results = await executeQuery(dbConnection, query, []);
        for (i = 0; i < results.length; i++) {
            var row = results[i];
            var objetoJSON = { "did": row.did, "nombre": row.nombre + " " + row.apellido };
            Atemp.push(objetoJSON);
        }
        AusuariosXEmpresa[j] = Atemp;


        AzonasXEmpresa[j] = Atemp;
        Atemp = [];
        query = "SELECT did,nombre FROM `envios_zonas` where superado=0 and elim=0;";
        results = await executeQuery(dbConnection, query, []);
        for (i = 0; i < results.length; i++) {
            var row = results[i];
            var objetoJSON = { "did": row.did, "nombre": row.nombre };
            Atemp.push(objetoJSON);
        }
        AzonasXEmpresa[j] = Atemp;


        dbConnection.end();
        module.exports.AclientesXEmpresa = AclientesXEmpresa;
        module.exports.AusuariosXEmpresa = AusuariosXEmpresa;
        module.exports.AzonasXEmpresa = AzonasXEmpresa;
    }

}

(async () => {
    try {
        await redisClient.connect();

        await actualizarEmpresas();

        const enviosRoutes = require('./routes/enviosRoutes');
        const dashboardRoutes = require('./routes/dashboardRoutes');
        const clientesRoutes = require('./routes/clientesRoutes');

        app.use('/api/envios', enviosRoutes);
        app.use('/api/dashboard', dashboardRoutes);
        app.use('/api/clientes', clientesRoutes);

        app.listen(PORT, () => {
            console.log(`Servidor escuchando en el puerto ${PORT}`);
        });

    } catch (err) {
        console.error('Error al iniciar el servidor:', err);
    }
})();


module.exports = { app, empresasDB, AclientesXEmpresa, AusuariosXEmpresa, AzonasXEmpresa };