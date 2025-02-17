
export function getUrls(company) {
    const urls = {
        /// HOME
        home: ["http://localhost:13000/api/home/home"],
        startRoute: ["http://localhost:13000/api/home/start-route"],
        endRoute: ["http://localhost:13000/api/home/end-route"],
        verifyStartedRoute: ["http://localhost:13000/api/home/verify-started-route"],

        /// SHIPMENT-LIST
        shipmentList: ["http://localhost:13000/api/shipments/shipment-list"],
        shipmentDetails: ["http://localhost:13000/api/shipments/shipment-details"],
        registerVisit: ["https://registros.lightdatas2.com.ar/registrarVisita.php"],
        saveImagen: ["http://localhost:13000/api/rutas/save-image"],
        nextToDeliver: ["https://apimovil.lightdata.app/api/envios/proximaentrega.php"],

        /// SETTLEMENTS
        settlementList: ["https://apimovil.lightdata.app/api/liquidaciones/responseListadoLiquidaciones.php"],
        settlementDetails: ["https://apimovil.lightdata.app/api/liquidaciones/responseDetalleLiquidacion.php"],
        settlementShipmentDetails: ["https://apimovil.lightdata.app/api/liquidaciones/responseDetalleLiquidacionEnvio.php"],

        /// MAP
        geolocalize: ["http://localhost:13000/api/map/geolocalize"],
        getRoute: ["http://localhost:13000/api/map/get-route-by-user"],
        saveRoute: ["http://localhost:13000/api/map/save-route"],

        /// QR
        driverList: ["http://localhost:13000/api/qr/driver-list"],
        colecta: ["https://apimovil.lightdata.app/api/envios/colecta.php"],
        aplanta: ["https://apimovil.lightdata.app/api/envios/aplanta.php"],
        readQr: ["http://localhost:13000/api/qr/get-shipment-id"],
        crossdocking: ["http://localhost:13000/api/qr/cross-docking"],
        ingresarflex: ["https://apimovil.lightdata.app/api/envios/ingresar-flex.php"],
        asignaciones: ["https://asignaciones.lightdatas2.com.ar/asignav3/asignar"],
        infopaquete: ["https://lightdata.app/g/instalation/responseinfopaquete.php"],

        /// PROFILE
        changePassword: ["http://localhost:13000/api/users/change-password"],
        editUser: ["http://localhost:13000/api/users/edit-user"],
        changeProfilePicture: ["http://localhost:13000/api/users/change-profile-picture"],

        /// COLLECT MODULE
        colecta_detalle: ["https://apimovil.lightdata.app/api/colecta/getDetalleColecta.php"],
        colecta_detalle_cliente: ["https://apimovil.lightdata.app/api/colecta/getDetalleColecta_cliente.php"],
        colectas: ["https://apimovil.lightdata.app/api/colecta/getColectas.php"],
        colecta_ruta: ["https://apimovil.lightdata.app/api/colecta/getRutaColecta.php"],
        colecta_liquidaciones: ["https://apimovil.lightdata.app/api/colecta/controlador_liquidacion.php"],

        /// ACCOUNTS
        cuentas_listado: ["https://lightdata.app/g/instalation/responseListadoCuentas.php"],
        cuentas_alta: ["https://lightdata.app/g/instalation/responseDetalleCuenta.php"],

        /// BACKGPS
        backgps: ["https://backgps.lightdata.app/backgps"],

        /// WSP
        wsp: ["http://localhost:13000/api/auth/whatsapp-message-list"],
    };

    if (company != null && company.did == 4) {
        urls.asignaciones = ["https://asignaciones.lightdatas2.com.ar/asignaciones/procourrier/index.php"];
    }

    return urls;
}