odoo.define('l10n_ec_point_of_sale.SplitBillScreen', function (require) {
    'use strict';

    const SplitBillScreen = require('pos_restaurant.SplitBillScreen');
    const Registries = require('point_of_sale.Registries');

    const L10nSplitBillScreen = SplitBillScreen =>
        class extends SplitBillScreen {


            proceed() {
                if (_.isEmpty(this.splitlines))
                    // Splitlines is empty
                    return;

                this._isFinal = true;
                delete this.newOrder.temporary;

                if (this._isFullPayOrder()) {
                    this.showScreen('PaymentScreen');
                } else {
                    this._setQuantityOnCurrentOrder();

                    this.newOrder.set_screen_data({name: 'PaymentScreen'});

                    // for the kitchen printer we assume that everything
                    // has already been sent to the kitchen before splitting
                    // the bill. So we save all changes both for the old
                    // order and for the new one. This is not entirely correct
                    // but avoids flooding the kitchen with unnecessary orders.
                    // Not sure what to do in this case.

                    if (this.newOrder.saveChanges) {
                        this.currentOrder.saveChanges();
                        this.newOrder.saveChanges();
                    }

                    this.newOrder.set_customer_count(1);
                    const newCustomerCount = this.currentOrder.get_customer_count() - 1;
                    this.currentOrder.set_customer_count(newCustomerCount || 1);
                    this.currentOrder.set_screen_data({name: 'ProductScreen'});

                    this.env.pos.get('orders').add(this.newOrder);
                    this.env.pos.set('selectedOrder', this.newOrder);

                    // Se envia a pantalla de mesas en vez de la de pago ya que deberia
                    // actualizarse las ordenes con las que estan guardadas en la base
                    // de datos asi se evita problemas que se duplican pedidos
                    const table = this.env.pos.table;
                    this.showScreen('FloorScreen', {floor: table ? table.floor : null});
                }
            }

        };

    Registries.Component.extend(SplitBillScreen, L10nSplitBillScreen);

    return SplitBillScreen;

});