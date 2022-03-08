odoo.define('l10n_ec_point_of_sale.NotificationButton', function (require) {
    "use strict";


    const PosComponent = require('point_of_sale.PosComponent');
    const Registries = require('point_of_sale.Registries');


    class NotificationButton extends PosComponent {
        notification = false;

        constructor() {
            super();
        }

        get getNotification() {
            return this.notification;
        }

        toggleNotifications() {
            this.notification = !this.notification;
            this.render();
        }

    }

    NotificationButton.template = 'NotificationButton';


    Registries.Component.add(NotificationButton);
    return NotificationButton;
});
