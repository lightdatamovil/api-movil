const empresasDB = require('./server.js');

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

function buscarEmpresaById(idEmpresa) {
    data = -1;
    for (let j in empresasDB) {
        if (empresasDB[j]["id"] * 1 == idEmpresa) {
            data = empresasDB[j];
        }
    }
    return data
}
function buscarEmpresaByCodigo(codigoEmpresa) {
    data = -1;
    for (let j in empresasDB) {
        if (empresasDB[j]["codigo"] * 1 == codigoEmpresa) {
            data = empresasDB[j];
        }
    }
    return data
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

module.exports = {
    redisClient,
    buscarEmpresaById,
    buscarEmpresaByCodigo,
    executeQuery,
    obtenerClientes_cadetes
}