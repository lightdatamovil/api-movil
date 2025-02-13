const express = require('express');
const jwt = require('jsonwebtoken');
const mysql = require('mysql');
const router = express.Router();
const verifyToken = require('../src/funciones/verifyToken'); //funcion de verificar token 
const { empresasDB } = require('../server');
const {AclientesXEmpresa} = require('../server');
const {AusuariosXEmpresa} = require('../server');
const {AzonasXEmpresa} = require('../server');

function comparar(a, b) {
    // Si ambos tienen orden 0, se comparan normalmente
    if (a.orden === 0 && b.orden === 0) {
        return a.did - b.did; // Puedes usar cualquier otro campo para la comparación
    }
    // Si a tiene orden 0 y b no, a va al final
    else if (a.orden === 0) {
        return 1;
    }
    // Si b tiene orden 0 y a no, b va al final
    else if (b.orden === 0) {
        return -1;
    }
    // Si ninguno tiene orden 0, se comparan normalmente
    else {
        return a.orden - b.orden;
    }
}

async function executeQuery(connection, query, values) {
	return new Promise((resolve, reject) => {
	  connection.query(query, values, (err, results) => {
		if (err) {
		  reject(err);
		} else {
		  resolve(results);
		}
	  });
	});
}

function fechaToUnix_OLD(fecha) {
    // Dividir la fecha en día, mes y año
    const partes = fecha.split('/');
    const dia = parseInt(partes[0], 10);
    const mes = parseInt(partes[1], 10);
    const año = parseInt(partes[2], 10);
    const fechaJS = new Date(año, mes - 1, dia);
    const timestamp = fechaJS.getTime() / 1000;
    return timestamp;
}

function fechaToUnix(fecha) {
    // Dividir la fecha y hora
    const [fechaParte, horaParte] = fecha.split(' ');

    if (!fechaParte || !horaParte) {
        throw new Error("Formato de fecha y hora incorrecto. Debe ser 'DD/MM/YYYY HH:mm:ss'.");
    }
    
    // Dividir la fecha en día, mes y año
    const partesFecha = fechaParte.split('/');
    const dia = parseInt(partesFecha[0], 10);
    const mes = parseInt(partesFecha[1], 10);
    const año = parseInt(partesFecha[2], 10);

    if (isNaN(dia) || isNaN(mes) || isNaN(año)) {
        throw new Error("Formato de fecha incorrecto. Debe ser 'DD/MM/YYYY'.");
    }

    // Dividir la hora en horas, minutos y segundos
    const partesHora = horaParte.split(':');
    const horas = parseInt(partesHora[0], 10);
    const minutos = parseInt(partesHora[1], 10);
    const segundos = parseInt(partesHora[2], 10);

    if (isNaN(horas) || isNaN(minutos) || isNaN(segundos)) {
        throw new Error("Formato de hora incorrecto. Debe ser 'HH:mm:ss'.");
    }

    // Crear un objeto de fecha en JavaScript
    const fechaJS = new Date(año, mes - 1, dia, horas, minutos, segundos);

    // Verificar si la fecha es válida
    if (isNaN(fechaJS.getTime())) {
        throw new Error("La fecha generada es inválida.");
    }

    // Obtener el timestamp UNIX
    const timestamp = Math.floor(fechaJS.getTime() / 1000);

    return timestamp;
}

function getDbConfig(idEmpresa) {
  data = -1;
  for (let j in empresasDB) {
      if (empresasDB[j]["id"]*1 == idEmpresa) {
      	  data = empresasDB[j];
      }
  }
  return data // Devuelve null si la clave no existe
}

function buscarcliente(didCliente, Aclientesempresa){
	for (let j in Aclientesempresa) {
      if (Aclientesempresa[j]["did"]*1 == didCliente) {
      	  return Aclientesempresa[j]["nombre_fantasia"];
      }
	}
	return "";
}

function buscarusuario(diduser, Ausuariosempresa){
	for (let j in Ausuariosempresa) {
      if (Ausuariosempresa[j]["did"]*1 == diduser) {
      	  return Ausuariosempresa[j]["nombre"];
      }
	}
	return "";
}

function busxarzona(didzona,AzonasXEmpresa){
    for (let j in AzonasXEmpresa) {
      if (AzonasXEmpresa[j]["did"]*1 == didzona) {
      	  return AzonasXEmpresa[j]["nombre"];
      }
	}
	return "";
}


