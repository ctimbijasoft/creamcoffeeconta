odoo.define('l10n_ec_point_of_sale.ReceiptScreen', function (require) {
    'use strict';

    const ReceiptScreen = require('point_of_sale.ReceiptScreen');
    const Registries = require('point_of_sale.Registries');

    const L10nECPOSReceiptScreen = ReceiptScreen =>
        class extends ReceiptScreen {



        };

    Registries.Component.extend(ReceiptScreen, L10nECPOSReceiptScreen);

    return ReceiptScreen;

});