import crypto from "crypto";
import { CustomException, generateToken, LightdataORM } from "lightdata-tools";
import { jwtSecret } from "../../db.js";
import MapConstants from "../../src/constants/map.js";

export async function login({ db, req, company }) {
  const { username, password } = req.body;

  const [user] = await LightdataORM.select({
    dbConnection: db,
    table: "sistema_usuarios",
    where: { usuario: username },
    select: `
      did, bloqueado, email, telefono, pass, usuario, direccion, imagen
    `,
    throwIfNotExists: true,
  });

  if (user.bloqueado === 1) {
    throw new CustomException({
      title: "Acceso denegado",
      message: "El usuario se encuentra bloqueado",
    });
  }

  const [sistemaUsuariosRow] = await LightdataORM.select({
    dbConnection: db,
    table: "sistema_usuarios_accesos",
    where: { usuario: user.did },
    select: "perfil",
    throwIfNotExists: true
  });

  const hashPassword = crypto.createHash("sha256").update(password).digest("hex");

  if (user.pass !== hashPassword) {
    throw new CustomException({
      title: "Contraseña incorrecta",
      message: "La contraseña ingresada no coincide",
    });
  }

  const token = generateToken({
    jwtSecret,
    payload: {
      userId: user.did,
      companyId: company.did,
      profile: sistemaUsuariosRow.perfil,
    },
    options: {},
    expiresIn: 3600 * 24 * 30,
    issuer: "https://apimovil2.lightdata.app",
    audience: "lightdata-apis",
  });

  let userHomeLatitude, userHomeLongitude;

  if (user.direccion) {
    try {
      const direccion = JSON.parse(user.direccion);
      userHomeLatitude = direccion.lat;
      userHomeLongitude = direccion.lng;
    } catch {
      userHomeLatitude = null;
      userHomeLongitude = null;
    }
  }

  const houses = [];

  if (userHomeLatitude && userHomeLongitude) {
    houses.push({
      id: MapConstants.inicioEnCasa,
      name: "Casa",
      abreviation: "casa",
      latitude: userHomeLatitude,
      longitude: userHomeLongitude,
    });
  }

  const data = {
    id: user.did,
    username: user.usuario,
    profile: sistemaUsuariosRow.perfil,
    email: user.email,
    profilePicture: user.imagen,
    phone: user.telefono,
    token,
    houses,
    version: "1.0.88",
  };

  return {
    success: true,
    data,
    message: "Usuario logueado correctamente",
    meta: {},
  };
}
