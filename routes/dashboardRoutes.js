const express = require('express');
const jwt = require('jsonwebtoken');
const mysql = require('mysql');

const router = express.Router();
const verifyToken = require('../src/funciones/verifyToken'); //funcion de verificar token 
const { empresasDB } = require('../server');

// Ruta para crear un nuevo cliente
router.post('/getdatadash', verifyToken, async (req, res) => {
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