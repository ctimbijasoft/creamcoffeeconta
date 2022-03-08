odoo.define('l10n_ec_point_of_sale.Draggable', function (require) {
    'use strict';

    const Draggable = require('point_of_sale.Draggable');
    const Registries = require('point_of_sale.Registries');

    const L10nECPOSDraggable = Draggable =>
        class extends Draggable {

            constructor() {
                super(...arguments);
            }

            mounted() {
                super.mounted()
                if(this.env.isMobile){
                    this.el.style.left = '12px';
                }
            }
        };

    Registries.Component.extend(Draggable, L10nECPOSDraggable);

    return Draggable;
});

