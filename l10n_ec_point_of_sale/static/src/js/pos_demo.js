odoo.define('pos_demo.custom', function (require) {
    "use strict";

    const PosComponent = require('point_of_sale.PosComponent');
    const ProductScreen = require('point_of_sale.ProductScreen');
    const Registries = require('point_of_sale.Registries');

    const PrinterService = require('l10n_ec_point_of_sale.PrinterService');
    const print = new PrinterService(this);

    let EscPosEncoder = require('l10n_ec_point_of_sale.EscPosEncoder');
    let encoder = new EscPosEncoder();

    class PosDiscountButton extends PosComponent {
        async onClick() {
            const order = this.env.pos.get_order();
            if (order.selected_orderline) {
                order.selected_orderline.set_discount(5);
            }

            /*self = this;
            print.connect(self);
            print.text('hola');
            print.feed(2);
            print.text('Cuenca');
            print.print();*/

            // encoder
            //     .initialize(this)
            //     .codepage(CharacterCodeTable.ISO8859_15_Latin9)
            //     .text('The quick brown fox jumps over the lazy dog')
            //     .newline()
            //     .size(FontSize._2)
            //     .align(Justification.Left_Default)
            //     .line('This line is aligned to the right')
            //     .size(FontSize._1)
            //     .align(Justification.Center)
            //     .bold()
            //     .line('This line is centered')
            //     .bold()
            //     .font(FontName.Font_C)
            //     .align(Justification.Right)
            //     .line('This line is aligned to the left')
            //     .feed(3);
            //
            // let result = encoder
            //     .resetStyle()
            //     .line('linea en alineación normal y con letra normal')
            //     .cut()
            //     .openCashBox()
            //     .encode()
            //
            // console.log(result);
        }
    }

    PosDiscountButton.template = 'PosDiscountButton';
    ProductScreen.addControlButton({
        component: PosDiscountButton,
        condition: function () {
            return true;
        },
    });
    Registries.Component.add(PosDiscountButton);
    return PosDiscountButton;
});
