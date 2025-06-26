import redis from 'redis';
import dotenv from 'dotenv';
import { logBlue, logRed, logYellow } from './src/funciones/logsCustom.js';
import mysql2 from 'mysql2';
dotenv.config({ path: process.env.ENV_FILE || ".env" });

const redisHost = process.env.REDIS_HOST;
const redisPort = process.env.REDIS_PORT;
const redisPassword = process.env.REDIS_PASSWORD;

export const redisClient = redis.createClient({
    socket: {
        host: redisHost,
        port: redisPort,
    },
    password: redisPassword,
});

redisClient.on('error', (err) => {
    logRed(`Error al conectar con Redis: ${error.stack}`);
});

let companiesList = {};

let accountList = {};
let driverList = {};
let zoneList = {};
let clientList = {};
export let connectionsPools = {};

export function getDbConfig(companyId) {
    return {
        // host: "localhost",
        host: "149.56.182.49",
        user: "ue" + companyId,
        password: "78451296",
        database: "e" + companyId,
        port: 44339
    };
}

export const poolLocal = mysql2.createPool({
    host: "149.56.182.49",
    user: "ulog",
    password: "yusito23",
    database: "data",
    port: 44339,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

export function getProdDbConfig(company) {
    return {
        host: "bhsmysql1.lightdata.com.ar",
        user: company.dbuser,
        password: company.dbpass,
        database: company.dbname
    };
}

export async function updateRedis(empresaId, envioId, choferId) {
    const DWRTE = await redisClient.get('DWRTE',);
    const empresaKey = `e.${empresaId}`;
    const envioKey = `en.${envioId}`;

    // Si la empresa no existe, la creamos
    if (!DWRTE[empresaKey]) {
        DWRTE[empresaKey] = {};
    }

    // Solo agrega si el envío no existe
    if (!DWRTE[empresaKey][envioKey]) {
        DWRTE[empresaKey][envioKey] = {
            choferId: choferId
        };
    }

    await redisClient.set('DWRTE', JSON.stringify(DWRTE));
}
export async function loadCompaniesFromRedis() {
    try {
        const companiesListString = await redisClient.get('empresasData');

        companiesList = JSON.parse(companiesListString);

    } catch (error) {
        logRed(`Error en loadCompaniesFromRedis: ${error.stack}`);
        throw error;
    }
}
export async function loadConnectionsPools() {
    try {
        logYellow(`Cargando conexiones a las bases de datos de las compañías...`);
        if (Object.keys(companiesList).length === 0) {
            try {
                await loadCompaniesFromRedis();
            } catch (error) {
                logRed(`Error al cargar compañías desde Redis: ${error.stack}`);
                throw error;
            }
        }
        companiesList = Object.values(companiesList);
        companiesList.map(company => {
            const pool = mysql2.createPool({
                host: "bhsmysql1.lightdata.com.ar",
                user: company.dbuser,
                password: company.dbpass,
                database: company.dbname,
                port: 3306,
                waitForConnections: true,
                connectionLimit: 10,
                queueLimit: 0
            });
            connectionsPools[company.id] = pool;
        });
        logBlue(`${JSON.stringify(Object.keys(connectionsPools))} conexiones a las bases de datos de las compañías cargadas.`);

    } catch (error) {
        logRed(`Error en loadConnectionsPools: ${error.stack}`);
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
                logRed(`Error al cargar compañías desde Redis: ${error.stack}`);
                throw error;
            }
        }

        return company;
    } catch (error) {
        logRed(`Error en getCompanyById: ${error.stack}`);
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
                logRed(`Error al cargar compañías desde Redis: ${error.stack}`);
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
        logRed(`Error en getCompanyByCode: ${error.stack}`);
        throw error;
    }
}

async function loadAccountList(pool, companyId, senderId) {
    try {
        const querySelectClientesCuentas = `
            SELECT did, didCliente, ML_id_vendedor 
            FROM clientes_cuentas 
            WHERE superado = 0 AND elim = 0 AND tipoCuenta = 1 AND ML_id_vendedor != ''
        `;

        const result = await executeQueryFromPool(pool, querySelectClientesCuentas);

        if (!accountList[companyId]) {
            accountList[companyId] = {};
        }

        result.forEach(row => {
            const keySender = row.ML_id_vendedor;

            if (!accountList[companyId][keySender]) {
                accountList[companyId][keySender] = {};
            }

            accountList[companyId][keySender] = {
                didCliente: row.didCliente,
                didCuenta: row.did,
            };
        });

        return accountList[companyId] ? accountList[companyId][senderId] : null;
    } catch (error) {
        logRed(`Error en obtenerMisCuentas: ${error.stack}`);
        throw error;
    }
}

export async function getAccountBySenderId(pool, companyId, senderId) {
    try {
        if (accountList === undefined || accountList === null || Object.keys(accountList).length === 0 || !accountList[companyId]) {
            await loadAccountList(pool, companyId, senderId);
        }

        const account = accountList[companyId][senderId];

        return account;
    } catch (error) {
        logRed(`Error en getAccountBySenderId: ${error.stack}`);
        throw error;
    }
}

