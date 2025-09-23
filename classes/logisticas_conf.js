export default class LogisticaConf {

    static tieneBarcode = {
        12: 44,
        55: 184,
        211: 301,
        20: 215,
        327: 15,
    };

    static hasEnvioFoto = [270, 275, 334];
    static hasProductsQr = [274, 200];
    static granLogisticaPlans = [24, 35, 52];
    static hasMultiDepot = [];
    static hasAppPro = [];
    static hasObligatoryImageOnRegisterVisit = [108];
    static hasObligatoryDniAndNameOnRegisterVisit = [97, 217];

    static hasBarcodeEnabled(did) {
        return String(did) in this.tieneBarcode;
    }

    static hasObligatoryImageOnRegisterVisitEnabled(did) {
        return this.hasObligatoryImageOnRegisterVisit.includes(did * 1);
    }

    static hasObligatoryDniAndNameOnRegisterVisitEnabled(did) {
        return this.hasObligatoryDniAndNameOnRegisterVisit.includes(did * 1);
    }

    static hasMultiDepotEnabled(did) {
        return this.hasMultiDepot.includes(did * 1) || this.granLogisticaPlans.includes(did * 1);
    }

    static hasEnvioFotoEnabled(did) {
        return this.hasEnvioFoto.includes(did * 1);
    }

    static hasProductsQrEnabled(did) {
        return this.hasProductsQr.includes(did * 1);
    }

    static getSenderId(did) {
        return this.tieneBarcode?.[String(did * 1)] ?? 0;
    }
}
