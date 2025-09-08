import { Router } from 'express';
import { buildHandler } from './_handler.js';
import { driverList } from '../controller/qr/get_driver_list.js';
import { crossDocking } from '../controller/qr/cross_docking.js';
import { getShipmentIdFromQr } from '../controller/qr/get_shipment_id.js';
import { getProductsFromShipment } from '../controller/qr/get_products.js';
import { enterFlex } from '../controller/qr/enter_flex.js';
import { getCantidadAsignaciones } from '../controller/qr/get_cantidad_asignaciones.js';
import { altaEnvioFoto } from '../controller/qr/envio_foto.js';

const qr = Router();

qr.post(
  '/driver-list',
  buildHandler({
    required: [],
    controller: async ({ db }) => {
      const result = await driverList(db);
      return result;
    },
  })
);

qr.post(
  '/cross-docking',
  buildHandler({
    required: ['dataQr'],
    controller: async ({ db, req, company }) => {
      const result = await crossDocking(db, req, company);
      return result;
    },
  })
);

qr.post(
  '/get-shipment-id',
  buildHandler({
    required: ['dataQr'],
    controller: async ({ db, req, company }) => {
      const result = await getShipmentIdFromQr(db, req, company);
      return result;
    },
  })
);

qr.post(
  '/products-from-shipment',
  buildHandler({
    required: ['dataQr'],
    controller: async ({ db, req }) => {
      const result = await getProductsFromShipment(db, req);
      return result;
    },
  })
);

qr.post(
  '/enter-flex',
  buildHandler({
    required: ['dataQr'],
    controller: async ({ db, req, company }) => {
      const result = await enterFlex(db, req, company);
      return result;
    },
  })
);

qr.post(
  '/cantidad-asignaciones',
  buildHandler({
    required: [],
    controller: async ({ db, req }) => {
      const result = await getCantidadAsignaciones(db, req);
      return result;
    },
  })
);

qr.post(
  '/alta-envio-foto',
  buildHandler({
    required: ['image', 'driverId'],
    controller: async ({ req, company }) => {
      const result = await altaEnvioFoto(company, req);
      return result;
    },
  })
);

export default qr;
