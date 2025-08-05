
export function verifyParamaters(body, param, userData = false) {

    if (userData) {
        param.push('companyId', 'userId', 'profile');
    }

    const faltantes = param.filter(p => !(p in body))

    if (faltantes.length > 0) {
        return `Faltan los siguientes parámetros: ${faltantes.join(', ')}`;
    }

    return null;
};