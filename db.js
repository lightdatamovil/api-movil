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
        console.error("Error en loadCompaniesFromRedis:", error);
        throw error;
    }
}

export async function getDrivers(companyId) {
    const dbConfig = getDbConfig(companyId);
    const dbConnection = mysql.createConnection(dbConfig);
    dbConnection.connect();

    try {
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
                codigo: row.codigo_empleado,
                nombre: row.nombre,
            };
            drivers.push(driver);
        }
        driverList.push({ companyId: companyId, drivers: drivers });

        return driverList;
    } catch (error) {
        console.error("Error en getDrivers:", error);
        throw error;
    }

}

export async function getClients(companyId) {
    const dbConfig = getDbConfig(companyId);
    const dbConnection = mysql.createConnection(dbConfig);
    dbConnection.connect();

    try {
        const queryUsers = "SELECT * FROM clientes";

        const resultQueryUsers = await executeQuery(dbConnection, queryUsers, []);

        const clients = [];

        for (let i = 0; i < resultQueryUsers.length; i++) {
            const row = resultQueryUsers[i];

            const client = {
                id: row.id,
                id_origen: row.id_origen,
                fecha_sincronizacion: row.fecha_sincronizacion,
                did: row.did,
                codigo: row.codigo,
                nombre: row.nombre_fantasia,
                codigos: row.codigos,
                dataGeo: row.dataGeo,
            };

            clients.push(client);
        }
        clientList.push({ companyId: companyId, clients: clients });

        return clientList;
    } catch (error) {
        console.error("Error en getClients:", error);
        throw error;
    }
}

export async function getZones(companyId) {
    const dbConfig = getDbConfig(companyId);
    const dbConnection = mysql.createConnection(dbConfig);
    dbConnection.connect();

    try {
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
        console.error("Error en getZones:", error);
        throw error;
    }
}

export async function getDriversByCompany(companyId) {
    try {
        const companyDrivers = driverList.find(driver => driver.companyId == companyId);

        if (companyDrivers === undefined || companyDrivers === null || companyDrivers.length == 0) {
            const drivers = await getDrivers(companyId);

            const companyDriversR = drivers.find(driver => driver.companyId == companyId).drivers || [];

            return companyDriversR;
        } else {

            return companyDrivers.drivers || [];
        }
    } catch (error) {
        console.error("Error en getDriversByCompany:", error);
        throw error;
    }
}

export async function getClientsByCompany(companyId) {
    try {
        const companyClients = clientList.find(client => client.companyId == companyId);

        if (companyClients === undefined || companyClients === null || companyClients.length == 0) {
            const clients = await getClients(companyId);
            const companyClientsR = clients.find(client => client.companyId == companyId).clients || [];

            return companyClientsR;
        } else {
            return companyClients.clients || [];
        }
    } catch (error) {
        console.error("Error en getClientsByCompany:", error);
        throw error;
    }
}

export async function getZonesByCompany(companyId) {
    try {
        const companyZones = zoneList.find(zone => zone.companyId == companyId);

        if (companyZones === undefined || companyZones === null || companyZones.length == 0) {
            const zones = await getZones(companyId);

            const companyZonesR = zones.find(zone => zone.companyId == companyId).zones || [];

            return companyZonesR;
        } else {
            return companyZones.zones || [];
        }
    } catch (error) {
        console.error("Error en getZonesByCompany:", error);
        throw error;
    }
}

export async function getCompanyById(companyCode) {
    let company = companiesList.find(company => Number(company.did) === Number(companyCode)) || null;

    if (!Array.isArray(companiesList) || companiesList.length === 0 || company == null) {
        try {
            await loadCompaniesFromRedis();
            company = companiesList.find(company => Number(company.did) === Number(companyCode)) || null;
        } catch (error) {
            console.error("Error en getCompanyById:", error);
            throw error;
        }
    }

    return company;
}

export async function getCompanyByCode(companyCode) {
    let company = companiesList.find(company => String(company.codigo) === String(companyCode)) || null;

    if (!Array.isArray(companiesList) || companiesList.length == 0 || company == null) {
        try {
            await loadCompaniesFromRedis();
            company = companiesList.find(company => String(company.codigo) === String(companyCode)) || null;
        } catch (error) {
            console.error("Error en getCompanyByCode:", error);
            throw error;
        }
    }

    return company;
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
        console.error("Error en executeQuery:", error);
        throw error;
    }
}
