const express = require('express');
const jwt = require('jsonwebtoken');
const mysql = require('mysql');
const router = express.Router();
const verifyToken = require('../src/funciones/verifyToken'); //funcion de verificar token 
const { empresasDB } = require('../server');
const {AclientesXEmpresa} = require('../server');
const {AusuariosXEmpresa} = require('../server');
const {AzonasXEmpresa} = require('../server');

function getDbConfig(idEmpresa) {
  data = -1;
  for (let j in empresasDB) {
      if (empresasDB[j]["id"]*1 == idEmpresa) {
      	  data = empresasDB[j];
      }
  }
  return data; // Devuelve null si la clave no existe
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

router.post('/comenzarruta',verifyToken,  async (req, res) => {	
    const { didEmpresa, perfil, didUser  } = req.body;
    const empresa = getDbConfig(didEmpresa);	
    if (!empresa) {		
	    return res.status(400).json({ estadoRespuesta:false, body:"", mensaje: 'Empresa no encontrada' });	
	}else{	
	    
	    let dbConfig = {
	        host: "bhsmysql1.lightdata.com.ar",			  
	        user: empresa.dbuser,			 
	        password: empresa.dbpass,			 
	        database: empresa.dbname	
	        };	
	        
	        
	    const dbConnection = mysql.createConnection(dbConfig);	
	    await dbConnection.connect();
  
	}
});

router.post('/terminarruta',verifyToken,  async (req, res) => {	
    const { didEmpresa, perfil, didUser  } = req.body;
    const empresa = getDbConfig(didEmpresa);	
    if (!empresa) {		
	    return res.status(400).json({ estadoRespuesta:false, body:"", mensaje: 'Empresa no encontrada' });	
	}else{	
	    
	    
	}
});

router.post('/verificarrutacomenzada',verifyToken,  async (req, res) => {	
    const { didEmpresa, perfil, didUser  } = req.body;
	const empresa = getDbConfig(didEmpresa);	
	if (!empresa) {		
	    return res.status(400).json({ estadoRespuesta:false, body:"", mensaje: 'Empresa no encontrada' });	
	}else{	
	    
	   let dbConfig = {
	        host: "bhsmysql1.lightdata.com.ar",			  
	        user: empresa.dbuser,			 
	        password: empresa.dbpass,			 
	        database: empresa.dbname	
	        };	
	        
	        
	    const dbConnection = mysql.createConnection(dbConfig);	
	    await dbConnection.connect();
	    let esta = false;
	   
	    const sql = `SELECT tipo FROM cadetes_movimientos WHERE didCadete = ${didUser} AND DATE(autofecha) = CURDATE() ORDER BY id DESC LIMIT 1`;

        
        // Ejecutar consulta
        dbConnection.query(sql, (err, results) => {
          if (err) {
              res.status(200).json({ estadoRespuesta: false, body: "" , mensaje: ""});	
                console.error('Error al ejecutar la consulta: ' + err.stack);
                return;
          }
        
          // Procesar resultados
          if (results.length > 0) {
            esta2 = results[0].tipo;
            if(esta2 == 1 ){
                esta = true;
            }
            //console.log('El resultado es: ', esta);
          } else {
            //console.log('No se encontraron resultados.');
          }
          
           dbConnection.end();
          res.status(200).json({ estadoRespuesta: true, body: esta , mensaje: ""});	
        
          // Cerrar conexi贸n
         
        });
        
	   
	}	
    
});

// Ruta para geoposicionar
router.post('/geoposicionar', verifyToken, async (req, res) => {

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

		cliente.setDataDB(dbConfig); // Configurar datos de conexi贸n



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

// Ruta para guardar ruteo
router.post('/guardarRuta', verifyToken, async (req, res) => {

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

		cliente.setDataDB(dbConfig); // Configurar datos de conexi贸n



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


module.exports = router;`