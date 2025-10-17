import { Router } from 'express';
import { registerVisit } from '../controller/register_visit/register_visit.js';
import { uploadImage } from '../controller/register_visit/upload_image.js';
import { buildHandlerWrapper } from '../src/funciones/build_handler_wrapper.js';

const registerVisitRoute = Router();

registerVisitRoute.post(
    '/register',
    buildHandlerWrapper({
        required: [
            'shipmentId',
            'shipmentState',
            'observation',
            'latitude',
            'longitude',
            'recieverName',
            'recieverDNI',
        ],
        controller: async ({ db, req, company }) => await registerVisit({ db, req, company }),
    })
);

registerVisitRoute.post(
    '/upload-image',
    buildHandlerWrapper({
        required: ['shipmentId', 'shipmentState', 'image', 'lineId'],
        controller: async ({ db, req, company }) => await uploadImage({ db, req, company }),
    })
);

export default registerVisitRoute;
