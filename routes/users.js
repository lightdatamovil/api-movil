import { Router } from 'express';
import { getCompanyById } from '../db.js';
import { editUser, changePassword } from '../controller/usersController/users.js';
import { createHash } from 'crypto';

const users = Router();

users.post('/edit-user', async (req, res) => {
    const { companyId, userId, profile, email, phone, deviceId, appVersion, brand, model, androidVersion } = req.body;

    if (!companyId || !userId || !profile || !deviceId || !appVersion || !brand || !model || !androidVersion) {
        return res.status(400).json({ message: "Faltan datos" });
    }

    try {
        const company = await getCompanyById(companyId);

        const result = await editUser(company, userId, email, phone);

        return res.status(200).json({ body: result, message: "Datos insertados correctamente" });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

users.post('/change-password', async (req, res) => {
    const { companyId, userId, profile, oldPassword, newPassword, deviceId, appVersion, brand, model, androidVersion } = req.body;

    if (!companyId || !userId || !profile || !oldPassword || !newPassword || !deviceId || !appVersion || !brand || !model || !androidVersion) {
        return res.status(400).json({ message: "Faltan datos" });
    }

    try {
        const oldPasswordHash = createHash('sha256').update(oldPassword).digest('hex');

        const newPasswordHash = createHash('sha256').update(newPassword).digest('hex');

        const company = await getCompanyById(companyId);

        const result = await changePassword(company, userId, oldPasswordHash, newPasswordHash);

        return res.status(200).json({ body: result, message: "Datos insertados correctamente" });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

users.post('/change-profile-picture', async (req, res) => {
    const { companyId, userId, profile, image, deviceId, appVersion, brand, model, androidVersion } = req.body;

    if (!companyId || !userId || !profile || !image || !deviceId || !appVersion || !brand || !model || !androidVersion) {
        return res.status(400).json({ message: "Faltan datos" });
    }

    try {
        const company = await getCompanyById(companyId);

        const result = await changeProfilePicture(company, userId, profile, image);

        return res.status(200).json({ body: result, message: "Datos insertados correctamente" });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

export default users;