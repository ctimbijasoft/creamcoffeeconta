odoo.define('l10n_ec_point_of_sale.multiprint', function (require) {
    "use strict";

    var models = require('point_of_sale.models');
    // var EpsonPrinter = require('pos_epson_printer.Printer');
    var EscPosEncoder = require('l10n_ec_point_of_sale.EscPosEncoder');
    var core = require('web.core');
    var QWeb = core.qweb;

// The override of create_printer needs to happen after its declaration in
// pos_restaurant. We need to make sure that this code is executed after the
// multiprint file in pos_restaurant.
    require('pos_restaurant.multiprint');

    models.load_fields("restaurant.printer", ["printer_url_service", "kitchen_printer"]);

    var _super_posmodel = models.PosModel.prototype;

    models.PosModel = models.PosModel.extend({
        create_printer: function (config) {
            if (config.printer_type === "printer_service") {
                return new EscPosEncoder(config.printer_url_service, posmodel);
            } else {
                return _super_posmodel.create_printer.apply(this, arguments);
            }
        },
    });

    models.Order = models.Order.extend({

        build_line_resume: function () {
            var resume = {};
            this.orderlines.each(function (line) {
                if (line.mp_skip) {
                    return;
                }
                var line_hash = line.get_line_diff_hash();
                var qty = Number(line.get_quantity());
                var note = line.get_note();
                var product_id = line.get_product().id;
                var disc = Number(line.get_discount());

                if (typeof resume[line_hash] === 'undefined') {
                    resume[line_hash] = {
                        disc: disc,
                        qty: qty,
                        note: note,
                        product_id: product_id,
                        product_name_wrapped: line.generate_wrapped_product_name(),
                    };
                } else {
                    resume[line_hash].qty += qty;
                }

            });
            return resume;
        },

        printChanges: async function () {
            var printers = this.pos.printers;
            let isPrintSuccessful = true;
            let printCounter = 0;

            var today = moment().format('D/MM/YYYY');
            var cashier = this.pos.attributes.cashier.name || this.pos.user;
            const currentOrder = this.pos.get_order();

            for (var i = 0; i < printers.length; i++) {
                var changes = this.computeChanges(printers[i].config.product_categories_ids);
                changes.date = today;
                changes.cashier = cashier;
                changes.customer_count = currentOrder.customer_count;

                if (changes['new'].length > 0 || changes['cancelled'].length > 0) {
                    var receipt = QWeb.render('OrderChangeReceipt', {changes: changes, widget: this});
                    if (printers[i].config.kitchen_printer) {
                        printCounter++;
                        const result = await printers[i].print_receipt(receipt, printers[i].config.name, 1);
                        if (!result.successful) {
                            isPrintSuccessful = false;
                        }
                    } else if (printCounter === 0 && i === printers.length - 1) {
                        const result = await printers[i].print_receipt(receipt, printers[i].config.name, 1);
                        if (!result.successful) {
                            isPrintSuccessful = false;
                        }
                    }
                }
            }
            console.log('FloorScreen affer pritn888989');
            if (isPrintSuccessful) {
                console.log('FloorScreen affer pritn');
                let name = 'FloorScreen';
                let props = {floor: null};
                this.trigger('show-main-screen', {name, props});
                //this.showScreen('FloorScreen', {floor: null});
            }

            return isPrintSuccessful;
        },

        saveChanges: function () {
            this.saved_resume = this.build_line_resume();
            this.orderlines.each(function (line) {
                line.set_dirty(false);
            });
            this.trigger('change', this);
        },
        computeChanges: function (categories) {

            var current_res = this.build_line_resume();
            var old_res = this.saved_resume || {};
            var json = this.export_as_JSON();
            var add = [];
            var rem = [];
            var line_hash;
            var categ_add = [];
            var categ_rem = [];

            for (line_hash in current_res) {
                var curr = current_res[line_hash];

                var old = {};
                var found = false;
                for (var id in old_res) {
                    if ((old_res[id].product_id === curr.product_id) && (old_res[id].note === curr.note) && (old_res[id].disc === curr.disc)) {
                        found = true;
                        old = old_res[id];
                        break;
                    }
                }

                if (!found) {
                    add.push({
                        'id': curr.product_id,
                        'name': this.pos.db.get_product_by_id(curr.product_id).display_name,
                        'name_wrapped': curr.product_name_wrapped,
                        'note': curr.note,
                        'qty': curr.qty,
                        'pos_categ': this.pos.db.get_product_by_id(curr.product_id).pos_categ_id[1],
                        'pos_categ_id': this.pos.db.get_product_by_id(curr.product_id).pos_categ_id[0],
                    });
                } else if (old.qty < curr.qty) {
                    add.push({
                        'id': curr.product_id,
                        'name': this.pos.db.get_product_by_id(curr.product_id).display_name,
                        'name_wrapped': curr.product_name_wrapped,
                        'note': curr.note,
                        'qty': curr.qty - old.qty,
                        'pos_categ': this.pos.db.get_product_by_id(curr.product_id).pos_categ_id[1],
                        'pos_categ_id': this.pos.db.get_product_by_id(curr.product_id).pos_categ_id[0],
                    });
                } else if (old.qty > curr.qty) {
                    rem.push({
                        'id': curr.product_id,
                        'name': this.pos.db.get_product_by_id(curr.product_id).display_name,
                        'name_wrapped': curr.product_name_wrapped,
                        'note': curr.note,
                        'qty': old.qty - curr.qty,
                        'pos_categ': this.pos.db.get_product_by_id(curr.product_id).pos_categ_id[1],
                        'pos_categ_id': this.pos.db.get_product_by_id(curr.product_id).pos_categ_id[0],
                    });
                }
            }

            for (line_hash in old_res) {
                found = false;
                for (id in current_res) {
                    if ((current_res[id].product_id === old_res[line_hash].product_id) && (current_res[id].note === old_res[line_hash].note) && (current_res[id].disc === old_res[line_hash].disc))
                        found = true;
                }
                if (!found) {
                    old = old_res[line_hash];
                    console.log("********", this.pos.db.get_product_by_id(old.product_id).pos_categ_id);
                    rem.push({
                        'id': old.product_id,
                        'name': this.pos.db.get_product_by_id(old.product_id).display_name,
                        'name_wrapped': old.product_name_wrapped,
                        'note': old.note,
                        'qty': old.qty,
                        'pos_categ': this.pos.db.get_product_by_id(old.product_id).pos_categ_id[1],
                        'pos_categ_id': this.pos.db.get_product_by_id(old.product_id).pos_categ_id[0],
                    });
                }
            }

            if (categories && categories.length > 0) {
                // filter the added and removed orders to only contains
                // products that belong to one of the categories supplied as a parameter

                var self = this;

                var _add = [];
                var _rem = [];
                var i = 0;

                for (i = 0; i < add.length; i++) {
                    if (self.pos.db.is_product_in_category(categories, add[i].id)) {
                        _add.push(add[i]);
                    }
                }
                add = _add;

                for (i = 0; i < rem.length; i++) {
                    if (self.pos.db.is_product_in_category(categories, rem[i].id)) {
                        _rem.push(rem[i]);
                    }
                }
                rem = _rem;
            }

            var d = new Date();
            var hours = '' + d.getHours();
            hours = hours.length < 2 ? ('0' + hours) : hours;
            var minutes = '' + d.getMinutes();
            minutes = minutes.length < 2 ? ('0' + minutes) : minutes;

            var db = this.pos.db;

            add.forEach(function (product, index) {
                var highlight = db.get_category_by_id(product['pos_categ_id'])['highlight'];
                var category = {name: product['pos_categ'], id: product['pos_categ_id'], highlight: highlight};
                var exist = false;
                for (i = 0; i < categ_add.length; i++) {
                    if (category.id === categ_add[i].id) {
                        exist = true;
                    }
                }
                if (!exist) {
                    categ_add.push(category);
                }
            });

            rem.forEach(function (product, index) {
                var highlight = db.get_category_by_id(product['pos_categ_id'])['highlight'];
                var category = {name: product['pos_categ'], id: product['pos_categ_id'], highlight: highlight};
                var exist = false;
                for (i = 0; i < categ_rem.length; i++) {
                    if (category.id === categ_rem[i].id) {
                        exist = true;
                    }
                }
                if (!exist) {
                    categ_rem.push(category);
                }
            });

            return {
                'new': add,
                'cancelled': rem,
                'table': json.table || false,
                'floor': json.floor || false,
                'name': (json.name.split(" ")[0] + " " + json.name.slice(json.name.length - 4)) || 'unknown order',
                'time': {
                    'hours': hours,
                    'minutes': minutes,
                },
                'new_categ': categ_add,
                'cancelled_categ': categ_rem,
            };

        },


    });
});
