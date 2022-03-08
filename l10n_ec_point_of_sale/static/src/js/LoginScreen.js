odoo.define('l10n_ec_point_of_sale.LoginScreen', function (require) {
    'use strict';

    const LoginScreen = require('pos_hr.LoginScreen');
    const Registries = require('point_of_sale.Registries');



    const L10nECPOSLoginScreen = LoginScreen =>
        class extends LoginScreen {
            static pageHRClose = true;
            constructor() {
                super(...arguments);
            }

            closeSession() {
                LoginScreen.pageHRClose = true;
                this.trigger('close-pos');
                LoginScreen.pageHRClose = false;
            }

        }

    Registries.Component.extend(LoginScreen, L10nECPOSLoginScreen);

    return LoginScreen;
});
