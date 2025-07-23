import { configPaises } from "./getFechaConHoraLocalByPais";

export function getFechaConHoraLocalDePais(idPais) {
    const conf = configPaises[idPais];
    if (!conf) return null;

    const now = new Date();

    const parts = new Intl.DateTimeFormat(conf.locale, {
        timeZone: conf.tz,
        hour12: false,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    }).formatToParts(now);

    const get = (type) => parts.find(p => p.type === type)?.value;

    const hora = get('hour');
    const minuto = get('minute');
    const segundo = get('second');

    return `${hora}:${minuto}:${segundo}`;
}