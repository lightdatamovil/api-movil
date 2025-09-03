import redis from 'redis';
import dotenv from 'dotenv';
import mysql2 from 'mysql2';
import { logRed } from 'lightdata-tools';
dotenv.config({ path: process.env.ENV_FILE || ".env" });

/// Redis para obtener las empresas
const redisHost = process.env.REDIS_HOST;
const redisPort = process.env.REDIS_PORT;
const redisPassword = process.env.REDIS_PASSWORD;

/// Base de datos de apimovil
const apimovilDBHost = process.env.APIMOVIL_DB_HOST;
const apimovilDBUser = process.env.APIMOVIL_DB_USER;
const apimovilDBPassword = process.env.APIMOVIL_DB_PASSWORD;
const apimovilDBName = process.env.APIMOVIL_DB_NAME;
const apimovilDBPort = process.env.APIMOVIL_DB_PORT;

/// Usuario y contraseña para los logs de la base de datos de apimovil
const apimovilDbUserForLogs = process.env.APIMOVIL_DB_USER_FOR_LOGS;
const apimovilDbPasswordForLogs = process.env.APIMOVIL_DB_PASSWORD_FOR_LOGS;
const apimovilDbNameForLogs = process.env.APIMOVIL_DB_NAME_FOR_LOGS;

// Produccion
const hostProductionDb = process.env.PRODUCTION_DB_HOST;
const portProductionDb = process.env.PRODUCTION_DB_PORT;

export const redisClient = redis.createClient({
    socket: {
        host: redisHost,
        port: redisPort,
    },
    password: redisPassword,
});

redisClient.on('error', (error) => {
    logRed(`Error al conectar con Redis: ${error.stack}`);
});

let companiesList = {};

let accountList = {};
let driverList = {};
let zoneList = {};
let clientList = {};

export function getDbConfig(companyId) {
    return {
        host: apimovilDBHost,
        user: apimovilDBUser + companyId,
        password: apimovilDBPassword,
        database: apimovilDBName + companyId,
        port: apimovilDBPort
    };
}

export const poolLocal = mysql2.createPool({
    host: apimovilDBHost,
    user: apimovilDbUserForLogs,
    password: apimovilDbPasswordForLogs,
    database: apimovilDbNameForLogs,
    port: apimovilDBPort,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

export function getProdDbConfig(company) {
    return {
        host: hostProductionDb,
        user: company.dbuser,
        password: company.dbpass,
        database: company.dbname,
        port: portProductionDb,
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

async function loadCompaniesFromRedis() {
    const companiesListString = await redisClient.get('empresasData');

    companiesList = JSON.parse(companiesListString);

}

export async function getCompanyById(companyId) {
    let company = companiesList[companyId];

    if (company == undefined || Object.keys(companiesList).length === 0) {
        await loadCompaniesFromRedis();

        company = companiesList[companyId];

    }

    return company;
}

export async function getCompanyByCode(companyCode) {
    let company;

    if (Object.keys(companiesList).length === 0) {
        await loadCompaniesFromRedis();
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
}

async function loadAccountList(dbConnection, companyId, senderId) {
    const querySelectClientesCuentas = `
            SELECT did, didCliente, ML_id_vendedor 
            FROM clientes_cuentas 
            WHERE superado = 0 AND elim = 0 AND tipoCuenta = 1 AND ML_id_vendedor != ''
        `;

    const result = await executeQuery(dbConnection, querySelectClientesCuentas);

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
}

export async function getAccountBySenderId(dbConnection, companyId, senderId) {
    if (accountList === undefined || accountList === null || Object.keys(accountList).length === 0 || !accountList[companyId]) {
        await loadAccountList(dbConnection, companyId, senderId);
    }

    let account = accountList[companyId][senderId];
    if (!account) {
        await loadAccountList(dbConnection, companyId, senderId);
        account = accountList[companyId][senderId];
    }

    return account;
}

async function loadClients(dbConnection, companyId) {
    if (!clientList[companyId]) {
        clientList[companyId] = {}
    }

    const queryUsers = "SELECT * FROM clientes";
    const resultQueryUsers = await executeQuery(dbConnection, queryUsers, []);

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
}

export async function getClientsByCompany(dbConnection, companyId) {
    let companyClients = clientList[companyId];

    if (companyClients == undefined || Object.keys(clientList).length === 0) {
        await loadClients(dbConnection, companyId);

        companyClients = clientList[companyId];
    }

    return companyClients;
}

async function loadZones(dbConnection, companyId) {
    if (!zoneList[companyId]) {
        zoneList[companyId] = {}
    }

    const queryZones = "SELECT * FROM envios_zonas";
    const resultZones = await executeQuery(dbConnection, queryZones, []);

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
}

export async function getZonesByCompany(dbConnection, companyId) {
    let companyZones = zoneList[companyId];

    if (companyZones == undefined || Object.keys(zoneList).length === 0) {
        await loadZones(dbConnection, companyId);

        companyZones = zoneList[companyId];
    }

    return companyZones;
}

async function loadDrivers(dbConnection, companyId) {
    if (!driverList[companyId]) {
        driverList[companyId] = {}
    }

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

    const resultQueryUsers = await executeQuery(dbConnection, queryUsers, []);

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
}

export async function getDriversByCompany(dbConnection, companyId) {
    let companyDrivers = driverList[companyId];

    if (companyDrivers == undefined || Object.keys(driverList).length === 0) {
        await loadDrivers(dbConnection, companyId);

        companyDrivers = driverList[companyId];
    }

    return companyDrivers;
}