async function loadClients(pool, companyId) {
    if (!clientList[companyId]) {
        clientList[companyId] = {}
    }

    try {
        const queryUsers = "SELECT * FROM clientes";
        const resultQueryUsers = await executeQueryFromPool(pool, queryUsers, []);

        resultQueryUsers.forEach(row => {
            const client = row.did;

            if (!clientList[companyId][client]) {
                clientList[companyId][client] = {};
            }

            clientList[companyId][client] = {
                fecha_sincronizacion: row.fecha_sincronizacion,
                did: row.did,
                codigo: row.codigoVinculacionLogE,
                nombre: row.nombre_fantasia,
            };
        });
    } catch (error) {
        logRed(`Error en loadClients para la compañía ${companyId}: ${error.stack}`);
        throw error;
    }
}

export async function getClientsByCompany(pool, companyId) {
    try {
        let companyClients = clientList[companyId];

        if (companyClients == undefined || Object.keys(clientList).length === 0) {
            try {
                await loadClients(pool, companyId);

                companyClients = clientList[companyId];
            } catch (error) {
                logRed(`Error al cargar compañías desde Redis: ${error.stack}`);
                throw error;
            }
        }

        return companyClients;
    } catch (error) {
        logRed(`Error en getClientsByCompany: ${error.stack}`);
        throw error;
    }
}

async function loadZones(pool, companyId) {
    if (!zoneList[companyId]) {
        zoneList[companyId] = {}
    }

    try {
        const queryZones = "SELECT * FROM envios_zonas";
        const resultZones = await executeQueryFromPool(pool, queryZones, []);

        resultZones.forEach(row => {
            const zone = row.did;

            if (!zoneList[companyId][zone]) {
                zoneList[companyId][zone] = {};
            }

            zoneList[companyId][zone] = {
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
        logRed(`Error en loadZones para la compañía ${companyId}: ${error.stack}`);
        throw error;
    }
}

export async function getZonesByCompany(pool, companyId) {
    try {
        let companyZones = zoneList[companyId];

        if (companyZones == undefined || Object.keys(zoneList).length === 0) {
            try {
                await loadZones(pool, companyId);

                companyZones = zoneList[companyId];
            } catch (error) {
                logRed(`Error al cargar compañías desde Redis: ${error.stack}`);
                throw error;
            }
        }

        return companyZones;
    } catch (error) {
        logRed(`Error en getZonesByCompany: ${error.stack}`);
        throw error;
    }
}

async function loadDrivers(pool, companyId) {
    if (!driverList[companyId]) {
        driverList[companyId] = {}
    }

    try {
        const queryUsers = `
            SELECT sistema_usuarios.did, sistema_usuarios.usuario 
            FROM sistema_usuarios_accesos
            INNER JOIN sistema_usuarios ON sistema_usuarios_accesos.did = sistema_usuarios.did
            WHERE sistema_usuarios_accesos.perfil IN (3, 6)
            AND sistema_usuarios_accesos.elim = 0
            AND sistema_usuarios_accesos.superado = 0
            AND sistema_usuarios.elim = 0
            AND sistema_usuarios.superado = 0
        `;

        const resultQueryUsers = await executeQueryFromPool(pool, queryUsers, []);

        for (let i = 0; i < resultQueryUsers.length; i++) {
            const row = resultQueryUsers[i];

            if (!driverList[companyId][row.did]) {
                driverList[companyId][row.did] = {};
            }

            driverList[companyId][row.did] = {
                id: row.id,
                id_origen: row.id_origen,
                fecha_sincronizacion: row.fecha_sincronizacion,
                did: row.did,
                codigo: row.codigo_empleado,
                nombre: row.usuario,
            };
        }
    } catch (error) {
        logRed(`Error en loadDrivers para la compañía ${companyId}: ${error.stack}`);
        throw error;
    }
}

export async function getDriversByCompany(pool, companyId) {
    try {
        let companyDrivers = driverList[companyId];

        if (companyDrivers == undefined || Object.keys(driverList).length === 0) {
            try {
                await loadDrivers(pool, companyId);

                companyDrivers = driverList[companyId];
            } catch (error) {
                logRed(`Error al cargar compañías desde Redis: ${error.stack}`);
                throw error;
            }
        }

        return companyDrivers;
    } catch (error) {
        logRed(`Error en getDriversByCompany para la compañía ${companyId}: ${error.stack}`);
        throw error;
    }
}

export async function executeQuery(connection, query, values, log) {
    // Utilizamos connection.format para obtener la query completa con valores
    const formattedQuery = connection.format(query, values);

    try {
        return new Promise((resolve, reject) => {
            connection.query(query, values, (err, results) => {
                if (log) {
                    logYellow(`Ejecutando query: ${formattedQuery}`);
                }
                if (err) {
                    if (log) {
                        logRed(`Error en executeQuery: ${err.message} en query: ${formattedQuery}`);
                    }
                    reject(err);
                } else {
                    if (log) {
                        logYellow(`Query ejecutado con éxito: ${formattedQuery} - Resultados: ${JSON.stringify(results)}`);
                    }
                    resolve(results);
                }
            });
        });
    } catch (error) {
        logRed(`Error en executeQuery: ${error.stack}`);
        throw error;
    }
}
export function executeQueryFromPool(pool, query, values = [], log = false) {
    const formattedQuery = mysql2.format(query, values);

    return new Promise((resolve, reject) => {
        if (log) logYellow(`Ejecutando query: ${formattedQuery}`);

        pool.query(formattedQuery, (err, results) => {
            if (err) {
                if (log) logRed(`Error en executeQuery: ${err.message} - ${formattedQuery}`);
                return reject(err);
            }
            if (log) logYellow(`Query ejecutada con éxito: ${formattedQuery}`);
            resolve(results);
        });
    });
}
