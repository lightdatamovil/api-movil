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
    controller: async ({ db, req, company }) => await getHomeData({ db, req, company }),
  })
);

home.post(
  '/start-route',
  buildHandlerWrapper({
    controller: async ({ db, req, company }) => await startRoute({ db, req, company }),
  })
);

home.post(
  '/end-route',
  buildHandlerWrapper({
    controller: async ({ db, req }) => await finishRoute({ db, req }),
  })
);

export default home;
