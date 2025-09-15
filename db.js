import redis from 'redis';
import dotenv from 'dotenv';
import { createPool } from 'mysql2/promise';
import { CompaniesService, logRed } from 'lightdata-tools';

dotenv.config({ path: process.env.ENV_FILE || ".env" });

export const port = process.env.PORT;
/// Redis para obtener las empresas
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

/// Base de datos de apimovil
const apimovilDBHost = process.env.APIMOVIL_DB_HOST;
const apimovilDBUser = process.env.APIMOVIL_DB_USER;
const apimovilDBPassword = process.env.APIMOVIL_DB_PASSWORD;
const apimovilDBName = process.env.APIMOVIL_DB_NAME;
const apimovilDBPort = process.env.APIMOVIL_DB_PORT;
export function getDbConfig(companyId) {
    return {
        host: apimovilDBHost,
        user: apimovilDBUser + companyId,
        password: apimovilDBPassword,
        database: apimovilDBName + companyId,
        port: apimovilDBPort
    };
}


/// Usuario y contraseña para los logs de la base de datos de apimovil
const apimovilDbUserForLogs = process.env.APIMOVIL_DB_USER_FOR_LOGS;
const apimovilDbPasswordForLogs = process.env.APIMOVIL_DB_PASSWORD_FOR_LOGS;
const apimovilDbNameForLogs = process.env.APIMOVIL_DB_NAME_FOR_LOGS;

// Produccion
export const hostProductionDb = process.env.PRODUCTION_DB_HOST;
export const portProductionDb = process.env.PRODUCTION_DB_PORT;

/// MICROSERVICIO DE ESTADOS
export const rabbitUrl = process.env.RABBIT_URL;
export const queueEstados = process.env.QUEUE_ESTADOS;
export const urlEstadosMicroservice = process.env.URL_ESTADOS_MICROSERVICE;

export const jwtSecret = process.env.JWT_SECRET;
export const jwtIssuer = process.env.JWT_ISSUER;
export const jwtAudience = process.env.JWT_AUDIENCE;

redisClient.on('error', (error) => {
    logRed(`Error al conectar con Redis: ${error.stack}`);
});


export const companiesService = new CompaniesService({ redisClient, redisKey: "empresasData" })

export const poolLocal = createPool({
    host: apimovilDBHost,
    user: apimovilDbUserForLogs,
    password: apimovilDbPasswordForLogs,
    database: apimovilDbNameForLogs,
    port: Number(apimovilDBPort),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

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
