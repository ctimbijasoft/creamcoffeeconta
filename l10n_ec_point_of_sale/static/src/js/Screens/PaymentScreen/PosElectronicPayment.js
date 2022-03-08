odoo.define('l10n_ec_point_of_sale.PosElectronicPayment', function (require) {
    "use strict";

    const PosComponent = require('point_of_sale.PosComponent');
    const Registries = require('point_of_sale.Registries');


    class PosElectronicPayment extends PosComponent {
        constructor() {
            super(...arguments);
        }

    }

    PosElectronicPayment.template = 'PosElectronicPayment';

    Registries.Component.add(PosElectronicPayment);
    return PosElectronicPayment;
});
