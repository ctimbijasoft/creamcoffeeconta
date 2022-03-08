odoo.define('l10n_ec_point_of_sale.PaymentScreen', function (require) {
    'use strict';

    const PaymentScreen = require('point_of_sale.PaymentScreen');
    const Registries = require('point_of_sale.Registries');

    var pos_models = require('point_of_sale.models');

    var models = pos_models.PosModel.prototype.models;

    for(var i=0; i<models.length; i++){
        var model=models[i];
            if(model.model === 'product.product'){
                model.fields.push('to_make_mrp');
            }
        }

    const L10nECPOSPaymentScreen = PaymentScreen =>
        class extends PaymentScreen {
            constructor() {
                super(...arguments);
                this.currentOrder.set_to_invoice(this.env.pos.config.is_to_invoice);

                this._currentOrder = this.env.pos.get_order();

                let partners = this.env.pos.partners;
                let selectedPartnerID = this.env.pos.config.partner_id[0];
                let newPartner = {};

                if (this.currentOrder.get_client() === null) {
                    for (let i = 0; i < partners.length; i++) {
                        if (partners[i].id === selectedPartnerID) {
                            newPartner = partners[i];
                            break;
                        }
                    }
                    this.currentOrder.set_client(newPartner);
                }
            }

            toggleIsToInvoice() {
                // click_invoice
                // this.currentOrder.set_to_invoice(!this.currentOrder.is_to_invoice());
                // this.render();
            }

            async addNewPaymentLine({detail: paymentMethod}) {
                // const order = ;
                if (!paymentMethod.is_cash_count) {
                    const {confirmed, payload: inputVoucher} = await this.showPopup('TextAreaPopup', {
                        startingValue: "",
                        title: this.env._t('Agregar Váucher'),
                    });
                    if (confirmed) {
                        this.env.pos.get_order().set_pos_voucher_ref(inputVoucher);
                    }
                } else {
                    this.env.pos.get_order().set_pos_voucher_ref("");
                }


                super.addNewPaymentLine({detail: paymentMethod});
            }

            async _generate_mrp() {
                console.log("validation_order")
                const order = this.env.pos.get_order();
                var order_line = order.orderlines.models;
                var due = order.get_due();
                console.log(order_line);
                for (var i in order_line) {
                    console.log(i)
                    var list_product = []
                    console.log("order_line[i].product.to_make_mrp", order_line[i].product)
                    console.log('to_make_mrp ' + order_line[i].product.to_make_mrp);
                    console.log(this.env.pos.config)
                    console.log(this.env.pos.config.mrp_picking_type_id[0])
                    if (order_line[i].product.to_make_mrp) {
                        console.log('to_make_mrp');
                        if (order_line[i].quantity > 0) {
                            var product_dict = {
                                'id': order_line[i].product.id,
                                'qty': order_line[i].quantity,
                                'product_tmpl_id': order_line[i].product.product_tmpl_id,
                                'pos_reference': order.name,
                                'uom_id': order_line[i].product.uom_id[0],
                                'mrp_picking_type_id': this.env.pos.config.mrp_picking_type_id[0]
                            };
                            list_product.push(product_dict);
                        }
                    }
                    console.log('to_make_mrp ' + order_line[i].product.id);

                    if (list_product.length) {
                        const result = await this.rpc({
                            model: 'mrp.production',
                            method: 'create_mrp_from_pos',
                            args: [1, list_product],
                        });
                        //return result;
                        /*rpc.query({
                            model: 'mrp.production',
                            method: 'create_mrp_from_pos',
                            args: [1, list_product],
                        });*/
                    }else{
                        //return false;
                    }
                }

            }

            async _finalizeValidation() {

                console.log(this.env.pos.config.module_pos_restaurant);
                if (this.currentOrder.hasChangesToPrint() && this.env.pos.config.module_pos_restaurant == true ) {
                    await this.showPopup('ErrorPopup', {
                        title: 'Error',
                        body: 'Todavia existen pedidos sin ser enviados a cocina.',
                    });
                    return false;
                }

                if (this.currentOrder.is_electronic_payment === true && !this.currentOrder.pos_voucher_ref) {
                    await this.showPopup('ErrorPopup', {
                        title: 'Error',
                        body: 'Ingrese un numero de váucher en pago electronico.',
                    });
                    return false;
                }

                // if ((this.currentOrder.is_paid_with_cash() && this.currentOrder.get_change() > 0)) {
                if(this.env.pos.config.open_cashbox_auto){
                    try{
                        this.env.pos.printers[0].open_cashbox();
                    } catch (error) {
                      console.error(error);
                    }
                    try{
                        this.env.pos.proxy.printer.open_cashbox();
                    } catch (error) {
                      console.error(error);
                    }
                }

                // }

                /*if ((this.currentOrder.is_paid_with_cash() || this.currentOrder.get_change()) && this.env.pos.config.iface_cashdrawer) {
                    this.env.pos.proxy.printer.open_cashbox();
                }*/

                this.currentOrder.initialize_validation_date();
                this.currentOrder.finalized = true;

                let syncedOrderBackendIds = [];

                try {
                    if (this.currentOrder.is_to_invoice()) {
                        syncedOrderBackendIds = await this.env.pos.push_and_invoice_order(
                            this.currentOrder
                        );
                    } else {
                        syncedOrderBackendIds = await this.env.pos.push_single_order(this.currentOrder);
                    }
                    await this._generate_mrp();
                } catch (error) {
                    if (error instanceof Error) {
                        throw error;
                    } else {
                        await this._handlePushOrderError(error);
                    }
                }
                if (syncedOrderBackendIds.length && this.currentOrder.wait_for_push_order()) {
                    const result = await this._postPushOrderResolve(
                        this.currentOrder,
                        syncedOrderBackendIds
                    );
                    if (!result) {
                        await this.showPopup('ErrorPopup', {
                            title: 'Error: no internet connection.',
                            body: error,
                        });
                    }
                }
                var account_move = await this.currentOrder.get_account_move(this.currentOrder.name);
                this.currentOrder.set_is_invoice(true);
                if(this.env.pos.config.module_account) {
                    var clave = await this.currentOrder.get_clave_acceso(account_move);
                    var num_invoice = await this.currentOrder.get_num_invoice(account_move);
                    this.currentOrder.set_access_key(clave);
                    this.currentOrder.set_num_invoice(num_invoice);
                }else{

                }

                this.showScreen(this.nextScreen, {order: this.currentOrder});

                //this.currentOrder.set_is_invoice(false);

                // If we succeeded in syncing the current order, and
                // there are still other orders that are left unsynced,
                // we ask the user if he is willing to wait and sync them.
                if (syncedOrderBackendIds.length && this.env.pos.db.get_orders().length) {
                    const {confirmed} = await this.showPopup('ConfirmPopup', {
                        title: this.env._t('Remaining unsynced orders'),
                        body: this.env._t(
                            'There are unsynced orders. Do you want to sync these orders?'
                        ),
                    });
                    if (confirmed) {
                        // NOTE: Not yet sure if this should be awaited or not.
                        // If awaited, some operations like changing screen
                        // might not work.
                        this.env.pos.push_orders();
                    }
                }
            }
        };

    Registries.Component.extend(PaymentScreen, L10nECPOSPaymentScreen);

    return PaymentScreen;
});
