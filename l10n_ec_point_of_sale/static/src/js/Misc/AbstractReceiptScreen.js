odoo.define('l10n_ec_point_of_sale.AbstractReceiptScreen', function (require) {
    'use strict';

    const AbstractReceiptScreen = require('point_of_sale.AbstractReceiptScreen');
    const Registries = require('point_of_sale.Registries');

    const L10nECPOSAbstractReceiptScreen = AbstractReceiptScreen =>
        class extends AbstractReceiptScreen {

            async _printReceipt() {
                if (this.env.pos.proxy.printer) {
                    const printResult = await this.env.pos.proxy.printer.print_receipt(this.orderReceipt.el.outerHTML);
                    if (printResult.successful) {
                        return true;
                    } else {
                        const {confirmed} = await this.showPopup('ConfirmPopup', {
                            title: printResult.message.title,
                            body: 'Do you want to print using the web printer?',
                        });
                        if (confirmed) {
                            // We want to call the _printWeb when the popup is fully gone
                            // from the screen which happens after the next animation frame.
                            await nextFrame();
                            return await this._printWeb();
                        }
                        return false;
                    }
                } else if (this.env.pos.printers) { // try websocket print
                    var printers = this.env.pos.printers;
                    console.log(printers)
                    // const printResult = await this.env.pos.proxy.printer.print_receipt(this.orderReceipt.el.outerHTML);
                    let printCounter = 0;
                    for (let i = 0; i < printers.length; i++) {
                        if (!printers[i].config.kitchen_printer) {
                            printCounter++;
                            const printResult = await printers[i].print_receipt(this.orderReceipt.el.outerHTML, printers[i].config.name);
                            if (printResult.successful) {
                                return true;
                            } else {
                                const {confirmed} = await this.showPopup('ConfirmPopup', {
                                    title: printResult.message.title,
                                    body: 'Do you want to print using the web printer?',
                                });
                                if (confirmed) {
                                    // We want to call the _printWeb when the popup is fully gone
                                    // from the screen which happens after the next animation frame.
                                    await nextFrame();
                                    return await this._printWeb();
                                }
                                return false;
                            }
                        } else if (printCounter === 0 && i === printers.length - 1) {
                            const printResult = await printers[i].print_receipt(this.orderReceipt.el.outerHTML, printers[i].config.name);
                            if (printResult.successful) {
                                return true;
                            }
                            return false;
                        }
                    }
                } else {
                    return await this._printWeb();
                }

            }


        };

    Registries.Component.extend(AbstractReceiptScreen, L10nECPOSAbstractReceiptScreen);

    return AbstractReceiptScreen;


});