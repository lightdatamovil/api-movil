import { Router } from "express";
import verifyToken from "../src/funciones/verifyToken.js";
import { getCompanyById } from "../db.js";
import { getShipmentIdFromQr } from "../controller/qr/get_shipment_id.js";
import { getProductsFromShipment } from "../controller/qr/get_products.js";
import { enterFlex } from "../controller/qr/enter_flex.js";
import { armado } from "../controller/qr/armado.js";
import { verifyParamaters } from "../src/funciones/verifyParameters.js";
import { logGreen, logPurple, logRed } from "../src/funciones/logsCustom.js";
import CustomException from "../classes/custom_exception.js";
import { driverList } from "../controller/qr/get_driver_list.js";
import { crossDocking } from "../controller/qr/cross_docking.js";
import { getSkuAndStockFlex } from "../controller/qr/get_sku_and_stock _flex.js";
import { parseIfJson } from "../src/funciones/isValidJson.js";
import { crearLog } from "../src/funciones/crear_log.js";

const qr = Router();

qr.post("/driver-list", verifyToken, async (req, res) => {
  const startTime = performance.now();
  const { companyId, userId, profile } = req.body;
  try {
    const mensajeError = verifyParamaters(req.body, ["companyId"], true);
    if (mensajeError) {
      logRed(`Error en driver-list: ${mensajeError}`);
      throw new CustomException({
        title: "Error en driver-list",
        message: mensajeError,
      });
    }

    const company = await getCompanyById(companyId);
    const result = await driverList(company);

    logGreen(`Listado de choferes obtenido correctamente`);
    crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(result), "/driver-list", true);
    res
      .status(200)
      .json({ body: result, message: "Datos obtenidos correctamente" });
  } catch (error) {
    if (error instanceof CustomException) {
      logRed(`Error 400 en driver-list: ${error}`);
      crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(error), "/driver-list", false);
      res.status(400).json({ title: error.title, message: error.message });
    } else {
      logRed(`Error 500 en driver-list: ${error}`);
      crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(error.message), "/driver-list", false);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  } finally {
    const endTime = performance.now();
    logPurple(`Tiempo de ejecución driver-list: ${endTime - startTime} ms`);
  }
});

qr.post("/cross-docking", verifyToken, async (req, res) => {
  const startTime = performance.now();
  let { companyId, userId, profile, dataQr } = req.body;
  try {
    const mensajeError = verifyParamaters(
      req.body,
      ["companyId", "dataQr"],
      true
    );
    if (mensajeError) {
      logRed(`Error en cross-docking: ${mensajeError}`);
      throw new CustomException({
        title: "Error en cross-docking",
        message: mensajeError,
      });
    }

    dataQr = parseIfJson(dataQr);
    const company = await getCompanyById(companyId);
    const response = await crossDocking(dataQr, company);

    logGreen(`Cross-docking completado correctamente`);
    crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(response), "/cross-docking", true);
    res
      .status(200)
      .json({ body: response, message: "Datos obtenidos correctamente", success: true });
  } catch (error) {
    if (error instanceof CustomException) {
      logRed(`Error 400 en cross-docking: ${error}`);
      crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(error), "/cross-docking", false);
      res.status(400).json({ title: error.title, message: error.message });
    } else {
      logRed(`Error 500 en cross-docking: ${error}`);
      crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(error.message), "/cross-docking", false);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  } finally {
    const endTime = performance.now();
    logPurple(`Tiempo de ejecución cross-docking: ${endTime - startTime} ms`);
  }
});

qr.post("/get-shipment-id", async (req, res) => {
  const startTime = performance.now();
  let { companyId, userId, profile, dataQr } = req.body;
  try {
    const mensajeError = verifyParamaters(
      req.body,
      ["companyId", "dataQr"],
      true
    );
    if (mensajeError) {
      logRed(`Error en get-shipment-id: ${mensajeError}`);
      throw new CustomException({
        title: "Error en get-shipment-id",
        message: mensajeError,
      });
    }

    dataQr = parseIfJson(dataQr);
    const company = await getCompanyById(companyId);
    const response = await getShipmentIdFromQr(dataQr, company);

    logGreen(`ID de envío obtenido correctamente`);
    crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(response), "/get-shipment-id", true);
    res.status(200).json({
      success: true,
      body: response,
      message: "Datos obtenidos correctamente",
    });
  } catch (error) {
    if (error instanceof CustomException) {
      logRed(`Error 400 en get-shipment-id: ${error}`);
      crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(error), "/get-shipment-id", false);
      res.status(400).json({ title: error.title, message: error.message });
    } else {
      logRed(`Error 500 en get-shipment-id: ${error}`);
      crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(error.message), "/get-shipment-id", false);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  } finally {
    const endTime = performance.now();
    logPurple(`Tiempo de ejecución get-shipment-id: ${endTime - startTime} ms`);
  }
});

