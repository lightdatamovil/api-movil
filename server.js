
const express = require('express');
const bodyParser = require('body-parser');
const cuentas = require('./routes/cuentas');
const auth = require('./routes/auth');
const envios = require('./routes/envios');
const qr = require('./routes/qr');
const rutas = require('./routes/rutas');
const { redisClient } = require('./db');

let empresasDB = null;
var AclientesXEmpresa = new Object();
var AusuariosXEmpresa = new Object();
var AzonasXEmpresa = new Object();

const app = express();
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
const PORT = 3000;

app.use(express.json());

app.post('/api/testapi', async (req, res) => {
    res.status(200).json("Funciona");
});

(async () => {
    try {
        await redisClient.connect();

        const empresasDataJson = await redisClient.get('empresasData');
        empresasDB = JSON.parse(empresasDataJson);

        app.use('/api/auth', auth);
        app.use('/api/cuentas', cuentas);
        app.use('/api/envios', envios);
        app.use('/api/qr', qr);
        app.use('/api/rutas', rutas);

        app.listen(PORT, () => {
            console.log(`Servidor escuchando en el puerto ${PORT}`);
        });

    } catch (err) {
        console.error('Error al iniciar el servidor:', err);
    }
})();

module.exports = { app, empresasDB, AclientesXEmpresa, AusuariosXEmpresa, AzonasXEmpresa };