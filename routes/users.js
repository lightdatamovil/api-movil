import { Router } from 'express';
import verifyToken from '../src/funciones/verifyToken.js';
import { editUser } from '../controller/user/edit_user.js';
import { changePassword } from '../controller/user/change_password.js';
import { changeProfilePicture } from '../controller/user/change_profile_picture.js';
import { createHash } from 'crypto';
import { verifyParamaters } from '../src/funciones/verifyParameters.js';
import CustomException from '../classes/custom_exception.js';
import { crearLog } from '../src/funciones/crear_log.js';
import { companiesService } from '../db.js';

const users = Router();

users.post('/edit-user', verifyToken, async (req, res) => {
    const startTime = performance.now();
    const { companyId, userId, profile, email, phone } = req.body;
    try {
        const mensajeError = verifyParamaters(
            req.body,
            ['companyId', 'userId', 'email', 'phone'],
            true
        );
        if (mensajeError) {
            throw new CustomException({ title: 'Error en edit-user', message: mensajeError });
        }

        const company = await companiesService.getById(companyId);
        const result = await editUser(company, userId, email, phone);

        crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(result), "/edit-user", true);
        res.status(Status.ok).json({ body: result, message: "Datos insertados correctamente" });
    } catch (error) {
        if (error instanceof CustomException) {
            crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(error), "/edit-user", false);
            res.status(400).json({ title: error.title, message: error.message });
        } else {
            crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(error.message), "/edit-user", false);
            res.status(500).json({ message: 'Error interno del servidor' });
        }
    } finally {
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
            throw new CustomException({ title: 'Error en change-password', message: mensajeError });
        }

        const oldPasswordHash = createHash('sha256').update(oldPassword).digest('hex');
        const newPasswordHash = createHash('sha256').update(newPassword).digest('hex');
        const company = await companiesService.getById(companyId);
        const result = await changePassword(company, userId, oldPasswordHash, newPasswordHash);

        crearLog(companyId, result.id, result.profile, req.body, performance.now() - startTime, JSON.stringify(result), "/change-password", true);
        res.status(Status.ok).json({ body: result, message: "Datos insertados correctamente" });
    } catch (error) {
        if (error instanceof CustomException) {
            crearLog(companyId, 0, 0, req.body, performance.now() - startTime, JSON.stringify(error), "/change-password", false);
            res.status(400).json({ title: error.title, message: error.message });
        } else {
            crearLog(companyId, 0, 0, req.body, performance.now() - startTime, JSON.stringify(error.message), "/change-password", false);
            res.status(500).json({ message: 'Error interno del servidor' });
        }
    } finally {
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
            throw new CustomException({ title: 'Error en change-profile-picture', message: mensajeError });
        }

        const company = await companiesService.getById(companyId);
        const result = await changeProfilePicture(company, userId, profile, image, dateYYYYMMDD);

        crearLog(companyId, result.id, result.profile, req.body, performance.now() - startTime, JSON.stringify(result), "/change-profile-picture", true);
        res.status(Status.ok).json({ body: result, message: "Datos insertados correctamente" });
    } catch (error) {

        errorHandler(req, res, error);
    } finally {
    }
});

export default users;
