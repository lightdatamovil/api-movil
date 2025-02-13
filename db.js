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

let companiesList = [];

function getDbConfig(company) {
    return dbConfig = {
        host: "149.56.182.49",
        user: "ue" + company.id,
        password: "78451296",
        database: "e" + company.id,
        port: 44339
    };
}

function getProdDbConfig(company) {
    return dbConfig = {
        host: "bhsmysql1.lightdata.com.ar",
        user: company.dbuser,
        password: company.dbpass,
        database: company.dbname
    };
}

async function loadCompaniesFromRedis() {
    try {
        const companysDataJson = await redisClient.get('empresasData');
        companiesList = companysDataJson ? Object.values(JSON.parse(companysDataJson)) : [];
    } catch (error) {
        throw error;
    }
}

async function getCompanyById(companyCode) {
    if (!Array.isArray(companiesList) || companiesList.length === 0) {
        try {
            await loadCompaniesFromRedis();
        } catch (error) {
            throw error;
        }
    }

    return companiesList.find(company => Number(company.did) === Number(companyCode)) || null;
}

async function getCompanyByCode(companyCode) {
    if (!Array.isArray(companiesList) || companiesList.length === 0) {
        try {
            await loadCompaniesFromRedis();
        } catch (error) {
            throw error;
        }
    }
    return companiesList.find(company => company.codigo === companyCode) || null;
}

async function executeQuery(connection, query, values) {
    try {
        return new Promise((resolve, reject) => {
            connection.query(query, values, (err, results) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(results);
                }
            });
        });
    } catch (error) {
        throw error;
    }
}

async function obtenerClientes_cadetes() {
    for (var j in companysDB) {
        company = companysDB[j];

        let dbConfig = {
            host: "149.56.182.49",
            user: "ue" + company.codigo,
            password: "78451296",
            database: "u" + company.codigo,
            port: 44339
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
    getDbConfig,
    getProdDbConfig,
    redisClient,
    getCompanyById,
    getCompanyByCode,
    executeQuery,
    obtenerClientes_cadetes
}