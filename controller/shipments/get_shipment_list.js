import { executeQuery, getClientsByCompany, getDriversByCompany, getDbConfig } from '../../db.js';
import mysql2 from 'mysql';
import { logRed } from '../../src/funciones/logsCustom.js';
import CustomException from '../../classes/custom_exception.js';

export async function shipmentList(company, userId, profile, from, shipmentStates, isAssignedToday) {
    const dbConfig = getDbConfig(company.did);
    const dbConnection = mysql2.createConnection(dbConfig);
    dbConnection.connect();

    try {
        const hoy = new Date().toISOString().split('T')[0];
        // Obtener clientes y choferes
        const clientes = await getClientsByCompany(dbConnection, company.did);
        const drivers = await getDriversByCompany(dbConnection, company.did);

        // Variables para personalizar la consulta según el perfil
        let sqlchoferruteo = "";
        let leftjoinCliente = "";
        let sqlduenio = "";
        let estadoAsignacion = "";

        if (profile == 2) {
            leftjoinCliente = `LEFT JOIN sistema_usuarios_accesos as sua ON(sua.superado = 0 AND sua.elim = 0 AND sua.usuario = ${userId})`;
            sqlduenio = "AND e.didCliente = sua.codigo_empleado";
        } else if (profile == 3) {
            sqlduenio = `AND e.choferAsignado = ${userId} `;
            sqlchoferruteo = ` AND r.didChofer = ${userId} `;
        }

        if (company.did == 4) {
            estadoAsignacion = ', e.estadoAsignacion';
        }

        const b = isAssignedToday ? `AND e.asignacionFecha > '${hoy} 00:00:00'` : '';
        const c = isAssignedToday ? `AND e.asignacionFecha > '${hoy} 00:00:00'` : `AND e.fechaHistorial BETWEEN '${from} 00:00:00' AND '${hoy} 23:59:59'`;

        if (shipmentStates.length == 0) {
            return [];
        }

        const estadosQuery = `(${shipmentStates.join(',')})`;

        const query = `SELECT
                e.did as didEnvio,
                e.flex,
                e.ml_shipment_id,
                e.ml_venta_id,
                e.didEstado as estado,
                e.didCliente,
                DATE_FORMAT(e.fecha_inicio, '%d/%m/%Y') as fecha_inicio,
                DATE_FORMAT(e.fechaHistorial, '%d/%m/%Y') as fecha_historial,
                ${estadoAsignacion} e.nombreDestinatario as destination_receiver_name,
                e.destination_shipping_address_line as address_line,
                edd.address_line as address_lineEDD,
                e.destination_shipping_zip_code as cp,
                edd.cp as cpEDD,
                e.destination_city_name as localidad,
                edd.localidad as localidadEDD,
                edd.provincia,
                e.destination_receiver_phone,
                ROUND(e.lat, 8) as lat,
                ROUND(e.long, 8) AS lng,
                e.logisticainversa as valor,
                e.destination_comments,
                edd.destination_comments AS destination_commentsEDD,
                e.orden,
                ec.didCampoCobranza,
                e.choferAsignado,
                e.monto_a_cobrar,
                e.cobranza
            FROM
                envios as e
                LEFT JOIN envios_direcciones_destino as edd on(
                    edd.superado = 0
                    and edd.elim = 0
                    and edd.didEnvio = eh.didEnvio
                ) ${leftjoinCliente}
            WHERE
                eh.superado = 0
                AND eh.elim = 0
                AND e.elim = 0
                ${b}
                ${c}
                ${sqlduenio}
                AND eh.estado IN ${estadosQuery}
            GROUP BY eh.didEnvio
    ORDER BY rp.orden ASC
    `;

        const rows = await executeQuery(dbConnection, query, []);
        const lista = [];
        for (const row of rows) {
            const lat = row.lat !== '0' ? row.lat : '0';
            const long = row.lng !== '0' ? row.lng : '0';
            const logisticainversa = row.valor !== null;
            const estadoAsignacionVal = row.estadoAsignacion || 0;
            const monto = row.monto_total_a_cobrar || 0;
            const nombre = clientes[row.didCliente] ? clientes[row.didCliente].nombre : 'Cliente no encontrado';
            const nombreChofer = drivers[row.choferAsignado] ? drivers[row.choferAsignado].nombre : 'Chofer no encontrado';
            const isOnTheWay = (row.estado_envio == 2 || row.estado_envio == 11 || row.estado_envio == 12) ||
                (company.did == 20 && row.estado_envio == 16);
            lista.push({
                didEnvio: row.didEnvio * 1,
                flex: row.flex * 1,
                shipmentid: row.ml_shipment_id,
                ml_venta_id: row.ml_venta_id,
                estado: row.estado * 1,
                nombreCliente: nombre,
                didCliente: row.didCliente * 1,
                fechaEmpresa: row.fecha_inicio,
                fechaHistorial: row.fecha_historial || null,
                estadoAsignacion: estadoAsignacionVal * 1,
                nombreDestinatario: row.destination_receiver_name,
                direccion1: row.address_line,
                direccion2: `CP ${row.cp}, ${row.localidad} `,
                provincia: row.provincia || 'Sin provincia',
                telefono: row.destination_receiver_phone,
                lat: lat,
                long: long,
                logisticainversa: logisticainversa,
                observacionDestinatario: row.destination_comments,
                hasNextDeliverButton: isOnTheWay && row.proximaentregaId == null,
                orden: row.orden * 1,
                cobranza: 0,
                chofer: nombreChofer,
                choferId: row.choferAsignado * 1,
                monto_a_cobrar: cobranza == 4 ? monto : 0,
            });
        }
        return lista;
    } catch (error) {
        logRed(`Error en shipmentList: ${error.stack} `);

        if (error instanceof CustomException) {
            throw error;
        }
        throw new CustomException({
            title: 'Error obteniendo lista de envíos',
            message: error.message,
            stack: error.stack
        });
    } finally {
        dbConnection.end();
    }
}