//Ruta para listar todos los clientes
router.post('/listar-envios', verifyToken, async (req, res) => {
	try {
		const { idEmpresa, perfil, diduser , desde, hasta} = req.body;
		const empresa = getDbConfig(idEmpresa);
		if (!empresa) {
			return res.status(400).json({ estadoRespuesta:false, body:"", mensaje: 'Empresa no encontrada' });
		}
		
		var fecha_desde = fechaToUnix(desde+" 00:00:00");
		var fecha_hasta = fechaToUnix(hasta+" 23:59:59");
		
		var Aclientesempresa = AclientesXEmpresa[idEmpresa];
		var Ausuariosempresa = AusuariosXEmpresa[idEmpresa];
		
		var sqlduenio = "";
		var sqlfecha = " AND e.fechaunix BETWEEN "+fecha_desde+" AND "+fecha_hasta;
		if(perfil == 2){
			sqlduenio = " AND e.didcliente = "+diduser;
		}else if (perfil == 3){
			sqlduenio = " AND e.choferAsignado = "+diduser;
		}

		 let dbConfig = {
			  host: "bhsmysql1.lightdata.com.ar",
			  user: empresa.dbuser,
			  password: empresa.dbpass,
			  database: empresa.dbname
		 };
		  
		const dbConnection = mysql.createConnection(dbConfig);
	
		await dbConnection.connect();
		var Atemp = [];
		let campos = "e.did, e.flex, e.ml_shipment_id, e.destination_latitude, e.destination_longitude, e.destination_shipping_zip_code, e.destination_city_name ,e.ml_venta_id,e.destination_shipping_address_line, e.estado_envio, e.destination_comments, date_format (e.fecha_inicio,'%d/%m/%Y') as fecha , e.destination_receiver_name, e.destination_receiver_phone, e.didCliente, e.choferAsignado, ei.valor, rp.orden"
		//estadoAsignacion
		if(idEmpresa == 4){
		    campos = campos +", e.estadoAsignacion";
		}

		let query = "SELECT "+campos+" FROM envios as e LEFT JOIN envios_logisticainversa as ei on ( ei.superado=0 and ei.elim=0 and ei.didEnvio = e.did ) left join ruteo_paradas as rp on (rp.superado=0 and rp.elim=0 and rp.didPaquete=e.did) WHERE e.elim=0 and e.superado=0 "+sqlfecha+sqlduenio;
		


// 			query = "SELECT e.did, e.flex, e.ml_shipment_id, e.destination_latitude, e.destination_longitude, e.destination_shipping_zip_code, e.destination_city_name, e.ml_venta_id, e.destination_shipping_address_line, e.estado_envio, e.destination_comments, date_format(e.fecha_inicio, '%d/%m/%Y') as fecha, e.destination_receiver_name, e.destination_receiver_phone, e.didCliente, e.choferAsignado, ei.valor FROM envios as e LEFT JOIN envios_logisticainversa as ei ON (ei.superado = 0 AND ei.elim = 0 AND ei.didEnvio = e.did) WHERE e.elim = 0 AND e.superado = 0 AND e.fechaunix BETWEEN 1731466800 AND 1731553199 AND e.estado_envio IN (5, 8, 9, 13, 14);";
			
            // query = "SELECT SUM(CASE WHEN estado IN (5, 8, 9, 13, 14) THEN 1 ELSE 0 END) as cerrados, SUM(CASE WHEN estado IN (5, 9) THEN 1 ELSE 0 END) as entregadoshoy FROM envios_historial WHERE superado = 0 AND elim = 0 AND fecha > '2024-11-13 00:00:00'";
            
		const results = await executeQuery(dbConnection, query, []);
		 
	   // res.status(200).json({ estadoRespuesta: true, body: Atemp , mensaje:query});
	    for(i=0; i < results.length; i++){
			var row = results[i];
			
			lat = 0;
			long = 0;
			if(row.destination_latitude != 0){
			    lat = row.destination_latitude*1;
			    long = row.destination_longitude*1;
			}
			
			 let logisticainversa = row.valor !== null;
			 let estadoAsignacion = row?.estadoAsignacion ?? 0;
			
			var objetoJSON = {
				"did": row.did,
				"flex": row.flex,
				"shipmentid": row.ml_shipment_id,
				"ml_venta_id": row.ml_venta_id,
				"estado": row.estado_envio,
				"nombreCliente": buscarcliente(row.didCliente, Aclientesempresa),
				"didCliente": row.didCliente,
				"fechaEmpresa":row.fecha,
				"estadoAsignacion": estadoAsignacion,
				"nombreDestinatario": row.destination_receiver_name,
				"direccion1": row.destination_shipping_address_line,
				"direccion2":"CP "+row.destination_shipping_zip_code +", "+row.destination_city_name,
				"telefono": row.destination_receiver_phone,
				 "lat": lat,
				 "long": long,
				 "logisticainversa" : logisticainversa, 
				 "observacionDestinatario": row.destination_comments,
				 "proximaentrega":false,
				 "orden":row.orden,
				 "cobranza":0,
				 "chofer":buscarusuario(row.choferAsignado, Ausuariosempresa)
			};

			Atemp.push(objetoJSON);
		}	
		  
		Atemp.sort(comparar);
		
		dbConnection.end();
	    res.status(200).json({ estadoRespuesta: true, body: Atemp , mensaje: ""});
	} catch (error) {
		console.error('Error al listar envios:', error);
		res.status(500).json({ estadoRespuesta: false, body:"", mensaje: 'Error interno del servidor' });
	} 
});
const verificarAsignacion = (dbConnection, idenvio, diduser) => {
  return new Promise((resolve, reject) => {
    const sqlAsignado =
      "SELECT id FROM envios_asignaciones WHERE superado = 0 AND elim = 0 AND didEnvio = ? AND operador = ?";
      
    dbConnection.query(sqlAsignado, [idenvio, diduser], (err, asignaciones) => {
      if (err) return reject(err);
      resolve(asignaciones.length > 0); // Retorna `true` si hay asignaciones, `false` si no.
    });
  });
};

