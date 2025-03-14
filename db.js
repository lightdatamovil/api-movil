import redis from 'redis';
import mysql from 'mysql';
import { logRed } from './src/funciones/logsCustom.js';

export const redisClient = redis.createClient({
    socket: {
        host: '192.99.190.137',
        port: 50301,
    },
    password: 'sdJmdxXC8luknTrqmHceJS48NTyzExQg',
});

redisClient.on('error', (err) => {
    logRed(`Error al conectar con Redis: ${err.message}`);
});

let companiesList = {};
let driverList = {};
let zoneList = {};
let clientList = {};

export function getDbConfig(companyId) {
    return {
        host: "localhost",
        // host: "149.56.182.49",
        user: "ue" + companyId,
        password: "78451296",
        database: "e" + companyId,
        // port: 44339
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
        const companiesListString = await redisClient.get('empresasData');

        companiesList = JSON.parse(companiesListString);

    } catch (error) {
        logRed(`Error en loadCompaniesFromRedis: ${error.message}`);

        throw error;
    }
}

export async function getCompanyById(companyId) {
    try {
        let company = companiesList[companyId];

        if (company == undefined || Object.keys(companiesList).length === 0) {
            try {
                await loadCompaniesFromRedis();

                company = companiesList[companyId];
            } catch (error) {
                logRed(`Error al cargar compañías desde Redis: ${error.message}`);
                throw error;
            }
        }

        return company;
    } catch (error) {
        logRed(`Error en getCompanyById: ${error.message}`);
        throw error;
    }
}

export async function getCompanyByCode(companyCode) {
    try {
        let company;

        if (Object.keys(companiesList).length === 0) {
            try {
                await loadCompaniesFromRedis();
            } catch (error) {
                logRed(`Error al cargar compañías desde Redis: ${error.message}`);
                throw error;
            }
        }

        for (const key in companiesList) {
            if (companiesList.hasOwnProperty(key)) {
                const currentCompany = companiesList[key];
                if (String(currentCompany.codigo) === String(companyCode)) {
                    company = currentCompany;
                    break;
                }
            }
        }

        return company;
    } catch (error) {
        logRed(`Error en getCompanyByCode: ${error.message}`);
        throw error;
    }
}

async function loadClients(dbConnection, companyId) {

    // Verifica si la compañía especificada existe en la lista de compañías
    if (!clientList[companyId]) {
        clientList[companyId] = {}
    }

    try {
        const queryUsers = "SELECT * FROM clientes";
        const resultQueryUsers = await executeQuery(dbConnection, queryUsers, []);

        resultQueryUsers.forEach(row => {
            const keySender = row.did;

            if (!clientList[companyId][keySender]) {
                clientList[companyId][keySender] = {};
            }

            clientList[companyId][keySender] = {
                fecha_sincronizacion: row.fecha_sincronizacion,
                did: row.did,
                codigo: row.codigoVinculacionLogE,
                nombre: row.nombre_fantasia,
            };
        });

        return clientList[companyId];
    } catch (error) {
        logRed(`Error en getClients para la compañía ${companyId}: ${error.message}`);
        throw error;
    }
}

export async function getClientsByCompany(dbConnection, company) {
    try {
        let companyClients = clientList[company.did];

        if (companyClients == undefined || Object.keys(clientList).length === 0) {
            try {
                await loadClients(dbConnection, company.did);

                companyClients = clientList[company.did];
            } catch (error) {
                logRed(`Error al cargar compañías desde Redis: ${error.message}`);
                throw companyClients;
            }
        }

        return companyClients;
    } catch (error) {
        logRed(`Error en getZonesByCompany: ${error.message}`);
        throw error;
    }
}

async function loadZones(companyId) {
    const dbConfig = getDbConfig(companyId);
    const dbConnection = mysql.createConnection(dbConfig);
    dbConnection.connect();

    try {
        // Verifica si la compañía especificada existe en la lista de compañías
        if (!queryZzoneListones[companyId]) {
            zoneList[companyId] = {}
        }
        const queryZones = "SELECT * FROM envios_zonas";
        const resultQueryZones = await executeQuery(dbConnection, queryZones, []);

        resultQueryZones.forEach(row => {
            const keySender = row.did;

            if (!zoneList[companyId][keySender]) {
                zoneList[companyId][keySender] = {};
            }

            zoneList[companyId][row.id] = {
                id: row.id,
                id_origen: row.id_origen,
                fecha_sincronizacion: row.fecha_sincronizacion,
                did: row.did,
                codigo: row.codigo,
                nombre: row.nombre,
                codigos: row.codigos,
                dataGeo: row.dataGeo,
            };
        });
    } catch (error) {
        logRed(`Error en getZones: ${error.message}`);
        throw error;
    } finally {
        dbConnection.end();
    }
}

export async function getZonesByCompany(companyId) {
    try {
        let zones = zoneList[companyId];

        if (zones == undefined || Object.keys(zoneList).length === 0) {
            try {
                await loadZones();

                zones = zoneList[companyId];
            } catch (error) {
                logRed(`Error al cargar compañías desde Redis: ${error.message}`);
                throw error;
            }
        }

        return zones;
    } catch (error) {
        logRed(`Error en getZonesByCompany: ${error.message}`);
        throw error;
    }
}

async function loadDrivers(companies) {
    const driversByCompany = {};

    for (const companyId of companies) {
        const dbConfig = getDbConfig(companyId);
        const dbConnection = mysql.createConnection(dbConfig);
        dbConnection.connect();

        try {
            const queryUsers = "SELECT * FROM sistema_usuarios WHERE perfil = 3";
            const resultQueryUsers = await executeQuery(dbConnection, queryUsers, []);

            driversByCompany[companyId] = {};

            for (let i = 0; i < resultQueryUsers.length; i++) {
                const row = resultQueryUsers[i];

                driversByCompany[companyId][row.id] = {
                    id: row.id,
                    id_origen: row.id_origen,
                    fecha_sincronizacion: row.fecha_sincronizacion,
                    did: row.did,
                    codigo: row.codigo_empleado,
                    nombre: row.nombre,
                };
            }
        } catch (error) {
            logRed(`Error en getDrivers para la compañía ${companyId}: ${error.message}`);
            throw error;
        } finally {
            dbConnection.end();
        }
    }

    return driversByCompany;
}

export async function getDriversByCompany(companyId) {
    try {
        let drivers = driverList[companyId];

        if (drivers == undefined || Object.keys(driverList).length === 0) {
            try {
                await loadDrivers();

                drivers = driverList[companyId];
            } catch (error) {
                logRed(`Error al cargar compañías desde Redis: ${error.message}`);
                throw drivers;
            }
        }

        return drivers;
    } catch (error) {
        logRed(`Error en getDriversByCompany: ${error.message}`);
        throw error;
    }
}

export async function executeQuery(connection, query, values) {
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
        logRed(`Error en executeQuery: ${error.message}`);
        throw error;
    }
}
