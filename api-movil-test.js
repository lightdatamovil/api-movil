import express, { json, urlencoded } from 'express';
import cluster from 'cluster';
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
import { getCompanyById, redisClient } from './db.js';
import { getUrls } from './src/funciones/urls.js';
import { getUrlsDev } from './src/funciones/urlsdev.js';
import { logBlue, logPurple, logRed } from './src/funciones/logsCustom.js';
import cors from 'cors';

const numCPUs = 2;
const PORT = 13500;

if (cluster.isMaster) {
    logBlue(`Proceso master ${process.pid} ejecutándose...`);

    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
        logBlue(`Worker ${worker.process.pid} murió, reiniciando...`);
        cluster.fork();
    });
} else {
    const app = express();
    app.use(json({ limit: '50mb' }));
    app.use(urlencoded({ limit: '50mb', extended: true }));
    app.use(json());
    app.use(cors());

    app.post('/api-test/testapi', async (req, res) => {
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

    app.post('/api-test/get-urls', async (req, res) => {
        const startTime = performance.now();
        const { companyId } = req.body;

        const company = await getCompanyById(companyId);

        const urls = getUrls(company);

        const endTime = performance.now();
        logPurple(`Tiempo de ejecución: ${endTime - startTime} ms`)
        res.status(200).json({ body: urls, message: 'Datos obtenidos correctamente' });
    });

    app.post('/api-test/get-urls-dev', async (req, res) => {
        const startTime = performance.now();
        const { companyId } = req.body;

        const company = await getCompanyById(companyId);

        const urls = getUrlsDev(company);

        const endTime = performance.now();
        logPurple(`Tiempo de ejecución: ${endTime - startTime} ms`)
        res.status(200).json({ body: urls, message: 'Datos obtenidos correctamente' });
    });

    (async () => {
        try {
            await redisClient.connect();

            app.use('/api-test/auth', auth);
            app.use('/api-test/accounts', accounts);
            app.use('/api-test/shipments', shipments);
            app.use('/api-test/settlements', settlements);
            app.use('/api-test/qr', qr);
            app.use('/api-test/home', home);
            app.use('/api-test/users', users);
            app.use('/api-test/map', map);
            app.use("/api-test/collect", collect)
            app.use("/api-test/register-visit", registerVisitRoute)

            app.listen(PORT, '0.0.0.0', () => {
                logBlue(`Worker ${process.pid} escuchando en el puerto ${PORT}`);
            });
        } catch (err) {
            logRed(`Error al iniciar el servidor: ${err}`);
        }
    })();
}
