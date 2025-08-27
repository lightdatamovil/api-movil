import { connect } from 'amqplib';
import dotenv from 'dotenv';
import axios from 'axios';
import { logGreen, logRed, logYellow } from './logsCustom.js';
import { getHoraLocalDePais } from '../../src/funciones/getHoraLocalByPais.js';
import { getFechaConHoraLocalDePais } from './getFechaConHoraLocalByPais.js';
import { generarTokenFechaHoy } from './generarTokenFechaHoy.js';


dotenv.config({ path: process.env.ENV_FILE || '.env' });

const RABBITMQ_URL = process.env.RABBITMQ_URL;
const QUEUE_ESTADOS = process.env.QUEUE_ESTADOS;
const BACKUP_ENDPOINT = "https://serverestado.lightdata.app/estados";

let connection = null;
let channel = null;

async function getChannel() {
    if (channel) return channel;

    try {
        connection = await connect(RABBITMQ_URL);
        channel = await connection.createChannel();
        await channel.assertQueue(QUEUE_ESTADOS, { durable: true });

        process.on('exit', () => {
            try {
                if (channel) channel.close();
                if (connection) connection.close();
            } catch (e) {
                // silencioso
            }
        });

        return channel;
    } catch (err) {
        logRed(`❌ Error al inicializar RabbitMQ: ${err.message}`);
        throw err;
    }
}


// todo aca
export async function sendToShipmentStateMicroService(companyId, userId, estado, shipmentId) {
    const message = {
        didempresa: companyId,
        didenvio: shipmentId,
        estado: estado,
        subestado: null,
        estadoML: null,
        fecha: getHoraLocalDePais(companyId.pais),
        quien: userId,
        operacion: "ingresarFlex",
    };

    try {
        const ch = await getChannel();
        const sent = ch.sendToQueue(QUEUE_ESTADOS, Buffer.from(JSON.stringify(message)), { persistent: true });

        if (sent) {
            logGreen('✅ Mensaje enviado correctamente al microservicio de estados');
        } else {
            logYellow('⚠️ No se pudo enviar el mensaje (buffer lleno)');
            throw new Error('Buffer lleno en RabbitMQ');
        }
    } catch (error) {
        logRed(`❌ Falló RabbitMQ, intentando fallback HTTP: ${error.message}`);

        try {
            const response = await axios.post(BACKUP_ENDPOINT, message);
            logGreen(`✅ Enviado por HTTP con status ${response.status}`);
        } catch (httpError) {
            logRed(`❌ Falló también el envío por HTTP: ${httpError.message}`);
            throw httpError;
        }
    }
}


export async function sendToShipmentStateMicroServiceAPI(company, userId, shipmentId, latitud, longitud, shipmentState) {
    console.log("entre a endpoint");
    const message = {
        didempresa: company.did,
        didenvio: shipmentId,
        estado: shipmentState,
        subestado: null,
        estadoML: null,
        fecha: getFechaConHoraLocalDePais(company.pais),
        quien: userId,
        operacion: 'change-state',
        latitud,
        longitud,
        desde: "api-movil",
        tkn: generarTokenFechaHoy(),
    };
    logGreen(`Enviando mensaje a RabbitMQ: ${JSON.stringify(message)}`);
    try {
        const response = await axios.post(BACKUP_ENDPOINT, message);
        logGreen(`✅ Enviado por HTTP con status ${response.status}`);
    } catch (httpError) {
        logRed(`❌ Falló el envío por HTTP también: ${httpError.message}`);
        throw httpError;
    }
}
