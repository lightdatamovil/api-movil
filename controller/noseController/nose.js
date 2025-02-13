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

module.exports = { buscarcliente, buscarusuario, busxarzona };