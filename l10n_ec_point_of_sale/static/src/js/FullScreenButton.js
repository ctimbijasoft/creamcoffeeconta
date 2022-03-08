odoo.define('l10n_ec_point_of_sale.FullScreenButton', function (require) {
    "use strict";


    const PosComponent = require('point_of_sale.PosComponent');
    const Registries = require('point_of_sale.Registries');


    class FullScreenButton extends PosComponent {
        constructor() {
            super(...arguments);
        }

        onClick() {

            if (document.fullscreenElement === null) {
                this.openFullscreen();
            } else {
                this.closeFullscreen();
            }

        }

        closeFullscreen() {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) { /* Safari */
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) { /* IE11 */
                document.msExitFullscreen();
            }
        }

        openFullscreen() {
            var elem = document.documentElement;
            if (elem.requestFullscreen) {
                elem.requestFullscreen();
            } else if (elem.webkitRequestFullscreen) { /* Safari */
                elem.webkitRequestFullscreen();
            } else if (elem.msRequestFullscreen) { /* IE11 */
                elem.msRequestFullscreen();
            }
        }
    }

    FullScreenButton.template = 'FullScreenButton';


    Registries.Component.add(FullScreenButton);
    return FullScreenButton;
});
