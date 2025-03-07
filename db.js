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

let companiesList = {};
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
        companiesList = await redisClient.get('empresasData');
    } catch (error) {
        console.error("Error en loadCompaniesFromRedis:", error);
        throw error;
    }
}
//hecho
export async function getDrivers(companies) {
    const driversByCompany = {};

    for (const companyId of companies) {
        const dbConfig = getDbConfig(companyId);
        const dbConnection = mysql.createConnection(dbConfig);
        dbConnection.connect();

        try {
            const queryUsers = "SELECT * FROM sistema_usuarios WHERE perfil = 3";
            const resultQueryUsers = await executeQuery(dbConnection, queryUsers, []);

            // Inicializar el objeto para la compañía
            driversByCompany[companyId] = {};

            for (let i = 0; i < resultQueryUsers.length; i++) {
                const row = resultQueryUsers[i];

                // Usar el id del conductor como clave
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
            console.error(`Error en getDrivers para la compañía ${companyId}:`, error);
            throw error;
        } finally {
            dbConnection.end();
        }
    }

    return driversByCompany; // Devolver todos los conductores organizados por compañía
}

//hecho
export async function getClients(companies) {
    const clientsByCompany = {};

    for (const companyId of companies) {
        const dbConfig = getDbConfig(companyId);
        const dbConnection = mysql.createConnection(dbConfig);
        dbConnection.connect();

        try {
            const queryUsers = "SELECT * FROM clientes";
            const resultQueryUsers = await executeQuery(dbConnection, queryUsers, []);

            // Inicializar el objeto para la compañía
            clientsByCompany[companyId] = {};

            for (let i = 0; i < resultQueryUsers.length; i++) {
                const row = resultQueryUsers[i];

                // Agregar el cliente directamente al objeto de la compañía
                clientsByCompany[companyId][row.id] = {
                    id_origen: row.id_origen,
                    fecha_sincronizacion: row.fecha_sincronizacion,
                    did: row.did,
                    codigo: row.codigo,
                    nombre: row.nombre_fantasia,
                    codigos: row.codigos,
                    dataGeo: row.dataGeo,
                };
            }
        } catch (error) {
            console.error(`Error en getClients para la compañía ${companyId}:`, error);
            throw error;
        } finally {
            dbConnection.end();
        }
    }

    return clientsByCompany; // Devolver todos los clientes organizados por compañía
}

//hecho 

export async function getZones(companyId) {
    const dbConfig = getDbConfig(companyId);
    const dbConnection = mysql.createConnection(dbConfig);
    dbConnection.connect();

    try {
        const queryZones = "SELECT * FROM envios_zonas";
        const resultQueryZones = await executeQuery(dbConnection, queryZones, []);

        const zonesByCompany = {};

        // Inicializar el objeto para la compañía
        zonesByCompany[companyId] = {};

        for (let i = 0; i < resultQueryZones.length; i++) {
            const row = resultQueryZones[i];

            // Usar el id de la zona como clave
            zonesByCompany[companyId][row.id] = {
                id: row.id,
                id_origen: row.id_origen,
                fecha_sincronizacion: row.fecha_sincronizacion,
                did: row.did,
                codigo: row.codigo,
                nombre: row.nombre,
                codigos: row.codigos,
                dataGeo: row.dataGeo,
            };
        }

        return zonesByCompany; // Devolver zonas organizadas por compañía
    } catch (error) {
        console.error("Error en getZones:", error);
        throw error;
    } finally {
        dbConnection.end();
    }
}



//hecho
export async function getDriversByCompany(companyId) {
    try {
        // Obtener todos los conductores organizados por compañía
        const drivers = await getDrivers([companyId]);

        // Acceder a los conductores de la compañía específica
        const companyDrivers = drivers[companyId];

        // Retornar los conductores o un array vacío si no hay conductores
        return companyDrivers ? Object.values(companyDrivers) : [];
    } catch (error) {
        console.error("Error en getDriversByCompany:", error);
        throw error;
    }
}



//hecho
export async function getClientsByCompany(companyId) {
    try {
        // Suponiendo que clientList ahora tiene la estructura de múltiples compañías
        const companyClients = clientList[companyId];

        if (companyClients === undefined || companyClients === null || Object.keys(companyClients).length === 0) {
            const clients = await getClients([companyId]); // Llamar a getClients con un array de companyId
            const companyClientsR = clients[companyId] || {}; // Obtener los clientes de la compañía

            return companyClientsR; // Devolver los clientes de la compañía
        } else {
            return companyClients || {}; // Devolver los clientes si ya existen
        }
    } catch (error) {
        console.error("Error en getClientsByCompany:", error);
        throw error;
    }
}

//hecho 
export async function getZonesByCompany(companyId) {
    try {
        // Obtener todas las zonas organizadas por compañía
        const zones = await getZones(companyId);

        // Acceder a las zonas de la compañía específica
        const companyZones = zones[companyId];

        // Retornar las zonas o un array vacío si no hay zonas
        return companyZones ? Object.values(companyZones) : [];
    } catch (error) {
        console.error("Error en getZonesByCompany:", error);
        throw error;
    }
}
export async function getCompanyById(companyId) {
    try {
        // Verificar si companiesList es un objeto y no un array
        let company = companiesList[companyId] || null;

        // Verificar si companiesList no es válido
        if (typeof companiesList !== 'object' || Object.keys(companiesList).length === 0) {
            try {
                await loadCompaniesFromRedis();
       
                // Si companiesList es un string, parsearlo
                if (typeof companiesList === 'string') {
                    companiesList = JSON.parse(companiesList);
                }

                // Obtener la compañía después de cargar
                company = companiesList[companyId] || null;
            } catch (error) {
                console.error("Error al cargar compañías desde Redis:", error);
                throw error;
            }
        }

        return company;
    } catch (error) {
        console.error("Error en getCompanyById:", error);
        throw error;
    }
}


export async function getCompanyByCode(companyCode) {
    try {
       
        if (typeof companiesList !== 'object' || Object.keys(companiesList).length === 0) {
            try {
                await loadCompaniesFromRedis();
            } catch (error) {
                console.error("Error al cargar compañías desde Redis:", error);
                throw error;
            }
        }

     
        let company = null;

        for (const key in companiesList) {
            if (companiesList.hasOwnProperty(key)) {
                const currentCompany = companiesList[key];
                if (String(currentCompany.codigo) === String(companyCode)) {
                    company = currentCompany;
                    break; // Salir del bucle si se encuentra la compañía
                }
            }
        }

        return company;
    } catch (error) {
        console.error("Error en getCompanyByCode:", error);
        throw error;
    }
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
