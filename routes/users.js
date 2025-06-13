import { Router } from 'express';
import verifyToken from '../src/funciones/verifyToken.js';
import { getCompanyById } from '../db.js';
import { editUser } from '../controller/user/edit_user.js';
import { changePassword } from '../controller/user/change_password.js';
import { changeProfilePicture } from '../controller/user/change_profile_picture.js';
import { createHash } from 'crypto';
import { verifyParamaters } from '../src/funciones/verifyParameters.js';
import { logGreen, logPurple, logRed } from '../src/funciones/logsCustom.js';
import CustomException from '../classes/custom_exception.js';

const users = Router();

users.post('/edit-user', verifyToken, async (req, res) => {
    const startTime = performance.now();
    const { companyId, userId, email, phone } = req.body;
    try {
        const mensajeError = verifyParamaters(
            req.body,
            ['companyId', 'userId', 'email', 'phone'],
            true
        );
        if (mensajeError) {
            logRed(`Error en edit-user: ${mensajeError}`);
            throw new CustomException({ title: 'Error en edit-user', message: mensajeError });
        }

        const company = await getCompanyById(companyId);
        const result = await editUser(company, userId, email, phone);

        logGreen(`Usuario editado correctamente`);
        res.status(200).json({ body: result, message: "Datos insertados correctamente" });
    } catch (error) {
        if (error instanceof CustomException) {
            logRed(`Error 400 en edit-user: ${error}`);
            res.status(400).json({ title: error.title, message: error.message });
        } else {
            logRed(`Error 500 en edit-user: ${error}`);
            res.status(500).json({ message: 'Error interno del servidor' });
        }
    } finally {
        const endTime = performance.now();
        logPurple(`Tiempo de ejecución edit-user: ${endTime - startTime} ms`);
    }
});

users.post('/change-password', verifyToken, async (req, res) => {
    const startTime = performance.now();
    const { companyId, userId, oldPassword, newPassword } = req.body;
    try {
        const mensajeError = verifyParamaters(
            req.body,
            ['companyId', 'userId', 'oldPassword', 'newPassword'],
            true
        );
        if (mensajeError) {
            logRed(`Error en change-password: ${mensajeError}`);
            throw new CustomException({ title: 'Error en change-password', message: mensajeError });
        }

        const oldPasswordHash = createHash('sha256').update(oldPassword).digest('hex');
        const newPasswordHash = createHash('sha256').update(newPassword).digest('hex');
        const company = await getCompanyById(companyId);
        const result = await changePassword(company, userId, oldPasswordHash, newPasswordHash);

        logGreen(`Contraseña cambiada correctamente`);
        res.status(200).json({ body: result, message: "Datos insertados correctamente" });
    } catch (error) {
        if (error instanceof CustomException) {
            logRed(`Error 400 en change-password: ${error}`);
            res.status(400).json({ title: error.title, message: error.message });
        } else {
            logRed(`Error 500 en change-password: ${error}`);
            res.status(500).json({ message: 'Error interno del servidor' });
        }
    } finally {
        const endTime = performance.now();
        logPurple(`Tiempo de ejecución change-password: ${endTime - startTime} ms`);
    }
});

users.post('/change-profile-picture', verifyToken, async (req, res) => {
    const startTime = performance.now();
    const { companyId, userId, profile, image, dateYYYYMMDD } = req.body;
    try {
        const mensajeError = verifyParamaters(
            req.body,
            ['companyId', 'userId', 'profile', 'image', 'dateYYYYMMDD'],
            true
        );
        if (mensajeError) {
            logRed(`Error en change-profile-picture: ${mensajeError}`);
            throw new CustomException({ title: 'Error en change-profile-picture', message: mensajeError });
        }

        const company = await getCompanyById(companyId);
        const result = await changeProfilePicture(company, userId, profile, image, dateYYYYMMDD);

        logGreen(`Foto de perfil cambiada correctamente`);
        res.status(200).json({ body: result, message: "Datos insertados correctamente" });
    } catch (error) {
        if (error instanceof CustomException) {
            logRed(`Error 400 en change-profile-picture: ${error}`);
            res.status(400).json({ title: error.title, message: error.message });
        } else {
            logRed(`Error 500 en change-profile-picture: ${error}`);
            res.status(500).json({ message: 'Error interno del servidor' });
        }
    } finally {
        const endTime = performance.now();
        logPurple(`Tiempo de ejecución change-profile-picture: ${endTime - startTime} ms`);
    }
});

export default users;
