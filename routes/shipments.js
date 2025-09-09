import { Router } from 'express';
import { shipmentList } from '../controller/shipments/get_shipment_list.js';
import { shipmentDetails } from '../controller/shipments/get_shipment_details.js';
import { nextDeliver } from '../controller/shipments/next_deliver.js';
import { buildHandlerWrapper } from '../src/funciones/build_handler_wrapper.js';

const shipments = Router();

shipments.post(
  '/shipment-list',
  buildHandlerWrapper({
    required: ['from', 'shipmentStates', 'isAssignedToday'],
    controller: async ({ db, req, company }) => {
      const result = await shipmentList(db, req, company);
      return result;
    },
  })
);

shipments.post(
  '/shipment-details',
  buildHandlerWrapper({
    required: ['shipmentId'],
    controller: async ({ db, req }) => {
      const result = await shipmentDetails(db, req);
      return result;
    },
  })
);

shipments.post(
  '/next-visit',
  buildHandlerWrapper({
    required: ['shipmentId'],
    controller: async ({ db, req, company }) => {
      const result = await nextDeliver(db, req, company);
      return result;
    },
  })
);

export default shipments;
