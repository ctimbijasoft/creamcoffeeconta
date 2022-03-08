odoo.define('l10n_ec_point_of_sale.chrome', function (require) {
    'use strict';

    const {useState, useRef} = owl.hooks;
    const Chrome = require('point_of_sale.Chrome');
    const Registries = require('point_of_sale.Registries');
    var session = require('web.session');
    const {useListener} = require('web.custom_hooks');
    var rpc = require('web.rpc');
    var framework = require('web.framework');
    const LoginScreen = require('pos_hr.LoginScreen');

    const ChromeInherit = (Chrome) =>
        class extends Chrome {
            constructor() {
                super(...arguments);
            }

            _setIdleTimer() {
                if (this._shouldResetIdleTimer()) {
                    clearTimeout(this.idleTimer);
                    this.idleTimer = setTimeout(() => {
                        this._actionAfterIdle();
                    }, 30000);
                }
            }
        }
    Registries.Component.extend(Chrome, ChromeInherit);

    return Chrome;
});
