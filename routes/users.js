import { Router } from 'express';
import { getCompanyById } from '../db.js';
import { editUser, changePassword, changeProfilePicture } from '../controller/usersController.js';
import { createHash } from 'crypto';
import { verifyParamaters } from '../src/funciones/verifyParameters.js';
import { logPurple, logRed } from '../src/funciones/logsCustom.js';

const users = Router();

users.post('/edit-user', async (req, res) => {
    const startTime = performance.now();
    const mensajeError = verifyParamaters(req.body, ['email', 'phone'], true);

    if (mensajeError) {
        return res.status(400).json({ message: mensajeError });
    }

    const { companyId, userId, email, phone } = req.body;

    try {
        const company = await getCompanyById(companyId);

        const result = await editUser(company, userId, email, phone);

        res.status(200).json({ body: result, message: "Datos insertados correctamente" });
    } catch (error) {
        logRed(`Error en edit-user: ${error.stack}`);
        res.status(500).json({ message: error.stack });
    } finally {
        const endTime = performance.now();
        logPurple(`Tiempo de ejecución: ${endTime - startTime} ms`);
    }
});

users.post('/change-password', async (req, res) => {
    const startTime = performance.now();
    const mensajeError = verifyParamaters(req.body, ['oldPassword', 'newPassword'], true);

    if (mensajeError) {
        return res.status(400).json({ message: mensajeError });
    }

    const { companyId, userId, oldPassword, newPassword } = req.body;

    try {
        const oldPasswordHash = createHash('sha256').update(oldPassword).digest('hex');

        const newPasswordHash = createHash('sha256').update(newPassword).digest('hex');

        const company = await getCompanyById(companyId);

        const result = await changePassword(company, userId, oldPasswordHash, newPasswordHash);

        res.status(200).json({ body: result, message: "Datos insertados correctamente" });
    } catch (error) {
        logRed(`Error en change-password: ${error.stack}`);
        res.status(500).json({ message: error.stack });
    } finally {
        const endTime = performance.now();
        logPurple(`Tiempo de ejecución: ${endTime - startTime} ms`);
    }
});

users.post('/change-profile-picture', async (req, res) => {
    const startTime = performance.now();
    const mensajeError = verifyParamaters(req.body, ['image'], true);

    if (mensajeError) {
        return res.status(400).json({ message: mensajeError });
    }

    const { companyId, userId, profile, image } = req.body;

    try {
        const company = await getCompanyById(companyId);

        const result = await changeProfilePicture(company, userId, profile, image);

        res.status(200).json({ body: result, message: "Datos insertados correctamente" });
    } catch (error) {
        logRed(`Error en change-profile-picture: ${error.stack}`);
        res.status(500).json({ message: error.stack });
    } finally {
        const endTime = performance.now();
        logPurple(`Tiempo de ejecución: ${endTime - startTime} ms`);
    }
});

export default users;