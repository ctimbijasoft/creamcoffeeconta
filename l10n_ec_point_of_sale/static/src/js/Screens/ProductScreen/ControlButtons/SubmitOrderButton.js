odoo.define('l10n_ec_point_of_sale.SubmitOrderButton', function(require) {
    'use strict';

    const SubmitOrderButton = require('pos_restaurant.SubmitOrderButton');
    const Registries = require('point_of_sale.Registries');

    const L10nECPOSSubmitOrderButton = SubmitOrderButton =>
        class extends SubmitOrderButton {
            constructor() {
                console.log("cuencanos")
                super(...arguments);
            }

            async onClick() {
                    console.log('onClick');
                const order = this.env.pos.get_order();
                if (order.hasChangesToPrint()) {
                    const isPrintSuccessful = await order.printChanges();
                    if (isPrintSuccessful) {
                        order.saveChanges();
                        console.log('onClick-onClick' + this.env.isMobile);
                        if(this.env.isMobile) {
                            this.showScreen('FloorScreen', {floor: null});
                        }
                    } else {
                        await this.showPopup('ErrorPopup', {
                            title: 'Printing failed',
                            body: 'Failed in printing the changes in the order',
                        });
                    }
                }
            }
        }
    /*SubmitOrderButton.template = 'SubmitOrderButton';

    ProductScreen.addControlButton({
        component: SubmitOrderButton,
        condition: function() {
            return this.env.pos.printers.length;
        },
    });*/

    Registries.Component.extend(SubmitOrderButton, L10nECPOSSubmitOrderButton);

    return SubmitOrderButton;
});
