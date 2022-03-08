odoo.define('l10n_ec_point_of_sale.InventoryButton', function (require) {
    "use strict";

    const PosComponent = require('point_of_sale.PosComponent');
    const Registries = require('point_of_sale.Registries');

    class InventoryButton extends PosComponent {
        constructor() {
            super(...arguments);
        }

        onClick() {
            const currentOrder = this.env.pos.get_order();
            if (currentOrder != null) {
                this.showPopup('InventoryPopup', {});
            } else {
                this.showPopup('ErrorPopup', {
                    title: 'Error',
                    body: 'Ingrese a la pagina de pedidos primero por favor.',
                });
            }
        }
    }

    InventoryButton.template = 'InventoryButton';


    Registries.Component.add(InventoryButton);
    return InventoryButton;
});
