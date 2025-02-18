import redis from 'redis';
import mysql from 'mysql';

export const redisClient = redis.createClient({
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
let driverList = [];
let zoneList = [];
let clientList = [];

export function getDbConfig(companyId) {
    return {
        host: "149.56.182.49",
        user: "ue" + companyId,
        password: "78451296",
        database: "e" + companyId,
        port: 44339
    };
}

export function getProdDbConfig(company) {
    return {
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

export async function getDrivers(companyId) {
    try {

        const dbConfig = getDbConfig(companyId);
        const dbConnection = mysql.createConnection(dbConfig);
        dbConnection.connect();

        const queryUsers = "SELECT * FROM sistema_usuarios WHERE perfil = 3";
        const resultQueryUsers = await executeQuery(dbConnection, queryUsers, []);

        const drivers = [];

        for (let i = 0; i < resultQueryUsers.length; i++) {
            const row = resultQueryUsers[i];

            const driver = {
                id: row.id,
                id_origen: row.id_origen,
                fecha_sincronizacion: row.fecha_sincronizacion,
                did: row.did,
                codigo: row.codigo,
                nombre: row.nombre,
                codigos: row.codigos,
                dataGeo: row.dataGeo,
            };
            drivers.push(driver);
        }
        driverList.push({ companyId: companyId, drivers: drivers });

        return driverList;
    } catch (error) {
        throw error;
    }

}

export async function getClients(companyId) {
    try {

        const dbConfig = getDbConfig(companyId);
        const dbConnection = mysql.createConnection(dbConfig);
        dbConnection.connect();

        const queryUsers = "SELECT * FROM clientes";
        const resultQueryUsers = await executeQuery(dbConnection, queryUsers, []);

        const clients = [];

        for (let i = 0; i < resultQueryUsers.length; i++) {
            const row = resultQueryUsers[i];

            const zone = {
                id: row.id,
                id_origen: row.id_origen,
                fecha_sincronizacion: row.fecha_sincronizacion,
                did: row.did,
                codigo: row.codigo,
                nombre: row.nombre,
                codigos: row.codigos,
                dataGeo: row.dataGeo,
            };
            clients.push(zone);
        }
        clientList.push({ companyId: companyId, zones: zones });

        return clientList;
    } catch (error) {
        throw error;
    }
}

export async function getZones(companyId) {
    try {
        const dbConfig = getDbConfig(companyId);
        const dbConnection = mysql.createConnection(dbConfig);
        dbConnection.connect();

        const queryZones = "SELECT * FROM envios_zonas";
        const resultQueryZones = await executeQuery(dbConnection, queryZones, []);

        const zones = [];

        for (let i = 0; i < resultQueryZones.length; i++) {
            const row = resultQueryZones[i];

            const zone = {
                id: row.id,
                id_origen: row.id_origen,
                fecha_sincronizacion: row.fecha_sincronizacion,
                did: row.did,
                codigo: row.codigo,
                nombre: row.nombre,
                codigos: row.codigos,
                dataGeo: row.dataGeo,
            };
            zones.push(zone);
        }
        zoneList.push({ companyId: companyId, zones: zones });

        return zoneList;
    } catch (error) {
        throw error;
    }
}

export async function getDriversByCompany(companyId) {
    const companyDrivers = driverList.find(driver => driver.companyId == companyId);

    if (companyDrivers == undefined || !Array.isArray(companyDrivers) || companyDrivers.length == 0) {
        const drivers = await getDrivers(companyId);

        const companyDriversR = drivers.find(driver => driver.companyId == companyId).drivers || [];

        return companyDriversR;
    } else {
        return companyDrivers.find(driver => driver.companyId == companyId).drivers || [];
    }
}
export async function getClientsByCompany(companyId) {
    const companyClients = clientList.find(client => client.companyId == companyId);

    if (companyClients == undefined || !Array.isArray(companyClients) || companyClients.length == 0) {
        const clients = await getClients(companyId);

        const companyClientsR = clients.find(client => client.companyId == companyId).clients || [];

        return companyClientsR;
    } else {
        return companyClients.find(client => client.companyId == companyId).clients || [];
    }
}
export async function getZonesByCompany(companyId) {
    const companyZones = zoneList.find(zone => zone.companyId == companyId);

    if (companyZones == undefined || !Array.isArray(companyZones) || companyZones.length == 0) {
        const zones = await getZones(companyId);

        const companyZonesR = zones.find(zone => zone.companyId == companyId).zones || [];

        return companyZonesR;
    } else {
        return companyZones.find(zone => zone.companyId == companyId).zones || [];
    }
}

export async function getCompanyById(companyCode) {
    if (!Array.isArray(companiesList) || companiesList.length === 0) {
        try {
            await loadCompaniesFromRedis();
        } catch (error) {
            throw error;
        }
    }

    return companiesList.find(company => Number(company.did) === Number(companyCode)) || null;
}

export async function getCompanyByCode(companyCode) {
    if (!Array.isArray(companiesList) || companiesList.length === 0) {
        try {
            await loadCompaniesFromRedis();
        } catch (error) {
            throw error;
        }
    }
    return companiesList.find(company => company.codigo === companyCode) || null;
}

export async function executeQuery(connection, query, values) {
    // console.log("Query:", query);
    // console.log("Values:", values);
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