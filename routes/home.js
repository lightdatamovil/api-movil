import { Router } from "express";
import verifyToken from "../src/funciones/verifyToken.js";
import { verifyStartedRoute } from "../controller/home/verify_started_route.js";
import { startRoute } from "../controller/home/start_route.js";
import { finishRoute } from "../controller/home/finish_route.js";
import { getHomeData } from "../controller/home/get_home_data.js";
import { verifyParamaters } from "../src/funciones/verifyParameters.js";
import CustomException from "../classes/custom_exception.js";
import { crearLog } from "../src/funciones/crear_log.js";
import { companiesService } from "../db.js";
import { Status } from "lightdata-tools";

const home = Router();

home.post("/home", verifyToken, async (req, res) => {
  const startTime = performance.now();
  const { companyId, userId, profile } = req.body;
  try {
    const mensajeError = verifyParamaters(
      req.body,
      ["companyId", "userId", "profile"],
      true
    );
    if (mensajeError) {
      throw new CustomException({
        title: "Error en home",
        message: mensajeError,
      });
    }

    const company = await companiesService.getById(companyId);
    const result = await getHomeData(company, userId, profile);

    crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(result), "/home", true);
    res
      .status(Status.ok)
      .json({ body: result, message: "Datos obtenidos correctamente" });
  } catch (error) {
    if (error instanceof CustomException) {
      crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(error), "/home", false);
      res.status(400).json({ title: error.title, message: error.message });
    } else {
      crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(error.message), "/home", false);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  } finally {
  }
});

home.post("/start-route", verifyToken, async (req, res) => {
  const startTime = performance.now();
  const { companyId, userId, profile, deviceFrom } = req.body;
  try {
    const mensajeError = verifyParamaters(
      req.body,
      ["companyId", "userId", "deviceFrom"],
      true
    );
    if (mensajeError) {
      throw new CustomException({
        title: "Error en start-route",
        message: mensajeError,
      });
    }

    const company = await companiesService.getById(companyId);
    await startRoute(company, userId, deviceFrom);

    crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify({ message: "Ruta comenzada exitosamente" }), "/start-route", true);
    res
      .status(Status.ok)
      .json({ message: "La ruta ha comenzado exitosamente" });
  } catch (error) {
    if (error instanceof CustomException) {
      crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(error), "/start-route", false);
      res.status(400).json({ title: error.title, message: error.message });
    } else {
      crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(error.message), "/start-route", false);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  } finally {
  }
});

home.post("/end-route", verifyToken, async (req, res) => {
  const startTime = performance.now();
  const { companyId, userId, profile } = req.body;
  try {
    const mensajeError = verifyParamaters(
      req.body,
      ["companyId", "userId"],
      true
    );
    if (mensajeError) {
      throw new CustomException({
        title: "Error en end-route",
        message: mensajeError,
      });
    }

    const company = await companiesService.getById(companyId);
    await finishRoute(company, userId);

    crearLog(companyId, userId, profile, req.body, performance.now() - startTime, "Ruta terminada exitosamente", "/end-route", true);
    res.status(Status.ok).json({ message: "La ruta ha terminado exitosamente" });
  } catch (error) {
    if (error instanceof CustomException) {
      crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(error), "/end-route", false);
      res.status(400).json({ title: error.title, message: error.message });
    } else {
      crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(error.message), "/end-route", false);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  } finally {
  }
});

home.post("/verify-started-route", verifyToken, async (req, res) => {
  const startTime = performance.now();
  const { companyId, userId, profile } = req.body;
  try {
    const mensajeError = verifyParamaters(
      req.body,
      ["companyId", "userId"],
      true
    );
    if (mensajeError) {
      throw new CustomException({
        title: "Error en verify-started-route",
        message: mensajeError,
      });
    }

    const company = await companiesService.getById(companyId);
    const result = await verifyStartedRoute(company, userId);

    crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(result), "/verify-started-route", true);
    res.status(Status.ok).json({
      body: result,
      message: `La ruta ${result ? "ha comenzado" : "no ha comenzado"}`,
    });
  } catch (error) {
    if (error instanceof CustomException) {
      crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(error), "/verify-started-route", false);
      res.status(400).json({ title: error.title, message: error.message });
    } else {
      crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(error.message), "/verify-started-route", false);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  } finally {
  }
});

export default home;
