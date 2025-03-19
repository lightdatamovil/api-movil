import { Router } from 'express';
import verifyToken from '../src/funciones/verifyToken.js';
import { getCompanyById } from '../db.js';
import { verifyStartedRoute, startRoute, endRoute, getHomeData } from '../controller/homeController.js';
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
		logRed(`Error en home: ${error.stack}`);
		res.status(500).json({ message: error.stack });
	} finally {
		const endTime = performance.now();
		logPurple(`Tiempo de ejecución: ${endTime - startTime} ms`);
	}
});

home.post('/start-route', verifyToken, async (req, res) => {
	const startTime = performance.now();
	const mensajeError = verifyParamaters(req.body, ['date', 'deviceFrom'], true);

	if (mensajeError) {
		return res.status(400).json({ message: mensajeError });
	}

	const { companyId, userId, date, deviceFrom } = req.body;

	try {
		const company = await getCompanyById(companyId);

		let result = await startRoute(company, userId, date, deviceFrom);

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
	const mensajeError = verifyParamaters(req.body, ['date', 'deciveFrom'], true);

	if (mensajeError) {
		return res.status(400).json({ message: mensajeError });
	}

	const { companyId, userId, date, deciveFrom } = req.body;

	try {
		const company = await getCompanyById(companyId);

		await endRoute(company, userId, date, deciveFrom);

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
export default home;