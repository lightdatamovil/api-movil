import mysql2 from "mysql2";
import { executeQuery, getProdDbConfig } from "../../db.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { logRed } from "../../src/funciones/logsCustom.js";
import CustomException from "../../classes/custom_exception.js";

function generateToken(userId, idEmpresa, perfil) {
  const payload = { userId, perfil, idEmpresa };
  const options = { expiresIn: "2558h" };
  return jwt.sign(payload, "ruteate", options);
}

export async function login(username, password, company) {
  const dbConfig = getProdDbConfig(company);
  const dbConnection = mysql2.createConnection(dbConfig);
  dbConnection.connect();

  try {

    let userAddress = {};

    const userQuery = `SELECT
    u.did,
    u.bloqueado,
    u.nombre,
    u.apellido,
    u.email,
    u.telefono,
    u.pass,
    u.elim,
    u.usuario,
    u.token_fcm,
    a.perfil,
    u.direccion
    FROM sistema_usuarios as u
    JOIN sistema_usuarios_accesos as a on (a.elim=0 and a.superado=0 and a.usuario = u.did)
    WHERE u.usuario = ? AND u.elim=0 and u.superado=0 `;

    const resultsFromUserQuery = await executeQuery(dbConnection, userQuery, [
      username,
    ]);

    if (resultsFromUserQuery.length === 0) {
      throw new CustomException({
        title: "Usuario inválido",
        message: "Usuario no encontrado en el sistema",
      });
    }

    const user = resultsFromUserQuery[0];

    if (user.bloqueado === 1) {
      throw new CustomException({
        title: "Acceso denegado",
        message: "El usuario se encuentra bloqueado",
      });
    }

    const hashPassword = crypto
      .createHash("sha256")
      .update(password)
      .digest("hex");
    if (user.pass !== hashPassword) {
      throw new CustomException({
        title: "Contraseña incorrecta",
        message: "La contraseña ingresada no coincide",
      });
    }

    const token = generateToken(user.did, company.did, user.perfil);

    let userHomeLatitude, userHomeLongitude;
    if (user.direccion != "") {
      userAddress = JSON.parse(user.direccion);
      userHomeLatitude = userAddress.lat;
      userHomeLongitude = userAddress.lng;
    }

    const userHouses = [];

    if (userHomeLatitude && userHomeLongitude) {
      userHouses.push({
        id: 0,
        name: "Casa",
        abreviation: "casa",
        latitude: userHomeLatitude,
        longitude: userHomeLongitude,
      });
    }
    return {
      id: user.did,
      username: user.usuario,
      profile: user.perfil,
      email: user.email,
      profilePicture: "",
      hasShipmentProductsQr: company.did == 200 || company.did == 274,
      phone: user.telefono,
      token,
      houses: userHouses,
      version: "1.0.98",
    };
  } catch (error) {
    logRed(`Error en login: ${error.stack}`);
    if (error instanceof CustomException) {
      throw error;
    }
    throw new CustomException({
      title: "No pudimos iniciar sesión",
      message: error.message,
      stack: error.stack,
    });
  } finally {
    dbConnection.end();
  }
}
