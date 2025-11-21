import { executeQuery, poolLocal } from "../../db.js";
import { logGreen, logRed } from "./logsCustom.js";

export async function crearLog(empresa, usuario, perfil, body, tiempo, resultado, endpoint, exito) {
    try {
        // Si 'resultado' vino como JSON string, conviértelo a objeto
        let resultadoObj = typeof resultado === 'string'
            ? JSON.parse(resultado)
            : resultado;
        let bodyObj = typeof body === 'string'
            ? JSON.parse(body)
            : body;

        // Normaliza el endpoint (quita comillas sobrantes)
        const endpointClean = endpoint.replace(/"/g, '');

        if (endpointClean === '/company-identification' && exito == 1) {
            resultadoObj.image = 'Imagen eliminada por logs';
        }
        if (endpointClean === '/upload-image' || endpointClean === '/change-profile-picture') {
            bodyObj.image = 'Imagen eliminada por logs';
        }
        const sqlCreate = `
            CREATE TABLE IF NOT EXISTS logs_v2 (
                id INT(11) NOT NULL AUTO_INCREMENT,
                empresa INT(11) DEFAULT NULL,
                usuario INT(11) DEFAULT NULL,
                perfil INT(11) DEFAULT NULL,
                body VARCHAR(1024) DEFAULT NULL,
                tiempo VARCHAR(150) DEFAULT NULL,
                resultado VARCHAR(1024) DEFAULT NULL,
                endpoint VARCHAR(255) DEFAULT NULL,
                autofecha DATETIME DEFAULT CURRENT_TIMESTAMP(),
                exito TINYINT(1) DEFAULT NULL,
                PRIMARY KEY (id),
                KEY idx_empresa (empresa),
                KEY idx_usuario (usuario),
                KEY idx_perfil (perfil),
                KEY idx_empresa_usuario (empresa, usuario)
            ) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_bin;
        `;

        await executeQuery(poolLocal, sqlCreate);
        const sqlLog = `
            INSERT INTO logs_v2
                (empresa, usuario, perfil, body, tiempo, resultado, endpoint, exito)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        // Siempre stringify para que el driver reciba un string
        const values = [
            empresa,
            usuario,
            perfil,
            JSON.stringify(bodyObj),
            tiempo,
            JSON.stringify(resultadoObj),
            endpointClean,
            exito ? 1 : 0
        ];

        await executeQuery(poolLocal, sqlLog, values);
        logGreen(`Log creado: ${JSON.stringify(values)}`);
    } catch (error) {
        logRed(`Error en crearLog: ${error.stack}`);
        throw error;
    }
}
