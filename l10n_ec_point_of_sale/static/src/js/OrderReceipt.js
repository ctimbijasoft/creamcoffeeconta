odoo.define('l10n_ec_point_of_sale.OrderReceipt', function (require) {
    "use strict";

    var models = require('point_of_sale.models');
    var _super_order = models.Order.prototype;
    var field_utils = require('web.field_utils');

    models.Order = models.Order.extend({
        export_for_printing: function () {
            var result = _super_order.export_for_printing.apply(this, arguments);
            var savedAmount = this.saved_amount();
            var customer = this.customer();

            result.customer_count = 0;

            result.cosumidor_final = this.is_cosumidor_final(customer);
            if (savedAmount > 0) {
                result.saved_amount = this.pos.format_currency(savedAmount);
            }
            if (customer !== null && (!this.is_cosumidor_final(customer) || result.paymentlines.length > 0)) {
                result.customer_name = !customer.name ? '' : customer.name;
                result.customer_vat = customer.vat === false ? '' : customer.vat;
                result.email = customer.email === false ? '' : customer.email;
                result.address = customer.address === false ? '' : customer.address;
                result.mobile = customer.mobile === false ? '' : customer.mobile;
            } else {
                result.customer_name = '__________________________________';
                result.customer_vat = '________________________________';
                result.email = '_____________________________________';
                result.address = '_________________________________';
                result.mobile = '__________________________________';
            }
            result.name2 = (result.name.split(" ")[0] + " #" + result.name.slice(result.name.length - 4));
            console.log(result.date);
            // result.date2 = field_utils.format.datetime(result.date, {}, {timezone: false});
            result.date2 = result.date.localestring;
            return result;
        },
        saved_amount: function () {
            const order = this.pos.get_order();
            return _.reduce(order.orderlines.models,
                function (rem, line) {
                    var diffrence = (line.product.lst_price * line.quantity) - line.get_base_price();
                    return rem + diffrence;
                }, 0);
        },
        customer: function () {
            return this.get_client();
        },
        is_cosumidor_final: function (customer) {
            if (customer === null) {
                return false;
            }
            return customer.name.toUpperCase() === "CONSUMIDOR FINAL";
        },

    });

});
