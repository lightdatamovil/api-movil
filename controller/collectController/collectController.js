import mysql from 'mysql';
import { getProdDbConfig, executeQuery } from '../../db.js';



export async function getCollectList({ quien, desde, hasta }, company) {
    return new Promise((resolve, reject) => {
        try {
            const dbConfig = getProdDbConfig(company);
            const dbConnection = mysql.createConnection(dbConfig);

            dbConnection.connect((err) => {
                if (err) {
                    console.error("Error al conectar a la base de datos:", err);
                    return reject({ estadoRespuesta: false, body: "", mensaje: "Error de conexión a la base de datos." });
                }

                const query = `
                    SELECT fecha, COUNT(didEnvio) as total 
                    FROM colecta_asignacion 
                    WHERE superado = 0 AND didChofer = ? AND elim = 0 AND fecha BETWEEN ? AND ? 
                    GROUP BY fecha
                `;

                dbConnection.query(query, [quien, desde, hasta], (error, results) => {
                    dbConnection.end();

                    if (error) {
                        console.error("Error en la consulta SQL:", error);
                        return reject({ estadoRespuesta: false, body: "", mensaje: "Error en la consulta." });
                    }

                    const Adatacolecta = results.map(row => ({ fecha: row.fecha, total: row.total }));
                    resolve({ estadoRespuesta: true, body: Adatacolecta, mensaje: "" });
                });
            });
        } catch (error) {
            console.error("Error en obtenerEnvios:", error);
            reject({ estadoRespuesta: false, body: "", mensaje: "Error interno del servidor." });
        }
    });
}




export async function obtenerColectaDelDia({ didEmpresa, quien, perfil, fecha },company) {
    return new Promise(async (resolve, reject) => {
        try {
            const dbConfig = getProdDbConfig(company);
          
            const dbConnection = mysql.createConnection(dbConfig);
            dbConnection.connect();

            // Obtener nombres de clientes
            const clientesQuery = "SELECT did, nombre_fantasia FROM clientes WHERE superado=0 AND elim=0";
            dbConnection.query(clientesQuery, (err, clientesResult) => {
                if (err) {
                    dbConnection.end();
                    return reject({ estadoRespuesta: false, body: "", mensaje: "Error en la consulta de clientes." });
                }

                let Aclientes = {};
                clientesResult.forEach(row => {
                    Aclientes[row.did] = row.nombre_fantasia;
                });

                // Obtener envíos del día
                const enviosQuery = `
                    SELECT didCliente, didEnvio 
                    FROM colecta_asignacion 
                    WHERE superado=0 AND elim=0 AND didChofer = ? AND fecha = ?
                `;
                dbConnection.query(enviosQuery, [quien, fecha], (err, enviosResult) => {
                    dbConnection.end();

                    if (err) {
                        return reject({ estadoRespuesta: false, body: "", mensaje: "Error en la consulta de envíos." });
                    }

                    let Adatacolecta = {};
                    enviosResult.forEach(row => {
                        if (!Adatacolecta[row.didCliente]) {
                            Adatacolecta[row.didCliente] = {
                                nombre_fantasia: Aclientes[row.didCliente] || "Cliente desconocido",
                                total: 0
                            };
                        }
                        Adatacolecta[row.didCliente].total += 1;
                    });

                    let respuesta = Object.entries(Adatacolecta).map(([id, data]) => ({
                        id,
                        ...data
                    }));

                    resolve({ estadoRespuesta: true, body: respuesta, mensaje: "" });
                });
            });
        } catch (error) {
            reject({ estadoRespuesta: false, body: "", mensaje: "Error interno del servidor." });
        }
       
    });
}



