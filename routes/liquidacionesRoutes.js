const express = require('express');
const jwt = require('jsonwebtoken');
const mysql = require('mysql');

const router = express.Router();
const verifyToken = require('../src/funciones/verifyToken'); //funcion de verificar token 
const { empresasDB } = require('../server');

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

function getDbConfig(idEmpresa) {
  data = -1;
  for (let j in empresasDB) {
      if (empresasDB[j]["id"]*1 == idEmpresa) {
      	  data = empresasDB[j];
      }
  }
  return data // Devuelve null si la clave no existe
}

// Ruta para listar cuentas
router.post('/listarLiquidaciones', verifyToken, async (req, res) => {
    /*
	try {

		const { idEmpresa, perfil, diduser } = req.body;
		const empresa = getDbConfig(idEmpresa);

		if (!empresa) {
			return res.status(400).json({ estadoRespuesta:false, body:"", mensaje: 'Empresa no encontrada' });
		}

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
		const query = "SELECT e.did, e.flex, e.ml_shipment_id, e.destination_latitude, e.destination_longitude, e.destination_shipping_zip_code, e.destination_city_name ,e.ml_venta_id,e.destination_shipping_address_line, e.estado_envio, e.destination_comments, date_format (e.fecha_inicio,'%d/%m/%Y') as fecha , e.destination_receiver_name, e.destination_receiver_phone, e.didCliente, e.choferAsignado FROM envios as e WHERE e.elim=0 and e.superado=0 "+sqlfecha+sqlduenio;
		const results = await executeQuery(dbConnection, query, []);

	    for(i=0; i < results.length; i++){

			var row = results[i];
			var objetoJSON = {

				"did": row.did,

				"flex": row.flex,

				"shipmentid": row.ml_shipment_id,

				"ml_venta_id": row.ml_venta_id,

				"estado": row.estado_envio,

				"nombreCliente": buscarcliente(row.didCliente, Aclientesempresa),

				"fechaEmpresa":row.fecha,

				"nombreDestinatario": row.destination_receiver_name,

				"direccion1": row.destination_shipping_address_line,

				"direccion2":"CP "+row.destination_shipping_zip_code +", "+row.destination_city_name,

				"telefono": row.destination_receiver_phone,

				 "lat": row.destination_latitude,

				 "long": row.destination_longitude,

				 "observacionDestinatario": row.destination_comments,

				 "orden":0,

				 "cobranza":0,

				 "chofer":buscarusuario(row.choferAsignado, Ausuariosempresa)
			};

			Atemp.push(objetoJSON);
		}	

		dbConnection.end();
	    res.status(200).json({ estadoRespuesta: true, body: Atemp , mensaje: ""});
	} catch (error) {
		console.error('Error al listar envios:', error);
		res.status(500).json({ estadoRespuesta: false, body:"", mensaje: 'Error interno del servidor' });
	}
    */
});

// Ruta para listar cuentas
router.post('/getLiquidacion', verifyToken, async (req, res) => {

	/*

	try {

		const { nombrefantasia, razonsocial, codigo, habilitado, contactos, direcciones, quien ,did} = req.body;

		const { userId, perfil, idEmpresa } = req.decoded;

		 

		const dbConfig = getDbConfig(idEmpresa);

		if (!dbConfig) {

			return res.status(400).json({ estado:false, message: 'Empresa no encontrada' });

		}



		// Crear una instancia de la clase Cliente

		const cliente = new Cliente();

		cliente.setDataDB(dbConfig); // Configurar datos de conexión



		cliente.setDid(did);

		cliente.setNombrefantasia(nombrefantasia);

		cliente.setRazonsocial(razonsocial);

		cliente.setCodigo(codigo);

		cliente.setHabilitado(habilitado);

		cliente.setContactos(contactos);

		cliente.setDirecciones(direcciones);



		const guardarResult = await cliente.guardar(userId, res);

		console.log("guardarResult",guardarResult);



		

	} catch (error) {

		console.error('Error al crear el cliente:', error);

		res.status(500).json({ estado: false, mensaje: 'Error interno del servidor' });

	}

	*/

});

module.exports = router;