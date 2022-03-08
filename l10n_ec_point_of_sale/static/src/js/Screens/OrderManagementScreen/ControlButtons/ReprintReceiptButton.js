odoo.define('l10n_ec_point_of_sale.ReprintReceiptButton', function (require) {
    'use strict';

    const ReprintReceiptButton = require('point_of_sale.ReprintReceiptButton');
    const Registries = require('point_of_sale.Registries');

    const L10nECPOSReprintReceiptButton = ReprintReceiptButton =>
        class extends ReprintReceiptButton {
            constructor() {
                super(...arguments);
            }

            async _onClick() {
                const order = this.orderManagementContext.selectedOrder;
                if (!order) return;
                var clave = ''
                var num_invoice = ''
                if(this.env.pos.config.module_account){
                    clave = await order.get_clave_acceso(order.account_move);
                    order.set_access_key(clave);
                    num_invoice = await order.get_num_invoice(order.account_move);
                    order.set_num_invoice(num_invoice);
                }

                if (this.env.pos.proxy.printer) {
                    const fixture = document.createElement('div');
                    const orderReceipt = new (Registries.Component.get(OrderReceipt))(this, {order});
                    await orderReceipt.mount(fixture);
                    const receiptHtml = orderReceipt.el.outerHTML;
                    const printResult = await this.env.pos.proxy.printer.print_receipt(receiptHtml);
                    if (!printResult.successful) {
                        this.showTempScreen('ReprintReceiptScreen', {order: order});
                    }
                } else {
                    this.showTempScreen('ReprintReceiptScreen', {order: order});
                }
            }

        };

    Registries.Component.extend(ReprintReceiptButton, L10nECPOSReprintReceiptButton);

    return ReprintReceiptButton;
});