qr.post("/products-from-shipment", verifyToken, async (req, res) => {
  const startTime = performance.now();
  let { companyId, userId, profile, dataQr } = req.body;
  try {
    const mensajeError = verifyParamaters(req.body, ["dataQr"], true);
    if (mensajeError) {
      logRed(`Error en products-from-shipment: ${mensajeError}`);
      throw new CustomException({
        title: "Error en products-from-shipment",
        message: mensajeError,
      });
    }

    dataQr = parseIfJson(dataQr);

    const response = await getProductsFromShipment(dataQr);

    logGreen(`Productos obtenidos correctamente`);
    crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(response), "/products-from-shipment", true);
    res
      .status(200)
      .json({ body: response, message: "Datos obtenidos correctamente" });
  } catch (error) {
    if (error instanceof CustomException) {
      logRed(`Error 400 en products-from-shipment: ${error}`);
      crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(error), "/products-from-shipment", false);
      res.status(400).json({ title: error.title, message: error.message });
    } else {
      logRed(`Error 500 en products-from-shipment: ${error}`);
      crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(error.message), "/products-from-shipment", false);
      res
        .status(500)
        .json({ success: false, message: "Error interno del servidor." });
    }
  } finally {
    const endTime = performance.now();
    logPurple(
      `Tiempo de ejecución products-from-shipment: ${endTime - startTime} ms`
    );
  }
});

qr.post("/enter-flex", async (req, res) => {
  const startTime = performance.now();
  const { companyId, userId, dataQr, profile } = req.body;
  try {
    const mensajeError = verifyParamaters(
      req.body,
      ["companyId", "userId", "profile", "dataQr"],
      true
    );
    if (mensajeError) {
      logRed(`Error en enter-flex: ${mensajeError}`);
      throw new CustomException({
        title: "Error en enter-flex",
        message: mensajeError,
      });
    }

    const company = await getCompanyById(companyId);
    await enterFlex(company, dataQr, userId, profile);

    logGreen(`Enter flex ejecutado correctamente`);
    crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify({ message: "exito" }), "/enter-flex", true);
    res
      .status(200)
      .json({ message: "Datos obtenidos correctamente" });
  } catch (error) {
    if (error instanceof CustomException) {
      logRed(`Error 400 en enter-flex: ${error}`);
      crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(error), "/enter-flex", false);
      res.status(400).json({ message: error.title, body: error.message });
    } else {
      logRed(`Error 500 en enter-flex: ${error}`);
      crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(error.message), "/enter-flex", false);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  } finally {
    const endTime = performance.now();
    logPurple(`Tiempo de ejecución enter-flex: ${endTime - startTime} ms`);
  }
});

qr.post("/sku", verifyToken, async (req, res) => {
  const startTime = performance.now();
  let { companyId, userId, profile, dataQr } = req.body;
  try {
    const mensajeError = verifyParamaters(
      req.body,
      ["companyId", "dataQr"],
      true
    );
    if (mensajeError) {
      logRed(`Error en sku: ${mensajeError}`);
      throw new CustomException({
        title: "Error en sku",
        message: mensajeError,
      });
    }

    dataQr = parseIfJson(dataQr);

    const company = await getCompanyById(companyId);
    let result = await getSkuAndStockFlex(company, dataQr);

    logGreen(`SKU y cantidad de ítems obtenidos correctamente`);
    crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(result), "/sku", true);
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof CustomException) {
      logRed(`Error 400 en sku: ${error}`);
      crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(error), "/sku", false);
      res.status(400).json({ title: error.title, message: error.message });
    } else {
      logRed(`Error 500 en sku: ${error}`);
      crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(error.message), "/sku", false);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  } finally {
    const endTime = performance.now();
    logPurple(`Tiempo de ejecución sku: ${endTime - startTime} ms`);
  }
});

qr.post("/armado", verifyToken, async (req, res) => {
  const startTime = performance.now();
  const { companyId, userId, profile, dataEnvios, didCliente, fecha } = req.body;
  try {
    const mensajeError = verifyParamaters(
      req.body,
      ["userId", "dataEnvios", "didCliente", "fecha"],
      true
    );
    if (mensajeError) {
      logRed(`Error en armado: ${mensajeError}`);
      throw new CustomException({
        title: "Error en armado",
        message: mensajeError,
      });
    }

    const company = await getCompanyById(companyId);
    const result = await armado(company, userId, dataEnvios, didCliente, fecha);

    logGreen(`Armado ejecutado correctamente`);
    crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(result), "/armado", true);
    res.status(200).json({
      body: result,
      message: "Datos obtenidos correctamente",
      success: true,
    });
  } catch (error) {
    if (error instanceof CustomException) {
      logRed(`Error 400 en armado: ${error}`);
      crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(error), "/armado", false);
      res.status(400).json({ title: error.title, message: error.message });
    } else {
      logRed(`Error 500 en armado: ${error}`);
      crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(error.message), "/armado", false);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  } finally {
    const endTime = performance.now();
    logPurple(`Tiempo de ejecución armado: ${endTime - startTime} ms`);
  }
});

export default qr;
