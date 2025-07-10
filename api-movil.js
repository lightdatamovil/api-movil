import express, { json, urlencoded } from 'express';
import cluster from 'cluster';
import cors from 'cors';
import dotenv from 'dotenv';
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
import { closeAllPools, loadCompaniesFromRedis, loadConnectionsPools, redisClient } from './db.js';
import { getUrls } from './src/funciones/urls.js';
import { logBlue, logPurple, logRed } from './src/funciones/logsCustom.js';

dotenv.config({ path: process.env.ENV_FILE || '.env' });

const numCPUs = 2;
const PORT = process.env.PORT || 3000;

async function startWorker() {
    const app = express();
    app.use(json({ limit: '50mb' }));
    app.use(urlencoded({ limit: '50mb', extended: true }));
    app.use(json());
    app.use(cors());
    app.post('/api/testapi', async (req, res) => {
        const startTime = performance.now();
        const endTime = performance.now();
        logPurple(`Tiempo de ejecución: ${endTime - startTime} ms`)
        res.status(200).json({ message: 'API funcionando correctamente' });
    });

    app.get('/ping', (req, res) => {
        const currentDate = new Date();
        currentDate.setHours(currentDate.getHours()); // Resta 3 horas

        // Formatear la hora en el formato HH:MM:SS
        const hours = currentDate.getHours().toString().padStart(2, '0');
        const minutes = currentDate.getMinutes().toString().padStart(2, '0');
        const seconds = currentDate.getSeconds().toString().padStart(2, '0');

        const formattedTime = `${hours}:${minutes}:${seconds}`;

        res.status(200).json({
            hora: formattedTime
        });
    });

    app.post('/api/get-urls', async (req, res) => {
        const startTime = performance.now();

        const urls = getUrls();

        const endTime = performance.now();
        logPurple(`Tiempo de ejecución: ${endTime - startTime} ms`)
        res.status(200).json({ body: urls, message: 'Datos obtenidos correctamente' });
    });
    // Rutas
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

    // Ping de salud
    app.get('/ping', (req, res) => {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const mins = now.getMinutes().toString().padStart(2, '0');
        const secs = now.getSeconds().toString().padStart(2, '0');
        res.json({ hora: `${hours}:${mins}:${secs}` });
    });

    // Manejo de cierre ordenado
    const shutdown = async (signal) => {
        logBlue(`Worker ${process.pid} recibió ${signal}, cerrando recursos…`);
        try {
            await redisClient.quit();
            await closeAllPools();
            logBlue(`Worker ${process.pid} cerrado correctamente.`);
            process.exit(0);
        } catch (err) {
            logRed(`Error en shutdown: ${err.message}`);
            process.exit(1);
        }
    };
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

    // Conexiones iniciales y arranque del servidor
    try {
        await redisClient.connect();
        await loadCompaniesFromRedis();
        await loadConnectionsPools();
        app.listen(PORT, '0.0.0.0', () => {
            logBlue(`Worker ${process.pid} escuchando en puerto ${PORT}`);
        });
    } catch (err) {
        logRed(`Error al iniciar Worker ${process.pid}: ${err.message}`);
        process.exit(1);
    }
}

if (cluster.isMaster) {
    logBlue(`Master ${process.pid} arrancado, forkeando ${numCPUs} workers…`);
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }
    cluster.on('exit', (worker, code) => {
        logBlue(`Worker ${worker.process.pid} murió (code ${code}), creando uno nuevo…`);
        cluster.fork();
    });
} else {
    startWorker();
}
