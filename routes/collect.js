import { getCompanyById } from '../db.js';
import { Router } from 'express';
import { guardarRuta, obtenerColectaDelDia, getCollectList, obtenerEnviosPorCliente, obtenerRutaChofer, obtenerRutaNotificaciones, obtenerDetalleColecta, obtenerListadoLiquidaciones } from '../controller/collectController/collectController.js';

const collect = Router();

collect.post("/get-route", async (req, res) => {
    const { didEmpresa, didUser, fecha } = req.body;

    if (!didEmpresa || !didUser || !fecha) {
        return res.status(400).json({ estadoRespuesta: false, body: "", mensaje: "Faltan datos en la solicitud." });
    }

    try {
        const company = await getCompanyById(didEmpresa);
        const respuesta = await obtenerRutaChofer({ didEmpresa, didUsuario: didUser, fecha }, company);
        res.json(respuesta);
    } catch (error) {
        res.status(500).json(error);
    }
});
collect.post("/start-route", async (req, res) => {
    const { didEmpresa, didUser } = req.body;

    if (!didEmpresa || !didUser) {
        return res.status(400).json({ estadoRespuesta: false, body: "", mensaje: "Faltan datos en la solicitud." });
    }

    try {
        const company = getCompanyById(didEmpresa);
        const respuesta = await obtenerRutaNotificaciones({ didEmpresa, didUsuario: didUser }, company);
        res.json(respuesta);
    } catch (error) {
        res.status(500).json(error);
    }
});
collect.post("/save-route", async (req, res) => {
    const { didEmpresa, didUser, fechaOpe, dataRuta, ordenes } = req.body;

    if (!didEmpresa || !didUser || !fechaOpe || !dataRuta || !ordenes) {
        return res.status(400).json({ estadoRespuesta: false, body: "", mensaje: "Faltan datos en la solicitud." });
    }

    try {
        const company = await getCompanyById(didEmpresa);

        const respuesta = await guardarRuta({
            didEmpresa,
            didUsuario: didUser,
            fechaOpe,
            dataRuta,
            ordenes
        }, company);
        res.json(respuesta);
    } catch (error) {
        res.status(500).json(error);
    }
});
collect.post("/get-collect-details", async (req, res) => {
    const { didEmpresa, quien, perfil, fecha } = req.body;

    if (!didEmpresa || !quien || !perfil || !fecha) {
        return res.status(400).json({ estadoRespuesta: false, body: "", mensaje: "Faltan datos en la solicitud." });
    }

    try {

        const company = await getCompanyById(didEmpresa);
        const respuesta = await obtenerColectaDelDia({ didEmpresa, quien, perfil, fecha }, company);
        res.json(respuesta);
    } catch (error) {
        res.status(500).json(error);
    }
});
collect.post("/get-client-details", async (req, res) => {
    const { didEmpresa, quien, perfil, fecha, didcliente } = req.body;

    if (!didEmpresa || !quien || !perfil || !fecha || !didcliente) {
        return res.status(400).json({ estadoRespuesta: false, body: "", mensaje: "Faltan datos en la solicitud." });
    }

    try {
        const company = await getCompanyById(didEmpresa);
        const respuesta = await obtenerEnviosPorCliente({ didEmpresa, quien, perfil, fecha, didcliente }, company);
        res.json(respuesta);
    } catch (error) {
        res.status(500).json(error);
    }
});
collect.post("/get-collect-list", async (req, res) => {
    const Adatos = req.body;

    if (!Adatos.didEmpresa || !Adatos.quien || !Adatos.perfil || !Adatos.desde || !Adatos.hasta) {
        return res.status(400).json({ estadoRespuesta: false, body: "", mensaje: "Error al querer obtener la información." });
    }


    try {
        const company = await getCompanyById(Adatos.didEmpresa)

        const respuesta = await getCollectList(Adatos, company);

        res.json(respuesta);
    } catch (error) {
        res.status(500).json({ estadoRespuesta: false, body: "", mensaje: "Error interno del servidor." });
    }
});
collect.post("/get-settlement-list", async (req, res) => {
    const { didEmpresa, quien, perfil, desde, hasta } = req.body;

    // Validación de parámetros
    if (!didEmpresa || !quien || !perfil || !desde || !hasta) {
        return res.status(400).json({ estadoRespuesta: false, body: "", mensaje: "Faltan datos en la solicitud." });
    }

    try {
        const company = await getCompanyById(didEmpresa);
        const respuesta = await obtenerListadoLiquidaciones({ desde, hasta }, company);
        res.json(respuesta);
    } catch (error) {
        res.status(500).json(error);
    }
});

collect.post("/get-settlement-details", async (req, res) => {
    const { didEmpresa, quien, perfil, idLiquidacion } = req.body;

    // Validación de parámetros
    if (!didEmpresa || !quien || !perfil || !idLiquidacion) {
        return res.status(400).json({ estadoRespuesta: false, body: "", mensaje: "Faltan datos en la solicitud." });
    }

    try {
        const company = await getCompanyById(didEmpresa);
        const respuesta = await obtenerDetalleColecta({ idLiquidacion }, company);
        res.json(respuesta);
    } catch (error) {
        res.status(500).json(error);
    }
});

export default collect;
