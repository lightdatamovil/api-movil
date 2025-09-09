import { Router } from 'express';
import { getRouteByUserId } from '../controller/maps/get_route.js';
import { geolocalize } from '../controller/maps/geolocalize.js';
import { saveRoute } from '../controller/maps/save_route.js';
import { buildHandlerWrapper } from '../src/funciones/build_handler_wrapper.js';

const map = Router();

map.post(
    '/get-route-by-user',
    buildHandlerWrapper({
        controller: async ({ db, req, company }) => {
            const result = await getRouteByUserId(db, req, company);
            return result;
        },
    })
);

map.post(
    '/geolocalize',
    buildHandlerWrapper({
        required: ['shipmentId', 'latitude', 'longitude'],
        controller: async ({ company, req }) => {
            const result = await geolocalize(company, req);
            return result;
        },
    })
);

map.post(
    '/save-route',
    buildHandlerWrapper({
        required: ['orders', 'distance', 'totalDelay', 'additionalRouteData'],
        controller: async ({ db, req, company }) => {
            const result = await saveRoute(db, req, company);
            return result;
        },
    })
);

export default map;