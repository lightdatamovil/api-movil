const jwt = require('jsonwebtoken');
const mysql = require('mysql');
const crypto = require('crypto');
const axios = require('axios');

class InstallAPP {
  constructor(Aempresas) {
    this.Aempresas = Aempresas;
  }

  async install(codigoEmpresa) {
	  let esta = "";
	  let Awps = [];

	  for (let j in this.Aempresas) {

		if (this.Aempresas[j]["codigo"] === codigoEmpresa) {
		  const imageUrl = this.Aempresas[j]["url"] + "/app-assets/images/logo/logo.png";

		  try {
			const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });

			if (response.status === 200) {
			  const imageBuffer = Buffer.from(response.data, 'binary');
			  const imageBase64 = imageBuffer.toString('base64');
			  
			  let colectapro = false;
			  let apppro = false;
			  if(this.Aempresas[j]["id"] == 4){
			      //colectapro = true;
			      apppro = true;
			  }
			  
			  //Awps = [];

			  esta = {
				"id": this.Aempresas[j]["id"] * 1,
				"plan": this.Aempresas[j]["plan"] * 1,
				"url": this.Aempresas[j]["url"],
				"pais": this.Aempresas[j]["pais"] * 1,
				"name": this.Aempresas[j]["empresa"],
				"b64": imageBase64, // Aquí se coloca la imagen en Base64
				"authentication": true,
				"apppro": apppro,
				"colectapro": colectapro,
				"registroVisitaImagenObligatoria": this.Aempresas[j]["id"] * 1 == 108,
				"registroVisitaDniYNombreObligatorio": this.Aempresas[j]["id"] * 1 == 97,
			  };
			  
			  return esta;
			} else {
			  console.error('Error al descargar la imagen. Codigo de estado:', response.status);
			}
		  } catch (error) {
			console.error('Error al descargar la imagen:', error);
		  }

		  break;
		}
	  }

	  if (esta === "") {
		esta = {
		  "id": 0,
		  "plan": 0,
		  "url": "",
		  "pais": 0,
		  "name": "",
		  "b64": "",
		  "authentication": false,
		  "apppro":false
		};
	  }

	  return esta;
	}

}

module.exports = InstallAPP;
