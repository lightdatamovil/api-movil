// routes/home.js
import { Router } from 'express';
import { startRoute } from '../controller/home/start_route.js';
import { finishRoute } from '../controller/home/finish_route.js';
import { getHomeData } from '../controller/home/get_home_data.js';
import { buildHandlerWrapper } from '../src/funciones/build_handler_wrapper.js';

const home = Router();

home.get(
  '/home',
  buildHandlerWrapper({
    controller: async ({ db, req, company }) => {
      const result = await getHomeData(db, req, company);
      return result;
    },
  })
);

home.post(
  '/start-route',
  buildHandlerWrapper({
    controller: async ({ db, req, company }) => {
      const result = await startRoute(db, req, company);
      return result;
    },
  })
);

home.post(
  '/end-route',
  buildHandlerWrapper({
    controller: async ({ db, req }) => {
      const result = await finishRoute(db, req);
      return result;
    },
  })
);

export default home;
