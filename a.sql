SELECT
    e.did as didEnvio,
    e.flex,
    e.ml_shipment_id,
    e.ml_venta_id,
    eh.estado,
    e.didCliente,
    DATE_FORMAT(e.fecha_inicio, '%d/%m/%Y') as fecha_inicio,
    DATE_FORMAT(eh.autofecha, '%d/%m/%Y') as fecha_historial,
    e.destination_receiver_name,
    e.destination_shipping_address_line as address_line,
    edd.address_line as address_lineEDD,
    e.destination_shipping_zip_code as cp,
    edd.cp as cpEDD,
    e.destination_city_name as localidad,
    edd.localidad as localidadEDD,
    edd.provincia,
    e.destination_receiver_phone,
    ROUND(e.destination_latitude, 8) as lat,
    ROUND(e.destination_longitude, 8) AS lng,
    ei.valor,
    e.destination_comments,
    edd.destination_comments AS destination_commentsEDD,
    rp.orden,
    ec.didCampoCobranza,
    e.choferAsignado,
    ec.valor
FROM
    envios_historial as eh
    LEFT JOIN envios AS e ON (
        e.superado = 0
        AND e.elim = 0
        AND e.did = eh.didEnvio
    )
    LEFT JOIN envios_logisticainversa AS ei ON (
        ei.superado = 0
        AND ei.elim = 0
        AND ei.didEnvio = eh.didEnvio
    )
    LEFT JOIN envios_asignaciones as ea ON (
        ea.superado = 0
        AND ea.elim = 0
        AND ea.didEnvio = eh.didEnvio
    )
    LEFT JOIN ruteo as r ON(
        r.elim = 0
        and r.superado = 0
        and r.fechaOperativa = CURDATE()
    )
    LEFT JOIN ruteo_paradas AS rp ON (
        rp.superado = 0
        AND rp.elim = 0
        AND rp.didPaquete = eH.didEnvio
        and rp.didRuteo = r.did
        and rp.autofecha like '2025-04-16%'
    )
    LEFT JOIN envios_cobranzas as ec on (
        ec.elim = 0
        and ec.superado = 0
        and ec.didEnvio = eh.didEnvio
        and ec.didCampoCobranza = 4
    )
    LEFT JOIN envios_direcciones_destino as edd on (
        edd.superado = 0
        and edd.elim = 0
        and edd.didEnvio = eh.didEnvio
    )
WHERE
    eh.superado = 0
    AND eh.elim = 0
    AND e.elim = 0
    AND eh.fecha BETWEEN '2025-04-09 00:00:00'
    AND '2025-04-16 23:59:59'
    AND eh.estado IN (0, 1, 2, 3, 6, 7, 10, 11, 12, 13)
GROUP BY
    eh.didEnvio
ORDER BY
    rp.orden ASC