export async function obtenerEnviosPorCliente({ didEmpresa, quien, perfil, fecha, didcliente },company) {
    return new Promise(async (resolve, reject) => {
        try {
            const dbConfig = getProdDbConfig(company);
          
            const dbConnection = mysql.createConnection(dbConfig);
            dbConnection.connect();

            // Consulta SQL
            const sql = `
                SELECT ca.didEnvio, e.ml_shipment_id, e.ml_venta_id, e.flex
                FROM colecta_asignacion AS ca
                JOIN envios AS e ON e.did = ca.didEnvio AND e.superado = 0 AND e.elim = 0
                WHERE ca.superado = 0 AND ca.elim = 0 AND ca.fecha = ? AND ca.didCliente = ?
            `;

            dbConnection.query(sql, [fecha, didcliente], (err, result) => {
                dbConnection.end();

                if (err) {
                    return reject({ estadoRespuesta: false, body: "", mensaje: "Error en la consulta de envíos." });
                }

                let Adatacolecta = result.map(row => ({
                    didEnvio: Number(row.didEnvio),
                    flex: Number(row.flex),
                    ml_shipment_id: row.ml_shipment_id || null,
                    ml_venta_id: row.ml_venta_id || null
                }));

                resolve({ estadoRespuesta: true, body: Adatacolecta, mensaje: "" });
            });
        } catch (error) {
            reject({ estadoRespuesta: false, body: "", mensaje: "Error interno del servidor." });
        }
    });
}

export async function obtenerLiquidaciones({ didEmpresa, quien, perfil, operador, idLiquidacion, desde, hasta },company) {
    return new Promise(async (resolve, reject) => {
        try {
            const dbConfig = getProdDbConfig(company);
          
            const dbConnection = mysql.createConnection(dbConfig);
            dbConnection.connect();

            let sql, result;
            let Adatacolecta = [];

            // Consulta según el tipo de operador
            if (operador === "listado") {
                sql = `
                    SELECT did, DATE_FORMAT(desde, '%d/%m/%Y') AS desde, total, 
                           DATE_FORMAT(hasta, '%d/%m/%Y') AS hasta, DATE_FORMAT(fecha, '%d/%m/%Y') AS fecha
                    FROM colecta_liquidaciones
                    WHERE superado = 0 AND elim = 0 AND tipo = 2
                    AND fecha BETWEEN ? AND ?
                `;
                dbConnection.query(sql, [desde, hasta], (err, result) => {
                    if (err) return reject({ estadoRespuesta: false, body: "", mensaje: "Error en la consulta." });

                    Adatacolecta = result.map(row => ({
                        did: Number(row.did),
                        total: Number(row.total),
                        desde: row.desde,
                        hasta: row.hasta,
                        fecha: row.fecha
                    }));

                    dbConnection.end();
                    resolve({ estadoRespuesta: true, body: Adatacolecta, mensaje: "" });
                });
            } else if (operador === "detallecolecta") {
                // Obtener idlineas de la liquidación
                sql = "SELECT idlineas FROM colecta_liquidaciones WHERE superado = 0 AND elim = 0 AND did = ?";
                dbConnection.query(sql, [idLiquidacion], (err, result) => {
                    if (err) return reject({ estadoRespuesta: false, body: "", mensaje: "Error al obtener las líneas." });

                    const idlineas = result[0]?.idlineas;

                    if (idlineas) {
                        // Obtener detalles de los envíos
                        sql = `
                            SELECT eh.didEnvio, e.ml_shipment_id, e.didCliente, c.nombre_fantasia, eh.fecha
                            FROM envios_historial AS eh
                            LEFT JOIN envios AS e ON e.superado = 0 AND e.elim = 0 AND e.did = eh.didEnvio
                            LEFT JOIN clientes AS c ON c.superado = 0 AND c.elim = 0 AND c.did = e.didCliente
                            WHERE eh.superado = 0 AND eh.elim = 0 AND eh.id IN (?)
                        `;
                        dbConnection.query(sql, [idlineas], (err, result) => {
                            if (err) return reject({ estadoRespuesta: false, body: "", mensaje: "Error al obtener los detalles de los envíos." });

                            Adatacolecta = result.map(row => ({
                                didEnvio: row.didEnvio,
                                ml_shipment_id: row.ml_shipment_id,
                                cliente: row.nombre_fantasia,
                                fecha: row.fecha
                            }));

                            dbConnection.end();
                            resolve({ estadoRespuesta: true, body: Adatacolecta, mensaje: "" });
                        });
                    } else {
                        dbConnection.end();
                        resolve({ estadoRespuesta: false, body: "", mensaje: "No se encontraron líneas para la liquidación." });
                    }
                });
            } else {
                dbConnection.end();
                reject({ estadoRespuesta: false, body: "", mensaje: "Operador no válido." });
            }
        } catch (error) {
            reject({ estadoRespuesta: false, body: "", mensaje: "Error interno del servidor." });
        }
    });
}


