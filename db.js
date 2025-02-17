import redis from 'redis';
import fs from 'fs';

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
    return dbConfig = {
        host: "149.56.182.49",
        user: "ue" + companyId,
        password: "78451296",
        database: "e" + companyId,
        port: 44339
    };
}

export function getProdDbConfig(company) {
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

export async function getDrivers() {
    try {
        const drivers = [];
        for (var j in companiesList) {
            company = companiesList[j];

            const dbConfig = getDbConfig(company.did);
            const dbConnection = mysql.createConnection(dbConfig);
            dbConnection.connect();

            const queryUsers = "SELECT * FROM sistema_usuarios WHERE perfil = 3";
            const resultQueryUsers = await executeQuery(queryUsers, []);
            drivers.push({ companyId: company.did, drivers: resultQueryUsers });

        }
        driverList = drivers;
    } catch (error) {

    }

}

export async function getDriversByCompany(companyId) {
    if (!Array.isArray(driverList) || driverList.length === 0) {
        try {
            return driverList.find(driver => driver.companyId === companyId).drivers || [];
        } catch (error) {
            throw error;
        }
    } else {
        const drivers = await getDrivers();
        return drivers.find(driver => driver.companyId === companyId).drivers || [];
    }
}

export async function getClients() {
    try {
        const clients = [];
        for (var j in companiesList) {
            company = companiesList[j];

            const dbConfig = getDbConfig(company.did);
            const dbConnection = mysql.createConnection(dbConfig);
            dbConnection.connect();

            const queryUsers = "SELECT * FROM clientes";
            const resultQueryUsers = await executeQuery(queryUsers, []);
            clients.push({ companyId: company.did, clients: resultQueryUsers });

        }
        clientList = clients;
    } catch (error) {

    }

}

export async function getClientsByCompany(companyId) {
    if (!Array.isArray(clientList) || clientList.length === 0) {
        try {
            return clientList.find(client => client.companyId === companyId).clients || [];
        } catch (error) {
            throw error;
        }
    } else {
        const clients = await getClients();
        return clients.find(client => client.companyId === companyId).clients || [];
    }
}

export async function getZones() {
    try {
        const zones = [];
        for (var j in companiesList) {
            company = companiesList[j];

            const dbConfig = getDbConfig(company.did);
            const dbConnection = mysql.createConnection(dbConfig);
            dbConnection.connect();

            const queryZones = "SELECT * FROM envios_zonas";
            const resultQueryZones = await executeQuery(queryZones, []);
            zones.push({ companyId: company.did, zones: resultQueryZones });
        }
        zoneList = zones;
    } catch (error) {
        throw error;
    }
}

export async function getZonesByCompany(companyId) {
    if (!Array.isArray(zoneList) || zoneList.length === 0) {
        try {
            return zoneList.find(zone => zone.companyId === companyId).zones || [];
        } catch (error) {
            throw error;
        }
    } else {
        const zones = await getZones();
        return zones.find(zone => zone.companyId === companyId).zones || [];
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