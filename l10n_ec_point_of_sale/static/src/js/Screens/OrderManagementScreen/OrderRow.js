odoo.define('l10n_ec_point_of_sale.OrderRow', function (require) {
    'use strict';

    const OrderRow = require('point_of_sale.OrderRow');
    const Registries = require('point_of_sale.Registries');

    const L10n_ecORderRow = (OrderRow) =>
        class extends OrderRow {

            get name() {
                return (this.order.get_name().split(" ")[0] + " " + this.order.get_name().slice(this.order.get_name().length - 4));
            }
        };

    Registries.Component.extend(OrderRow, L10n_ecORderRow);

    return OrderRow;
});
