const config = {
    1: { tz: 'America/Argentina/Buenos_Aires', locale: 'es-AR' },
    2: { tz: 'America/Santiago', locale: 'es-CL' },
    3: { tz: 'America/Sao_Paulo', locale: 'pt-BR' },
    4: { tz: 'America/Montevideo', locale: 'es-UY' },
    5: { tz: 'America/Bogota', locale: 'es-CO' },
    6: { tz: 'America/Mexico_City', locale: 'es-MX' },
    7: { tz: 'America/Lima', locale: 'es-PE' },
    8: { tz: 'America/Guayaquil', locale: 'es-EC' },
};

export function getHoraLocalDePais(idPais) {
    const conf = config[idPais];
    if (!conf) return null;

    const now = new Date();
    const formatter = new Intl.DateTimeFormat(conf.locale, {
        timeZone: conf.tz,
        dateStyle: 'short',
        timeStyle: 'medium',
        hour12: false,
    });

    return formatter.format(now);
}