export async function obtenerRutaChofer({ didEmpresa, didUsuario, fecha },company) {
    return new Promise(async (resolve, reject) => {
        try {
          
            const dbConfig = getProdDbConfig(company);
          
            const dbConnection = mysql.createConnection(dbConfig);
            dbConnection.connect();
            let sql, result;
            let Adata = { conruta: 0, didRuta: 0, cliente: [] };

            // Buscar ruta del chofer
            sql = "SELECT id, did, dataRuta FROM colecta_ruta WHERE superado = 0 AND elim = 0 AND fecha = ? AND didChofer = ?";
            dbConnection.query(sql, [fecha, didUsuario], (err, result) => {
                if (err) return reject({ estadoRespuesta: false, body: "", mensaje: "Error al obtener la ruta del chofer." });

                if (result.length > 0) {
                    const dataRuta = JSON.parse(result[0].dataRuta);
                    Adata.conruta = 1;
                    Adata.didRuta = result[0].did * 1;
                    Adata.dataRuta = {
                        evitoAU: dataRuta.evitoAU,
                        desde: dataRuta.desde * 1,
                        lat: dataRuta.inicioGeo.lat,
                        long: dataRuta.inicioGeo.long
                    };

                    // Obtener las paradas de la ruta
                    sql = `
                        SELECT CRP.orden, CRP.didCliente, cld.ilong, cld.ilat, cld.calle, cld.numero, cld.ciudad, cl.nombre_fantasia
                        FROM colecta_ruta_paradas AS CRP
                        LEFT JOIN clientes AS cl ON cl.superado = 0 AND cl.elim = 0 AND cl.did = CRP.didCliente
                        LEFT JOIN clientes_direcciones AS cld ON cld.superado = 0 AND cld.elim = 0 AND cld.cliente = CRP.didCliente
                        WHERE CRP.superado = 0 AND CRP.elim = 0 AND CRP.didRuta = ? ORDER BY CRP.orden ASC;
                    `;
                    dbConnection.query(sql, [Adata.didRuta], (err, result) => {
                        if (err) return reject({ estadoRespuesta: false, body: "", mensaje: "Error al obtener las paradas de la ruta." });

                        Adata.cliente = result.map(row => ({
                            orden: row.orden ? (isNaN(row.orden) ? null : Number(row.orden)) : null,
                            didCliente: row.didCliente ? (isNaN(row.didCliente) ? null : Number(row.didCliente)) : null,
                            calle: row.calle || "",
                            numero: String(row.numero || ""),
                            ciudad: row.ciudad || "",
                            latitud: row.ilat ? Number(row.ilat) : null,
                            longitud: row.ilong ? Number(row.ilong) : null,
                            nombreCliente: row.nombre_fantasia || ""
                        }));

                        dbConnection.end();
                        resolve({ estadoRespuesta: true, body: Adata, mensaje: "Se encontró la ruta del chofer." });
                    });
                } else {
                    // Si no tiene ruta, obtener los datos de asignación
                    Adata.dataRuta = null;
                    sql = `
                        SELECT ca.didCliente, cd.calle, cd.numero, cd.localidad, cd.ciudad, cd.provincia, cd.ilong, cd.ilat, c.nombre_fantasia
                        FROM colecta_asignacion AS ca
                        LEFT JOIN clientes_direcciones AS cd ON cd.superado = 0 AND cd.elim = 0 AND cd.cliente = ca.didCliente
                        LEFT JOIN clientes AS c ON c.superado = 0 AND c.elim = 0 AND cd.cliente = c.did
                        WHERE ca.fecha LIKE ? AND ca.superado = 0 AND ca.elim = 0 AND ca.didChofer = ? GROUP BY ca.didCliente;
                    `;
                    dbConnection.query(sql, [fecha, didUsuario], (err, result) => {
                        if (err) return reject({ estadoRespuesta: false, body: "", mensaje: "Error al obtener los datos de asignación." });

                        Adata.cliente = result.map(row => ({
                            orden: row.orden ? (isNaN(row.orden) ? null : Number(row.orden)) : null,
                            didCliente: row.didCliente ? (isNaN(row.didCliente) ? null : Number(row.didCliente)) : null,
                            calle: row.calle || "",
                            numero: String(row.numero || ""),
                            ciudad: row.ciudad || "",
                            localidad: row.localidad || "",
                            provincia: row.provincia || "",
                            latitud: row.ilat ? Number(row.ilat) : null,
                            longitud: row.ilong ? Number(row.ilong) : null,
                            nombreCliente: row.nombre_fantasia || ""
                        }));

                        dbConnection.end();
                        resolve({ estadoRespuesta: true, body: Adata, mensaje: "No tiene ruta asignada, pero se encontraron datos de asignación." });
                    });
                }
            });
        } catch (error) {
            reject({ estadoRespuesta: false, body: "", mensaje: "Error interno del servidor." });
        }
    });
}


