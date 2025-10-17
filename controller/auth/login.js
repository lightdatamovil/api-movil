import crypto from "crypto";
import { CustomException, generateToken, LightdataORM } from "lightdata-tools";
import { jwtSecret } from "../../db.js";

export async function login(dbConnection, req, company) {
  const { username, password } = req.body;

  const userResult = await LightdataORM.select({
    dbConnection,
    table: "sistema_usuarios",
    where: { usuario: username },
    select: `
      did, bloqueado, nombre, apellido, email, telefono, pass, elim, usuario, token_fcm, direccion
    `
  });

  if (!userResult.length) {
    throw new CustomException({
      title: "Usuario inválido",
      message: "Usuario no encontrado en el sistema",
    });
  }

  const user = userResult[0];

  const accessResult = await LightdataORM.select({
    dbConnection,
    table: "sistema_usuarios_accesos",
    where: { usuario: user.did },
    select: "perfil"
  });

  if (!accessResult.length) {
    throw new CustomException({
      title: "Acceso denegado",
      message: "El usuario no tiene accesos registrados",
    });
  }

  user.perfil = accessResult[0].perfil;

  if (user.bloqueado === 1) {
    throw new CustomException({
      title: "Acceso denegado",
      message: "El usuario se encuentra bloqueado",
    });
  }

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
      profile: user.perfil,
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
      id: 0,
      name: "Casa",
      abreviation: "casa",
      latitude: userHomeLatitude,
      longitude: userHomeLongitude,
    });
  }

  const data = {
    id: user.did,
    username: user.usuario,
    profile: user.perfil,
    email: user.email,
    profilePicture: "",
    phone: user.telefono,
    token,
    houses,
    version: "1.0.87",
  };

  return {
    success: true,
    data,
    message: "Usuario logueado correctamente",
    meta: {},
  };
}
