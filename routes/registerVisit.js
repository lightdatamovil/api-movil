import { Router } from 'express';
import { buildHandler } from './_handler.js';
import { registerVisit } from '../controller/register_visit/register_visit.js';
import { uploadImage } from '../controller/register_visit/upload_image.js';

const registerVisitRoute = Router();

registerVisitRoute.post(
    '/register',
    buildHandler({
        required: [
            'shipmentId',
            'shipmentState',
            'observation',
            'latitude',
            'longitude',
            'recieverName',
            'recieverDNI',
        ],
        controller: async ({ db, req, company }) => {
            const result = await registerVisit(db, req, company);
            return result;
        },
    })
);

registerVisitRoute.post(
    '/upload-image',
    buildHandler({
        required: ['shipmentId', 'shipmentState', 'image', 'lineId'],
        controller: async ({ db, req, company }) => {
            const result = await uploadImage(db, req, company);
            return result;
        },
    })
);

export default registerVisitRoute;
