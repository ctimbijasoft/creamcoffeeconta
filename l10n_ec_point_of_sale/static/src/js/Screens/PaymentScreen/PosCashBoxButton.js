odoo.define('l10n_ec_point_of_sale.PosCashBoxButton', function (require) {
    "use strict";

    const PosComponent = require('point_of_sale.PosComponent');
    const Registries = require('point_of_sale.Registries');

    // let EscPosEncoder = require('l10n_ec_point_of_sale.EscPosEncoder');
    // let encoder = new EscPosEncoder();

    class PosCashBoxButton extends PosComponent {
        constructor() {
            super(...arguments);
        }

        onClick() {
            this.env.pos.printers[0].open_cashbox();
        }
    }

    PosCashBoxButton.template = 'PosCashBoxButton';

    Registries.Component.add(PosCashBoxButton);
    return PosCashBoxButton;
});
