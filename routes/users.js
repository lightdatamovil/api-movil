import { Router } from 'express';
import { editUser } from '../controller/user/edit_user.js';
import { changePassword } from '../controller/user/change_password.js';
import { changeProfilePicture } from '../controller/user/change_profile_picture.js';
import { crearLog } from '../src/funciones/crear_log.js';
import { connectMySQL, errorHandler, getProductionDbConfig, Status, verifyAll, verifyHeaders, verifyToken } from 'lightdata-tools';
import { hostProductionDb, portProductionDb, companiesService, jwtSecret } from '../db.js';

const users = Router();

users.post('/edit-user', verifyToken(jwtSecret), async (req, res) => {
    const startTime = performance.now();

    let dbConnection;

    try {
        verifyHeaders(req, []);
        verifyAll(req, [], { required: ['email', 'phone'], optional: [] });

        const { companyId } = req.user;
        const company = await companiesService.getById(companyId);

        const dbConfig = getProductionDbConfig(company, hostProductionDb, portProductionDb);
        dbConnection = await connectMySQL(dbConfig);

        const result = await editUser(dbConnection, req);

        crearLog(req, startTime, JSON.stringify(result), true);
        res.status(Status.ok).json(result);
    } catch (error) {
        crearLog(req, startTime, JSON.stringify(error), false);
        errorHandler(req, res, error);
    } finally {
        if (dbConnection) dbConnection.end();
    }
});

users.post('/change-password', verifyToken(jwtSecret), async (req, res) => {
    const startTime = performance.now();

    let dbConnection;

    try {
        verifyHeaders(req, []);
        verifyAll(req, [], { required: ['oldPassword', 'newPassword'], optional: [] });

        const { companyId } = req.user;
        const company = await companiesService.getById(companyId);

        const dbConfig = getProductionDbConfig(company, hostProductionDb, portProductionDb);
        dbConnection = await connectMySQL(dbConfig);

        const result = await changePassword(dbConnection, req);

        crearLog(req, startTime, JSON.stringify(result), true);
        res.status(Status.ok).json(result);
    } catch (error) {
        crearLog(req, startTime, JSON.stringify(error), false);
        errorHandler(req, res, error);
    } finally {
        if (dbConnection) dbConnection.end();
    }
});

users.post('/change-profile-picture', verifyToken(jwtSecret), async (req, res) => {
    const startTime = performance.now();

    try {
        verifyHeaders(req, []);
        verifyAll(req, [], { required: ['image'], optional: [] });

        const { companyId } = req.user;
        const company = await companiesService.getById(companyId);

        const result = await changeProfilePicture(req, company);

        crearLog(req, startTime, JSON.stringify(result), true);
        res.status(Status.ok).json(result);
    } catch (error) {
        crearLog(req, startTime, JSON.stringify(error), false);
        errorHandler(req, res, error);
    }
});

export default users;