//Ruta para obtener datos de un cliente por su índice en la lista
router.post("/obtener-envio", verifyToken, async (req, res) => {
  try {
    const { idEmpresa, perfil, diduser, idenvio } = req.body;
    const empresa = getDbConfig(idEmpresa);
    if (!empresa) {
      return res
        .status(400)
        .json({
          estadoRespuesta: false,
          body: "",
          mensaje: "Empresa no encontrada",
        });
    }

    var sqldidenvio = " AND e.did = " + idenvio;
    var dataEnvio = new Object();
    dataEnvio["historial"] = [];
    dataEnvio["observaciones"] = [];
    dataEnvio["imagenes"] = [];

    let dbConfig = {
      host: "bhsmysql1.lightdata.com.ar",
      user: empresa.dbuser,
      password: empresa.dbpass,
      database: empresa.dbname,
    };
    const dbConnection = mysql.createConnection(dbConfig);
    await dbConnection.connect();
    const query =
      "SELECT e.did, e.flex, e.ml_shipment_id, e.didCliente, e.destination_latitude, e.destination_longitude, e.destination_shipping_zip_code, e.destination_city_name ,e.ml_venta_id,e.destination_shipping_address_line, e.estado_envio, e.destination_comments, date_format (e.fecha_inicio,'%d/%m/%Y') as fecha , e.destination_receiver_name, e.destination_receiver_phone, e.didCliente, e.choferAsignado, ec.valor as monto_a_cobrar FROM envios as e LEFT JOIN envios_cobranzas as ec on ( ec.elim=0 and ec.superado=0 and ec.didCampoCobranza = 4 and e.did = ec.didEnvio) WHERE e.elim=0 and e.superado=0 " +
      sqldidenvio;
    const results = await executeQuery(dbConnection, query, []);
    var datatemp = results[0];

    lat = 0;
    long = 0;
    if (datatemp.destination_latitude != 0) {
      lat = datatemp.destination_latitude * 1;
      long = datatemp.destination_longitude * 1;
    }
   let asignado = await verificarAsignacion(dbConnection, idenvio, diduser);

    dataEnvio["nombreDestinatario"] = datatemp.destination_receiver_name;
    dataEnvio["nombreCliente"] = "";
    dataEnvio["didCliente"] = datatemp.didCliente * 1;
    dataEnvio["domicilio1"] = datatemp.destination_shipping_address_line;
    dataEnvio["domicilio2"] =
      "CP " +
      datatemp.destination_shipping_zip_code +
      ", " +
      datatemp.destination_city_name;
    dataEnvio["telefono"] = datatemp.destination_receiver_phone;
    dataEnvio["observacionDomicilio"] = datatemp.destination_comments;
    dataEnvio["estadoActual"] = datatemp.estado_envio;
    dataEnvio["id_venta"] = datatemp.ml_venta_id;
    dataEnvio["id_envio"] = datatemp.ml_shipment_id;
    dataEnvio["cobranza"] = 0;
    dataEnvio["latitud"] = lat;
    dataEnvio["longitud"] = long;
    dataEnvio["monto_a_cobrar"] = (datatemp.monto_a_cobrar ?? 0).toString();
    dataEnvio["asignado"] = asignado;

    const queryH =
      "SELECT estado, date_format(fecha,'%d/%m/%Y %H:%i:%s') as fecha FROM envios_historial where elim=0 and didEnvio = " +
      idenvio +
      " ORDER BY fecha ASC ";
    const resultsH = await executeQuery(dbConnection, queryH, []);
    for (i = 0; i < resultsH.length; i++) {
      var row = resultsH[i];
      dataEnvio["historial"].push({ estado: row.estado, fecha: row.fecha });
    }

    const queryN =
      "SELECT observacion,date_format(autofecha,'%d/%m/%Y %H:%i:%s') as fecha FROM `envios_observaciones` where elim=0 and didEnvio= " +
      idenvio +
      "  ORDER BY `id` ASC";
    const resultsN = await executeQuery(dbConnection, queryN, []);
    for (i = 0; i < resultsN.length; i++) {
      var row = resultsN[i];
      dataEnvio["observaciones"].push({
        observacion: row.observacion,
        fecha: row.fecha,
      });
    }

    //busco imagenes
    const queryF =
      "SELECT didEnvio,nombre,server FROM `envios_fotos` Where superado=0 and elim=0 and didEnvio = " +
      idenvio +
      "   ORDER BY `id` DESC";
    const resultsF = await executeQuery(dbConnection, queryF, []);
    for (i = 0; i < resultsF.length; i++) {
      var row = resultsF[i];
      dataEnvio["imagenes"].push({
        server: row.server,
        imagen: row.nombre,
        didenvio: row.didEnvio,
      });
    }

    dbConnection.end();
    res
      .status(200)
      .json({ estadoRespuesta: true, body: dataEnvio, mensaje: "" });
  } catch (error) {
    console.error("Error al obtener el cliente:", error);
    res
      .status(500)
      .json({
        estadoRespuesta: false,
        body: "",
        mensaje: "Error interno del servidor" + error,
      });
  }
});

