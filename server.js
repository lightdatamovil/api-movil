
import express, { json, urlencoded } from 'express';
import accounts from './routes/accounts.js';
import cluster from 'cluster';
import auth from './routes/auth.js';
import shipments from './routes/shipments.js';
import qr from './routes/qr.js';
import home from './routes/home.js';
import users from './routes/users.js';
import map from './routes/map.js';
import settlements from './routes/settlements.js';
import { getCompanyById, redisClient } from './db.js';
import { getUrls } from './src/funciones/urls.js';

const numCPUs = 2;
const PORT = 13000;

if (cluster.isMaster) {
    console.log(`Proceso master ${process.pid} ejecutándose...`);

    // Crear los workers
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    // Reiniciar workers si alguno falla
    cluster.on('exit', (worker, code, signal) => {
        console.log(`Worker ${worker.process.pid} murió, reiniciando...`);
        cluster.fork();
    });
} else {
    const app = express();
    app.use(json({ limit: '50mb' }));
    app.use(urlencoded({ limit: '50mb', extended: true }));
    app.use(json());

    app.post('/api/testapi', async (req, res) => {
        res.status(200).json({ message: 'API funcionando correctamente' });
    });

    app.post('/api/get-urls', async (req, res) => {

        const { companyId } = req.body;

        const company = await getCompanyById(companyId);

        const urls = getUrls(company);

        res.status(200).json({ body: urls, message: 'Datos obtenidos correctamente' });
    });

    (async () => {
        try {
            await redisClient.connect();

            app.use('/api/auth', auth);
            app.use('/api/accounts', accounts);
            app.use('/api/shipments', shipments);
            app.use('/api/settlements', settlements);
            app.use('/api/qr', qr);
            app.use('/api/home', home);
            app.use('/api/users', users);
            app.use('/api/map', map);

            app.listen(PORT, () => {
                console.log(`Worker ${process.pid} escuchando en el puerto ${PORT}`);
            });
        } catch (err) {
            console.error('Error al iniciar el servidor:', err);
        }
    })();
}
