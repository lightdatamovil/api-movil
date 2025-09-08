import { Router } from 'express';
import { buildHandler } from './_handler.js';
import { getRouteByUserId } from '../controller/maps/get_route.js';
import { geolocalize } from '../controller/maps/geolocalize.js';
import { saveRoute } from '../controller/maps/save_route.js';

const map = Router();

map.post(
    '/get-route-by-user',
    buildHandler({
        controller: async ({ db, req, company }) => {
            const result = await getRouteByUserId(db, req, company);
            return result;
        },
    })
);

map.post(
    '/geolocalize',
    buildHandler({
        required: ['shipmentId', 'latitude', 'longitude'],
        controller: async ({ company, req }) => {
            const result = await geolocalize(company, req);
            return result;
        },
    })
);

map.post(
    '/save-route',
    buildHandler({
        required: ['orders', 'distance', 'totalDelay', 'additionalRouteData'],
        controller: async ({ db, req, company }) => {
            const result = await saveRoute(db, req, company);
            return result;
        },
    })
);

export default map;