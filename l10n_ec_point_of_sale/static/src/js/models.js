odoo.define('l10n_ec_point_of_sale.models', function (require) {
    "use strict";

    var models = require('point_of_sale.models');
    var _super_Order = models.Order.prototype;
    var exports = {};
    exports.Orderline = models.Orderline;

    models.load_fields("pos.order", ['pos_voucher_ref']);

    models.load_fields(
        'pos.category',
        ['id', 'name', 'parent_id', 'child_id', 'write_date', 'sequence', 'highlight']
    );

    models.Order = models.Order.extend({
        initialize: function (attr, options) {
            _super_Order.initialize.apply(this, arguments);

            this.pos_voucher_ref = this.pos_voucher_ref || "";
            this.is_electronic_payment = this.is_electronic_payment || false;
            this.access_key = this.access_key || "";
            this.num_invoice = this.num_invoice || "";
            this.is_invoice = false;
            this.save_to_db();
        },

        add_paymentline: function (payment_method) {
            this.is_electronic_payment = this.used_electronic_payment(payment_method);
            return _super_Order.add_paymentline.apply(this, arguments);
        },
        remove_paymentline: function (line) {
            if (this.used_electronic_payment(line.payment_method)) {
                this.is_electronic_payment = false;
            }
            return _super_Order.remove_paymentline.apply(this, arguments);
        },

        used_electronic_payment(payment_method) {
            return payment_method.is_cash_count !== true;
        },

        electronic_payment() {
            return this.is_electronic_payment;
        },

        export_as_JSON: function () {
            var json = _super_Order.export_as_JSON.apply(this, arguments);
            json.pos_voucher_ref = this.pos_voucher_ref;
            json.is_electronic_payment = this.is_electronic_payment ? this.is_electronic_payment : undefined;
            json.access_key = this.access_key ? this.access_key : "";
            json.num_invoice = this.num_invoice ? this.num_invoice : "";
            json.is_invoice = this.is_invoice ? this.is_invoice : "";
            return json;
        },
        export_for_printing: function () {
            var json = _super_Order.export_for_printing.apply(this, arguments);
            json.pos_voucher_ref = this.get_pos_voucher_ref();
            json.is_electronic_payment = this.is_electronic_payment ? this.is_electronic_payment : undefined;
            json.access_key = this.access_key ? this.access_key : undefined;
            json.num_invoice = this.num_invoice ? this.num_invoice : undefined;
            json.is_invoice = this.is_invoice ? this.is_invoice : undefined;
            return json;
        },
        init_from_JSON: function (json) {
            _super_Order.init_from_JSON.apply(this, arguments);
            this.pos_voucher_ref = json.pos_voucher_ref ? json.pos_voucher_ref : "";
            this.is_electronic_payment = json.is_electronic_payment ? json.is_electronic_payment : false;
            this.access_key = json.access_key ? json.access_key : "";
            this.num_invoice = json.num_invoice ? json.num_invoice : "";
            this.is_invoice = json.is_invoice ? json.is_invoice : "";
        },

        get_clave_acceso: async function (account_move) {
            var domain = [['id', '=', account_move]];
            const result = await this.pos.rpc({
                model: 'account.move',
                method: 'search_read',
                args: [domain, ['l10n_ec_edi_sri_uuid']],
            });
            if (result) {
                return result[0].l10n_ec_edi_sri_uuid
            } else {
                return "0000000000000000000000000000000000000000000000000";
            }
        },
        get_num_invoice: async function (account_move) {
            var domain = [['id', '=', account_move]];
            const result = await this.pos.rpc({
                model: 'account.move',
                method: 'search_read',
                args: [domain, ['name']],
            });
            if (result) {
                const num_invoice = result[0].name;
                return num_invoice.split(" ")[1];
            } else {
                return "000-000-0000000000";
            }
        },

        set_pos_voucher_ref: function (pos_voucher_ref) {
            this.pos_voucher_ref = pos_voucher_ref;
        },

        get_pos_voucher_ref: function () {
            return this.pos_voucher_ref;
        },

        set_access_key: function (access_key) {
            this.access_key = access_key;
        },

        set_is_invoice: function (is_invoice) {
            console.log(is_invoice);
            this.is_invoice = is_invoice;
        },

        set_num_invoice: function (num_invoice) {
            this.num_invoice = num_invoice;
        },

        get_account_move: async function (name) {
            var domain = [['pos_reference', '=', name]];
            const result = await this.pos.rpc({
                model: 'pos.order',
                method: 'search_read',
                args: [domain, ['account_move']],
            });
            if (result) {
                return result[0].account_move[0];
            } else {
                return "";
            }
        },

        add_product: function (product, options) {
            if (this._printed && this.finalized) {
                this.destroy();
                return this.pos.get_order().add_product(product, options);
            }
            this.assert_editable();
            options = options || {};
            var line = new exports.Orderline({}, {pos: this.pos, order: this, product: product});
            this.fix_tax_included_price(line);

            if (options.quantity !== undefined) {
                line.set_quantity(options.quantity);
            }

            if (options.price !== undefined) {
                line.set_unit_price(options.price);
                this.fix_tax_included_price(line);
            }

            if (options.price_extra !== undefined) {
                line.price_extra = options.price_extra;
                line.set_unit_price(line.product.get_price(this.pricelist, line.get_quantity(), options.price_extra));
                this.fix_tax_included_price(line);
            }

            if (options.lst_price !== undefined) {
                line.set_lst_price(options.lst_price);
            }

            if (options.discount !== undefined) {
                line.set_discount(options.discount);
            }

            if (options.description !== undefined) {
                line.description += options.description;
            }

            if (options.extras !== undefined) {
                for (var prop in options.extras) {
                    line[prop] = options.extras[prop];
                }
            }
            if (options.is_tip) {
                this.is_tipped = true;
                this.tip_amount = options.price;
            }

            var to_merge_orderline;
            for (var i = 0; i < this.orderlines.length; i++) {
                if (this.orderlines.at(i).can_be_merged_with(line) && options.merge !== false) {
                    to_merge_orderline = this.orderlines.at(i);
                }
            }
            if (to_merge_orderline) {
                to_merge_orderline.merge(line);
                this.select_orderline(to_merge_orderline);
            } else {
                this.orderlines.add(line);
                this.select_orderline(this.get_last_orderline());
            }

            if (options.draftPackLotLines) {
                this.selected_orderline.setPackLotLines(options.draftPackLotLines);
            }
            if (this.pos.config.iface_customer_facing_display) {
                this.pos.send_current_order_to_customer_facing_display();
            }
        },


    });


    models.PosModel = models.PosModel.extend({


        push_and_invoice_order: function (order) {

            var self = this;
            var invoiced = new Promise(function (resolveInvoiced, rejectInvoiced) {
                if (!order.get_client()) {
                    rejectInvoiced({code: 400, message: 'Missing Customer', data: {}});
                } else {
                    var order_id = self.db.add_order(order.export_as_JSON());

                    self.flush_mutex.exec(function () {
                        var done = new Promise(function (resolveDone, rejectDone) {
                            // send the order to the server
                            // we have a 30 seconds timeout on this push.
                            // FIXME: if the server takes more than 30 seconds to accept the order,
                            // the client will believe it wasn't successfully sent, and very bad
                            // things will happen as a duplicate will be sent next time
                            // so we must make sure the server detects and ignores duplicated orders

                            var transfer = self._flush_orders([self.db.get_order(order_id)], {
                                timeout: 30000,
                                to_invoice: true
                            });

                            transfer.catch(function (error) {
                                rejectInvoiced(error);
                                rejectDone();
                            });

                            // on success, get the order id generated by the server
                            transfer.then(function (order_server_id) {
                                if (order_server_id.length) {
                                    resolveInvoiced(order_server_id);
                                    resolveDone();
                                } else {
                                    // The order has been pushed separately in batch when
                                    // the connection came back.
                                    // The user has to go to the backend to print the invoice
                                    rejectInvoiced({code: 401, message: 'Backend Invoice', data: {order: order}});
                                    rejectDone();
                                }
                            });
                            return done;
                        });
                    });
                }
            });

            return invoiced;
        },

    });


});
