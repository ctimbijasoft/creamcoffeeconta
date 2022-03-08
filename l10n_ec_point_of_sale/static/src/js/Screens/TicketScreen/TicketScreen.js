odoo.define('l10n_ec_point_of_sale.TicketScreen', function (require) {
    'use strict';

    const TicketScreen = require('point_of_sale.TicketScreen');
    const Registries = require('point_of_sale.Registries');

    const L10nECTicketScreen = TicketScreen =>
        class extends TicketScreen {

            constructor() {
                super(...arguments);
                console.log('TicketScreen');
                this.isSessionActive();
            }

            isSessionActive(){
                console.log('this.env.pos');
                console.log(this.env.pos);
                if (this.env.pos.config.enable_close_session && this.env.pos.config.cash_control && this.env.pos.pos_session.state == 'opening_control') {
                    if(this.env.isMobile){
                        alert("No existe una sesión activa, consulte con cajero.");
                        window.location.reload(false);
                    }
                    else
                        return true;
                }
                return true;
            }

            getName(order) {
                return (order.name.split(" ")[0] + " " + order.name.slice(order.name.length - 4));
            }

        };

    Registries.Component.extend(TicketScreen, L10nECTicketScreen);

    return TicketScreen;

});