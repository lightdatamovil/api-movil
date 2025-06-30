import express, { json, urlencoded } from 'express';
import cluster from 'cluster';
import { performance } from 'perf_hooks';
import cors from 'cors';

import accounts from './routes/accounts.js';
import auth from './routes/auth.js';
import shipments from './routes/shipments.js';
import qr from './routes/qr.js';
import home from './routes/home.js';
import users from './routes/users.js';
import map from './routes/map.js';
import settlements from './routes/settlements.js';
import registerVisitRoute from './routes/registerVisit.js';
import collect from './routes/collect.js';

import {
    connectionsPools,
    loadCompaniesFromRedis,
    loadConnectionsPools,
    redisClient
} from './db.js';

import { getUrls } from './src/funciones/urls.js';
import { getUrlsDev } from './src/funciones/urlsdev.js';
import { logBlue, logPurple, logRed, logYellow } from './src/funciones/logsCustom.js';

const numCPUs = 2;
const PORT = 13500;

if (cluster.isMaster) {
    logBlue(`Proceso master ${process.pid} ejecutándose...`);

    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker) => {
        logBlue(`Worker ${worker.process.pid} murió, reiniciando...`);
        cluster.fork();
    });
} else {
    const app = express();
    app.use(json({ limit: '50mb' }));
    app.use(urlencoded({ limit: '50mb', extended: true }));
    app.use(json());
    app.use(cors());

    app.post('/api/testapi', async (req, res) => {
        const startTime = performance.now();
        const endTime = performance.now();
        logPurple(`Tiempo de ejecución: ${endTime - startTime} ms`);
        res.status(200).json({ message: 'API funcionando correctamente' });
    });

    app.get('/ping', (_req, res) => {
        const now = new Date();
        const time = [now.getHours(), now.getMinutes(), now.getSeconds()]
            .map(v => String(v).padStart(2, '0'))
            .join(':');
        res.status(200).json({ hora: time });
    });

    app.post('/api/get-urls', async (req, res) => {
        const startTime = performance.now();
        const { companyId } = req.body;
        const urls = getUrls(companyId);
        const endTime = performance.now();
        logPurple(`Tiempo de ejecución: ${endTime - startTime} ms`);
        res.status(200).json({ body: urls, message: 'Datos obtenidos correctamente' });
    });

    app.post('/api/get-urls-dev', async (req, res) => {
        const startTime = performance.now();
        const { companyId } = req.body;
        const urls = getUrlsDev(companyId);
        const endTime = performance.now();
        logPurple(`Tiempo de ejecución: ${endTime - startTime} ms`);
        res.status(200).json({ body: urls, message: 'Datos obtenidos correctamente' });
    });

    (async () => {
        try {
            await redisClient.connect();
            await loadCompaniesFromRedis();
            await loadConnectionsPools();

            app.use('/api/auth', auth);
            app.use('/api/accounts', accounts);
            app.use('/api/shipments', shipments);
            app.use('/api/settlements', settlements);
            app.use('/api/qr', qr);
            app.use('/api/home', home);
            app.use('/api/users', users);
            app.use('/api/map', map);
            app.use('/api/collect', collect);
            app.use('/api/register-visit', registerVisitRoute);

            // Iniciar servidor y guardar instancia
            const server = app.listen(PORT, '0.0.0.0', () => {
                logBlue(`Worker ${process.pid} escuchando en el puerto ${PORT}`);
            });

            // Shutdown limpio
            async function shutdown(signal) {
                logRed(`\nRecibido ${signal}. Iniciando cierre de recursos...`);

                // Detener nuevas conexiones HTTP
                server.close(() => logYellow('Servidor HTTP dejó de aceptar nuevas conexiones.'));

                // Cerrar Redis
                logYellow('Cerrando cliente Redis...');
                try {
                    await redisClient.quit();
                    logYellow('Cliente Redis desconectado.');
                } catch (e) {
                    logRed(`Error cerrando Redis: ${e.message}`);
                }

                // Cerrar pools de MySQL
                const poolIds = Object.keys(connectionsPools);
                if (poolIds.length === 0) {
                    logYellow('No hay pools de MySQL para cerrar.');
                } else {
                    for (const id of poolIds) {
                        const pool = connectionsPools[id];
                        logYellow(`Cerrando pool MySQL de compañía ${id}...`);
                        try {
                            await pool.promise().end();
                            logYellow(`Pool de MySQL para compañía ${id} cerrado.`);
                        } catch (e) {
                            logRed(`Error cerrando pool ${id}: ${e.message}`);
                        }
                    }
                }

                logBlue('Cierre de recursos completado. Saliendo.');
                process.exit(0);
            }

            process.on('SIGINT', () => shutdown('SIGINT'));
            process.on('SIGTERM', () => shutdown('SIGTERM'));
        } catch (err) {
            logRed(`Error al iniciar el servidor: ${err.stack}`);
            process.exit(1);
        }
    })();
}
