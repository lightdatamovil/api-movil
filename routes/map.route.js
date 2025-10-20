import { Router } from 'express';
import { getRouteByUserId } from '../controller/maps/get_route.js';
import { geolocalize } from '../controller/maps/geolocalize.js';
import { saveRoute } from '../controller/maps/save_route.js';
import { buildHandlerWrapper } from '../src/functions/build_handler_wrapper.js';

const map = Router();

map.get(
    '/get-route-by-user',
    buildHandlerWrapper({
        controller: async ({ db, req, company }) => await getRouteByUserId({ db, req, company }),
    })
);

map.post(
    '/geolocalize',
    buildHandlerWrapper({
        required: ['shipmentId', 'latitude', 'longitude'],
        controller: async ({ company, req }) => await geolocalize({ company, req }),
    })
);

map.post(
    '/save-route',
    buildHandlerWrapper({
        required: ['orders', 'distance', 'totalDelay', 'additionalRouteData'],
        controller: async ({ db, req, company }) => await saveRoute({ db, req, company }),
    })
);

export default map;