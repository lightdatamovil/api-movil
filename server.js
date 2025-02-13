
const express = require('express');
const bodyParser = require('body-parser');
const accounts = require('./routes/accounts');
const auth = require('./routes/auth');
const shipments = require('./routes/shipments');
const qr = require('./routes/qr');
const rutas = require('./routes/rutas');
const { redisClient } = require('./db');

var AclientesXEmpresa = new Object();
var AusuariosXEmpresa = new Object();
var AzonasXEmpresa = new Object();

const app = express();
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
const PORT = 13000;

app.use(express.json());

app.post('/api/testapi', async (req, res) => {
    res.status(200).json({ message: 'API funcionando correctamente' });
});

(async () => {
    try {
        await redisClient.connect();

        app.use('/api/auth', auth);
        app.use('/api/accounts', accounts);
        app.use('/api/shipments', shipments);
        app.use('/api/qr', qr);
        app.use('/api/rutas', rutas);

        app.listen(PORT, () => {
            console.log(`Servidor escuchando en el puerto ${PORT}`);
        });

    } catch (err) {
        console.error('Error al iniciar el servidor:', err);
    }
})();

module.exports = {
    app,
    AclientesXEmpresa,
    AusuariosXEmpresa,
    AzonasXEmpresa,
};