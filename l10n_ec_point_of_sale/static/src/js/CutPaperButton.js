odoo.define('l10n_ec_point_of_sale.CutPaperButton', function (require) {
    "use strict";


    const PosComponent = require('point_of_sale.PosComponent');
    const Registries = require('point_of_sale.Registries');


    class CutPaperButton extends PosComponent {

        constructor() {
            super(...arguments);
        }

        onClick() {
            this.env.pos.printers[0].cut_paper();
        }


    }

    CutPaperButton.template = 'CutPaperButton';


    Registries.Component.add(CutPaperButton);
    return CutPaperButton;
});
