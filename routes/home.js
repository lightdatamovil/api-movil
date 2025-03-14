import { Router } from 'express';
import verifyToken from '../src/funciones/verifyToken.js';
import { getCompanyById } from '../db.js';
import { verifyStartedRoute, startRoute, endRoute, obtenerDatosEmpresa } from '../controller/homeController.js';
import { verifyParamaters } from '../src/funciones/verifyParameters.js';
import { logPurple, logRed } from '../src/funciones/logsCustom.js';

const home = Router();

home.post('/home', async (req, res) => {
	const startTime = performance.now();
	const mensajeError = verifyParamaters(req.body, [], true);

	if (mensajeError) {
		return res.status(400).json({ message: mensajeError });
	}

	const { companyId, userId, profile } = req.body;

	try {
		const company = await getCompanyById(companyId);

		const result = await getHomeData(company, userId, profile);

		res.status(200).json({ body: result, message: "Datos obtenidos correctamente" });
	} catch (error) {
		logRed(`Error en home: ${error.message}`);
		res.status(500).json({ message: error.message });
	} finally {
		const endTime = performance.now();
		logPurple(`Tiempo de ejecución: ${endTime - startTime} ms`);
	}
});

home.post('/start-route', verifyToken, async (req, res) => {
	const startTime = performance.now();
	const mensajeError = verifyParamaters(req.body, [], true);

	if (mensajeError) {
		return res.status(400).json({ message: mensajeError });
	}

	const { companyId, userId } = req.body;

	try {
		const company = await getCompanyById(companyId);

		let result = await startRoute(company, userId);

		res.status(200).json({ body: result, message: 'La ruta a comenzado exitosamente' });
	} catch (e) {
		logRed(`Error en start-route: ${e.message}`);
		res.status(500).json({ message: e.message });
	} finally {
		const endTime = performance.now();
		logPurple(`Tiempo de ejecución: ${endTime - startTime} ms`);
	}
});

home.post('/end-route', verifyToken, async (req, res) => {
	const startTime = performance.now();
	const mensajeError = verifyParamaters(req.body, [], true);

	if (mensajeError) {
		return res.status(400).json({ message: mensajeError });
	}

	const { companyId, userId } = req.body;

	try {
		const company = await getCompanyById(companyId);

		await endRoute(company, userId);

		res.status(200).json({ message: 'La ruta a terminado exitosamente' });
	} catch (e) {
		logRed(`Error en end-route: ${e.message}`);
		res.status(500).json({ message: e.message });
	} finally {
		const endTime = performance.now();
		logPurple(`Tiempo de ejecución: ${endTime - startTime} ms`);
	}
});

home.post('/verify-started-route', verifyToken, async (req, res) => {
	const startTime = performance.now();
	const mensajeError = verifyParamaters(req.body, [], true);

	if (mensajeError) {
		return res.status(400).json({ message: mensajeError });
	}

	const { companyId, userId } = req.body;
	const body = req.body

	try {
		const company = await getCompanyById(companyId);

		let result = await verifyStartedRoute(company, userId);

		res.status(200).json({ body: result, message: `The route has ${result ? 'started' : 'not started'}` });
	} catch (e) {
		logRed(`Error en verify-started-route: ${e.message}`);
		res.status(500).json({ message: e.message });
	} finally {
		const endTime = performance.now();
		logPurple(`Tiempo de ejecución: ${endTime - startTime} ms`);
	}
});
home.post('/obtener-datos', async (req, res) => {
	const mensajeError = verifyParamaters(req.body, ['companyId', 'profile', 'userId']);

	if (mensajeError) {
		return res.status(400).json({ message: mensajeError });
	}

	const { companyId, profile, userId } = req.body;

	try {
		const company = await getCompanyById(companyId);
		const result = await obtenerDatosEmpresa(company, userId, profile);
		res.status(200).json({ body: result, message: "Datos obtenidos correctamente" });
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
});
export default home;