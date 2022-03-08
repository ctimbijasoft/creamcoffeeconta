odoo.define('l10n_ec_point_of_sale.ClientListScreen', function (require) {
    'use strict';

    const ClientListScreen = require('point_of_sale.ClientListScreen');
    const Registries = require('point_of_sale.Registries');

    const L10nECPOSClientListScreen = ClientListScreen =>
        class extends ClientListScreen {

            get nextButton() {
                if (!this.props.client) {
                    return {command: 'set', text: 'Establecer Cliente'};
                } else if (this.props.client && this.props.client === this.state.selectedClient) {
                    return {command: 'deselect', text: 'Deseleccionar Cliente'};
                } else {
                    return {command: 'set', text: 'Cambiar Cliente'};
                }
            }
        };

    Registries.Component.extend(ClientListScreen, L10nECPOSClientListScreen);

    return ClientListScreen;
});
