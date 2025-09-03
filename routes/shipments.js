import { Router } from "express";
import verifyToken from "../src/funciones/verifyToken.js";
import { nextDeliver } from "../controller/shipments/next_deliver.js";
import { shipmentDetails } from "../controller/shipments/get_shipment_details.js";
import { shipmentList } from "../controller/shipments/get_shipment_list.js";
import { verifyParamaters } from "../src/funciones/verifyParameters.js";
import CustomException from "../classes/custom_exception.js";
import { crearLog } from "../src/funciones/crear_log.js";

const shipments = Router();

shipments.post("/shipment-list", verifyToken, async (req, res) => {
  const startTime = performance.now();
  const {
    companyId,
    userId,
    profile,
    from,
    shipmentStates,
    isAssignedToday,
    date,
  } = req.body;
  try {
    const mensajeError = verifyParamaters(
      req.body,
      [
        "companyId",
        "userId",
        "profile",
        "from",
        "shipmentStates",
        "isAssignedToday",
      ],
      true
    );
    if (mensajeError) {
      throw new CustomException({
        title: "Error en shipment-list",
        message: mensajeError,
      });
    }

    const company = await companiesService.getById(companyId);
    const result = await shipmentList(
      company,
      userId,
      profile,
      from,
      shipmentStates,
      isAssignedToday,
      date
    );


    crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(result), "/shipment-list", true);
    res
      .status(Status.ok)
      .json({ body: result, message: "Datos obtenidos correctamente" });
  } catch (error) {
    if (error instanceof CustomException) {
      crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(error), "/shipment-list", false);
      res.status(400).json({ title: error.title, message: error.message });
    } else {
      crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(error.message), "/shipment-list", false);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  } finally {
  }
});

shipments.post("/shipment-details", verifyToken, async (req, res) => {
  const startTime = performance.now();
  const { companyId, userId, profile, shipmentId } = req.body;
  try {
    const mensajeError = verifyParamaters(
      req.body,
      ["companyId", "userId", "shipmentId"],
      true
    );
    if (mensajeError) {
      throw new CustomException({
        title: "Error en shipment-details",
        message: mensajeError,
      });
    }

    const company = await companiesService.getById(companyId);
    const result = await shipmentDetails(company, shipmentId, userId);


    crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(result), "/shipment-details", true);
    res
      .status(Status.ok)
      .json({ body: result, message: "Datos obtenidos correctamente" });
  } catch (error) {
    if (error instanceof CustomException) {
      crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(error), "/shipment-details", false);
      res.status(400).json({ title: error.title, message: error.message });
    } else {
      crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(error.message), "/shipment-details", false);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  } finally {
  }
});

shipments.post("/next-visit", verifyToken, async (req, res) => {
  const startTime = performance.now();
  const { companyId, userId, profile, shipmentId } = req.body;
  try {
    const mensajeError = verifyParamaters(
      req.body,
      ["companyId", "userId", "shipmentId"],
      true
    );
    if (mensajeError) {
      throw new CustomException({
        title: "Error en next-visit",
        message: mensajeError,
      });
    }

    const company = await companiesService.getById(companyId);
    const result = await nextDeliver(company, shipmentId, userId);

    crearLog(companyId, result.id, result.profile, req.body, performance.now() - startTime, JSON.stringify(result), "/next-visit", true);
    res
      .status(Status.ok)
      .json({ body: result, message: "Datos obtenidos correctamente" });
  } catch (error) {
    if (error instanceof CustomException) {
      crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(error), "/next-visit", false);
      res.status(400).json({ title: error.title, message: error.message });
    } else {
      crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(error.message), "/shipment-details", false);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  } finally {
  }
});

export default shipments;