export async function obtenerRutaNotificaciones({ didEmpresa, didUsuario },company) {
    return new Promise(async (resolve, reject) => {
        try {
            
            const dbConfig = getProdDbConfig(company);
          
            const dbConnection = mysql.createConnection(dbConfig);
            dbConnection.connect();
            // Mensaje de inicio (similar al echo)
            console.log("Iniciar ruta notificaciones colecta clientes");

            // Aquí podemos agregar la lógica de obtener las rutas o notificaciones si fuese necesario.
            
            dbConnection.end();
            resolve({ estadoRespuesta: true, body: {}, mensaje: "Se encontró la ruta del chofer." });
        } catch (error) {
            reject({ estadoRespuesta: false, body: "", mensaje: "Error interno del servidor." });
        }
    });
}


export async function guardarRuta({ didEmpresa, didUsuario, fechaOpe, dataRuta, ordenes },company) {
    return new Promise((resolve, reject) => {
        try {

            // Conectar a Redis
            const dbConfig = getProdDbConfig(company);
          
            const dbConnection = mysql.createConnection(dbConfig);
            dbConnection.connect();
        
                // Formatear fechaOperativa
                const fechaOpeFormatted = fechaOpe.split('/').reverse().join('-');
                const fecha = new Date().toISOString().split('T')[0];
       

                // Verificar si existe una ruta activa
                let didAsuperar = 0;
              const query=  dbConnection.query(
                    "SELECT did FROM colecta_ruta WHERE superado = 0 AND elim = 0 AND didChofer = ?",
                    [didUsuario],
                    
                    (err, rows) => {
                        console.log("Consulta SQL:", query.sql);

        console.log("Filas devueltas:", rows); // Aquí imprimimos las filas
                        console.log(rows);
                        

                        console.log(didUsuario);
                        
                        if (err) {
                            dbConnection.end();
                            return reject({ estadoRespuesta: false, body: "", mensaje:err });
                        }

                        if (rows.length > 0) {
                            didAsuperar = rows[0].did;
                        }

                        // Si existe una ruta activa, la marcamos como superada
                        if (didAsuperar !== 0) {
                            dbConnection.query(
                                "UPDATE colecta_ruta SET superado = 1 WHERE superado = 0 AND elim = 0 AND did = ? LIMIT 1",
                                [didAsuperar],
                                (err) => {
                                    if (err) {
                                        dbConnection.end();
                                        return reject({ estadoRespuesta: false, body: "", mensaje: "Error al actualizar ruta activa." });
                                    }

                                    dbConnection.query(
                                        "UPDATE colecta_ruta_paradas SET superado = 1 WHERE superado = 0 AND elim = 0 AND didRuta = ?",
                                        [didAsuperar],
                                        (err) => {
                                            if (err) {
                                                dbConnection.end();
                                                return reject({ estadoRespuesta: false, body: "", mensaje: "Error al actualizar paradas." });
                                            }

                                            // Insertar nueva ruta
                                            const query = "INSERT INTO colecta_ruta (desde, fecha, fechaOperativa, didChofer, quien, dataRuta) VALUES (?, ?, ?, ?, ?, ?)";
                                            dbConnection.query(query, [2, fecha, fechaOpeFormatted, didUsuario, didUsuario, JSON.stringify(dataRuta)], (err, result) => {
                                                if (err) {
                                                    dbConnection.end();
                                                    return reject({ estadoRespuesta: false, body: "", mensaje: "Error al insertar nueva ruta." });
                                                }

                                                const idNuevo = result.insertId;

                                                if(ordenes.length == 0){
                                                    console.log("no llegamos ");
                                                    return "no llegamos "
                                                    
                                                }

                                                // Insertar nuevas paradas
                                                const insertParadas = ordenes.map((ordenData) => {
                                                    const { orden, cliente, ordenLlegada } = ordenData;
                                                    return new Promise((resolve, reject) => {
                                                        const queryParada = "INSERT INTO colecta_ruta_paradas (didRuta, didCliente, orden, demora, fecha_colectado, quien) VALUES (?, ?, ?, ?, ?, ?)";
                                                        dbConnection.query(queryParada, [idNuevo, cliente, orden, ordenLlegada, fechaOpeFormatted, didUsuario], (err) => {
                                                            if (err) {
                                                                return reject({ estadoRespuesta: false, body: "", mensaje: "Error al insertar parada." });
                                                            }
                                                            resolve();
                                                        });
                                                    });
                                                });

                                                // Ejecutar todas las inserciones de paradas
                                                Promise.all(insertParadas)
                                                    .then(() => {
                                                        dbConnection.end();
                                                        resolve({
                                                            estadoRespuesta: true,
                                                            body: {},
                                                            mensaje: "La ruta se guarda exitosamente."
                                                        });
                                                    })
                                                    .catch((error) => {
                                                        dbConnection.end();
                                                        reject(error);
                                                    });
                                            });
                                        });
                                });
                        } else {
                            // Si no tiene ruta activa, crear nueva ruta
                            const query = "INSERT INTO colecta_ruta (desde, fecha, fechaOperativa, didChofer, quien, dataRuta) VALUES (?, ?, ?, ?, ?, ?)";
                            dbConnection.query(query, [2, fecha, fechaOpeFormatted, didUsuario, didUsuario, JSON.stringify(dataRuta)], (err, result) => {
                                if (err) {
                                    dbConnection.end();
                                    return reject({ estadoRespuesta: false, body: "", mensaje: "Error al insertar nueva ruta." });
                                }

                                const idNuevo = result.insertId;

                                // Insertar nuevas paradas
                                const insertParadas = ordenes.map((ordenData) => {
                                    const { orden, cliente, ordenLlegada } = ordenData;
                                    return new Promise((resolve, reject) => {
                                        const queryParada = "INSERT INTO colecta_ruta_paradas (didRuta, didCliente, orden, demora, fecha_colectado, quien) VALUES (?, ?, ?, ?, ?, ?)";
                                        dbConnection.query(queryParada, [idNuevo, cliente, orden, ordenLlegada, fechaOpeFormatted, didUsuario], (err) => {
                                            if (err) {
                                                return reject({ estadoRespuesta: false, body: "", mensaje: "Error al insertar parada." });
                                            }
                                            resolve();
                                        });
                                    });
                                });

                                // Ejecutar todas las inserciones de paradas
                                Promise.all(insertParadas)
                                    .then(() => {
                                        dbConnection.end();
                                        resolve({
                                            estadoRespuesta: true,
                                            body: {},
                                            mensaje: "La ruta se guarda exitosamente."
                                        });
                                    })
                                    .catch((error) => {
                                        dbConnection.end();
                                        reject(error);
                                    });
                            });
                        }
                    });
            
        } catch (error) {
            console.error(error);
            reject({
                estadoRespuesta: false,
                body: "",
                mensaje: "Error interno del servidor."
            });
        }
    });
}