//Ruta para crossdockingr
router.post('/crossdocking', verifyToken,async (req, res) => { 
    
    const {   didEmpresa, perfil, quien , dataqr} = req.body;
    var  idEmpresa = didEmpresa;
    
    console.log("crossdocking");

    const Adataqr = JSON.parse(dataqr);
    
    
    var Aclientesempresa = AclientesXEmpresa[idEmpresa];
	var Ausuariosempresa = AusuariosXEmpresa[idEmpresa];
	var Azonasempresa = AzonasXEmpresa[idEmpresa];
  
	try {   
        const empresa = getDbConfig(idEmpresa);
    	if (!empresa) {
    		return res.status(400).json({ estadoRespuesta:false, body:"", mensaje: 'Empresa no encontrada' });
    	}
    	
    	var dataEnvio = new Object();
    	var didenvio= 0;

    	let dbConfig = {
    		  host: "bhsmysql1.lightdata.com.ar",
    		  user: empresa.dbuser,
    		  password: empresa.dbpass,
    		  database: empresa.dbname
    	 };
    	const dbConnection = mysql.createConnection(dbConfig);
    	await dbConnection.connect();
    	
    	var sqldidenvio = "";
    	
    	if (Adataqr.hasOwnProperty('sender_id')) {
 
            sqldidenvio = " AND ml_shipment_id = '"+Adataqr.id+"' AND ml_vendedor_id = '"+Adataqr.sender_id+"'";
            didenvio = 77;
        } else {
            sqldidenvio = " and did = "+Adataqr.did;
            didenvio = 77;
        }
            
    	
    	if(didenvio > 0){
        	var queryE = "SELECT e.estado_envio, e.didCliente, e.choferAsignado, e.didEnvioZona ,date_format(e.fecha_inicio, '%d/%m/%Y') as fecha  FROM envios as e WHERE e.elim=0 and e.superado=0 "+sqldidenvio;
        
        	const results = await executeQuery(dbConnection, queryE, []);
        	var datatemp = results[0];

        	dataEnvio["Fecha"] = datatemp.fecha;
        	dataEnvio["zonaNombre"] = busxarzona(datatemp.didEnvioZona,Azonasempresa);
        	dataEnvio["Chofer"] = buscarusuario(datatemp.choferAsignado, Ausuariosempresa);
        	dataEnvio["Cliente"] = buscarcliente(datatemp.didCliente, Aclientesempresa);
        	dataEnvio["estado"] = datatemp.estado_envio*1;
        	
        	dbConnection.end();    	
    	    res.status(200).json({ estadoRespuesta: true, body: dataEnvio , mensaje: ""});
    	}else{
    	   dbConnection.end();    	
    	   res.status(200).json({ estadoRespuesta: false, body: "" , mensaje: "No esta cargado el envio en el sistema"});
    	}
	    
    } catch (error) {
		console.error('Error al listar envios:', error);
		res.status(500).json({ estadoRespuesta: false, body:"", mensaje: 'Error interno del servidor' });
	} 
    
});


module.exports = router;