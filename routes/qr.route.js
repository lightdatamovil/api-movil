import { Router } from 'express';
import { driverList } from '../controller/qr/get_driver_list.js';
import { crossDocking } from '../controller/qr/cross_docking.js';
import { getShipmentIdFromQr } from '../controller/qr/get_shipment_id.js';
import { getProductsFromShipment } from '../controller/qr/get_products.js';
import { enterFlex } from '../controller/qr/enter_flex.js';
import { getCantidadAsignaciones } from '../controller/qr/get_cantidad_asignaciones.js';
import { altaEnvioFoto } from '../controller/qr/envio_foto.js';
import { buildHandlerWrapper } from '../src/functions/build_handler_wrapper.js';

const qr = Router();

qr.get(
  '/driver-list',
  buildHandlerWrapper({
    controller: async ({ db }) => await driverList({ db }),
  })
);

qr.post(
  '/cross-docking',
  buildHandlerWrapper({
    required: ['dataQr'],
    controller: async ({ db, req, company }) => await crossDocking({ db, req, company }),
  })
);

qr.post(
  '/get-shipment-id',
  buildHandlerWrapper({
    required: ['dataQr'],
    controller: async ({ db, req, company }) => await getShipmentIdFromQr({ db, req, company }),
  })
);

qr.post(
  '/products-from-shipment',
  buildHandlerWrapper({
    required: ['dataQr'],
    controller: async ({ db, req }) => await getProductsFromShipment({ db, req }),
  })
);

qr.post(
  '/enter-flex',
  buildHandlerWrapper({
    required: ['dataQr'],
    controller: async ({ db, req, company }) => await enterFlex({ db, req, company }),
  })
);

qr.get(
  '/cantidad-asignaciones',
  buildHandlerWrapper({
    controller: async ({ db, req }) => await getCantidadAsignaciones({ db, req }),
  })
);

qr.post(
  '/alta-envio-foto',
  buildHandlerWrapper({
    required: ['image', 'driverId'],
    controller: async ({ req, company }) => await altaEnvioFoto({ company, req }),
  })
);

export default qr;
