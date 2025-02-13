function buscarcliente(didCliente, Aclientesempresa) {
    for (let j in Aclientesempresa) {
        if (Aclientesempresa[j]["did"] * 1 == didCliente) {
            return Aclientesempresa[j]["nombre_fantasia"];
        }
    }
    return "";
}

function buscarusuario(diduser, Ausuariosempresa) {
    for (let j in Ausuariosempresa) {
        if (Ausuariosempresa[j]["did"] * 1 == diduser) {
            return Ausuariosempresa[j]["nombre"];
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