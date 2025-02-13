function buscarcliente(didCliente, Aclientescompany) {
    for (let j in Aclientescompany) {
        if (Aclientescompany[j]["did"] * 1 == didCliente) {
            return Aclientescompany[j]["nombre_fantasia"];
        }
    }
    return "";
}

function buscarusuario(diduser, Ausuarioscompany) {
    for (let j in Ausuarioscompany) {
        if (Ausuarioscompany[j]["did"] * 1 == diduser) {
            return Ausuarioscompany[j]["nombre"];
        }
    }
    return "";
}

function busxarzona(didzona, AzonasXEmpresa) {
    for (let j in AzonasXEmpresa) {
        if (AzonasXEmpresa[j]["did"] * 1 == didzona) {
            return AzonasXEmpresa[j]["nombre"];
        }
    }
    return "";
}

function verificarAsignacion(dbConnection, idenvio, diduser) {
    return new Promise((resolve, reject) => {
        const sqlAsignado =
            "SELECT id FROM envios_asignaciones WHERE superado = 0 AND elim = 0 AND didEnvio = ? AND operador = ?";

        dbConnection.query(sqlAsignado, [idenvio, diduser], (err, asignaciones) => {
            if (err) return reject(err);
            resolve(asignaciones.length > 0); // Retorna `true` si hay asignaciones, `false` si no.
            dbConnection.end();
        });
    });
};

module.exports = { buscarcliente, buscarusuario, busxarzona, verificarAsignacion };