/**
 * Values for CodePage.
 */
const CharacterCodeTable = {
    CP437_USA_Standard_Europe: 'CP437_USA_Standard_Europe',
    Katakana: 'Katakana',
    CP850_Multilingual: 'CP850_Multilingual',
    CP860_Portuguese: 'CP860_Portuguese',
    CP863_Canadian_French: 'CP863_Canadian_French',
    CP865_Nordic: 'CP865_Nordic',
    CP851_Greek: 'CP851_Greek',
    CP853_Turkish: 'CP853_Turkish',
    CP857_Turkish: 'CP857_Turkish',
    CP737_Greek: 'CP737_Greek',
    ISO8859_7_Greek: 'ISO8859_7_Greek',
    WPC1252: 'WPC1252',
    CP866_Cyrillic_2: 'CP866_Cyrillic_2',
    CP852_Latin2: 'CP852_Latin2',
    CP858_Euro: 'CP858_Euro',
    KU42_Thai: 'KU42_Thai',
    TIS11_Thai: 'TIS11_Thai',
    TIS18_Thai: 'TIS18_Thai',
    TCVN_3_1_Vietnamese: 'TCVN_3_1_Vietnamese',
    TCVN_3_2_Vietnamese: 'TCVN_3_2_Vietnamese',
    PC720_Arabic: 'PC720_Arabic',
    WPC775_BalticRim: 'WPC775_BalticRim',
    CP855_Cyrillic: 'CP855_Cyrillic',
    CP861_Icelandic: 'CP861_Icelandic',
    CP862_Hebrew: 'CP862_Hebrew',
    CP864_Arabic: 'CP864_Arabic',
    CP869_Greek: 'CP869_Greek',
    ISO8859_2_Latin2: 'ISO8859_2_Latin2',
    ISO8859_15_Latin9: 'ISO8859_15_Latin9',
    CP1098_Farsi: 'CP1098_Farsi',
    CP1118_Lithuanian: 'CP1118_Lithuanian',
    CP1119_Lithuanian: 'CP1119_Lithuanian',
    CP1125_Ukrainian: 'CP1125_Ukrainian',
    WCP1250_Latin2: 'WCP1250_Latin2',
    WCP1251_Cyrillic: 'WCP1251_Cyrillic',
    WCP1253_Greek: 'WCP1253_Greek',
    WCP1254_Turkish: 'WCP1254_Turkish',
    WCP1255_Hebrew: 'WCP1255_Hebrew',
    WCP1256_Arabic: 'WCP1256_Arabic',
    WCP1257_BalticRim: 'WCP1257_BalticRim',
    WCP1258_Vietnamese: 'WCP1258_Vietnamese',
    KZ_1048_Kazakhstan: 'KZ_1048_Kazakhstan',
    User_defined_page: 'User_defined_page'
}


/**
 * Values for CutMode.
 */
const CutMode = {
    FULL: 'FULL',
    PART: 'PART',
}

/**
 * Values of font name.
 */
const FontName = {
    Font_A_Default: 'Font_A_Default',
    Font_B: 'Font_B',
    Font_C: 'Font_C'
};

/**
 * Values of font size.
 */
const FontSize = {
    _1: '_1',
    _2: '_2',
    _3: '_3',
    _4: '_4',
    _5: '_5',
    _6: '_6',
    _7: '_7',
    _8: '_8'
};

/**
 * values of underline style.
 *
 * @see #setUnderline(Underline)
 */
const Underline = {
    None_Default: 'None_Default',
    OneDotThick: 'OneDotThick',
    TwoDotThick: 'TwoDotThick'
};

/**
 * values of color mode background / foreground reverse.
 */
const ColorMode = {
    BlackOnWhite_Default: 'BlackOnWhite_Default',
    WhiteOnBlack: 'WhiteOnBlack'
};

/**
 * Values for print justification.
 */
const Justification = {
    Left_Default: 'Left_Default',
    Center: 'Center',
    Right: 'Right'
};

odoo.define('l10n_ec_point_of_sale.EscPosEncoder', function (require) {
    'use strict';

    const StateSocket = {
        CONNECTING: 0,
        OPEN: 1,
        CLOSING: 2,
        CLOSED: 3
    };

    var PrinterMixin = require('point_of_sale.Printer').PrinterMixin;

    var Class = require('web.Class');

    var EscPosEncoder = Class.extend(PrinterMixin, {
        socket: null,
        retriesSocketConnections: 0,
        gui: null,
        URL_SERVICE: "ws://localhost:8787/jasoft/printer",

        /**
         * Create a new object
         *
         */
        init(ws, pos) {
            PrinterMixin.init.call(this, arguments);
            this.URL_SERVICE = ws;
            this.pos = pos;
            this._reset();
        },
        connect() {
            if (this.socket == null)
                this.socket = new WebSocket(this.URL_SERVICE);
            else if (this.socket.readyState == StateSocket.CLOSED)
                this.socket = new WebSocket(this.URL_SERVICE);
            else
                return;

            this.retriesSocketConnections++;

            this.socket.onopen = function (e) {
                console.log("[open] Connection established");
                this.retriesSocketConnections = 0;
            };

            this.socket.onmessage = function (event) {
                let data = JSON.parse(event.data)
                console.log("[message] Data received from server:", data);
            };

            this.socket.onclose = function (event) {
                if (event.wasClean) {
                    console.log(`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
                } else {
                    console.log('[close] Connection died', event);
                }
            };

            this.socket.onerror = function (error) {
                console.log(`[error] ${error.message}`);
            };
        },

        /**
         * Reset the state of the object
         *
         */
        _reset() {
            this._buffer = [];
            this._codepage = 'ascii';

            this._state = {
                'bold': false,
                'italic': false,
                'underline': false,
                'hanzi': false,
            };
        },

        /**
         * Encode a string with the current code page
         *
         * @param  {string}   value  String to encode
         * @return {object}          Encoded string as a ArrayBuffer
         *
         */
        _encode(value) {
            return this.encode(value, this._codepage);
        },


        /**
         * Add commands to the buffer
         *
         * @param  {array}   value  And array of numbers, arrays, buffers or Uint8Arrays to add to the buffer
         *
         */
        _queue(value) {
            value.forEach((item) => this._buffer.push(item));
        },

        /**
         * Initialize the printer
         *
         * @return {object}          Return the object, for easy chaining commands
         *
         */
        initialize(gui) {
            this.gui = gui;
            this.connect();
            this._queue([
                {'initialize': {}}
            ]);

            return this;
        },

        /**
         * Change the code page
         *
         * @param  {string}   value  The codepage that we set the printer to
         * @return {object}          Return the object, for easy chaining commands
         *
         */
        codepage(value) {
            const codepages = CharacterCodeTable

            let codepage = value;

            if (typeof codepages[codepage] !== 'undefined') {
                this._codepage = codepage;

                this._queue([
                    {'codepage': codepage},
                ]);
            } else {
                throw new Error('Codepage not supported by printer');
            }

            return this;
        },

        /**
         * Print text
         *
         * @param  {string}   value  Text that needs to be printed
         * @param  {number}   wrap   Wrap text after this many positions
         * @return {object}          Return the object, for easy chaining commands
         *
         */
        text(value, wrap) {
            if (wrap) {

            }

            this._queue([
                {'text': {value: value, wrap}}
            ]);

            return this;
        },

        /**
         * Print a newline
         *
         * @return {object}          Return the object, for easy chaining commands
         *
         */
        newline() {
            this._queue([
                {'newLine': {}}
            ]);

            return this;
        },

        /**
         * Print text, followed by a newline
         *
         * @param  {string}   value  Text that needs to be printed
         * @param  {number}   wrap   Wrap text after this many positions
         * @return {object}          Return the object, for easy chaining commands
         *
         */
        line(value, wrap) {
            if (wrap) {

            }

            this._queue([
                {'line': {value: value, wrap}}
            ]);
            return this;
        },

        /**
         * Underline text
         *
         * @param  {boolean|number}   value  true to turn on underline, false to turn off, or 2 for double underline
         * @return {object}                  Return the object, for easy chaining commands
         *
         */
        underline(value) {
            if (typeof value === 'undefined') {
                value = !this._state.underline;
            }

            this._state.underline = value;
            this._queue([
                {'undeline': value},
            ]);

            return this;
        },

        /**
         * Italic text
         *
         * @param  {boolean}          value  true to turn on italic, false to turn off
         * @return {object}                  Return the object, for easy chaining commands
         *
         */
        italic(value) {
            if (typeof value === 'undefined') {
                value = !this._state.italic;
            }

            this._state.italic = value;

            this._queue([
                {'italic': value},
            ]);

            return this;
        },

        /**
         * Bold text
         *
         * @param  {boolean}          value  true to turn on bold, false to turn off, or 2 for double underline
         * @return {object}                  Return the object, for easy chaining commands
         *
         */
        bold(value) {
            if (typeof value === 'undefined') {
                value = !this._state.bold;
            }
            this._state.bold = value;
            this._queue([
                {'bold': value},
            ]);
            return this;
        },

        /**
         * Change text size
         *
         * @return {object}                  Return the object, for easy chaining commands
         *
         * @param fontWidth
         * @param fontHeight
         */
        size(fontWidth, fontHeight) {

            if (fontHeight === undefined)
                fontHeight = fontWidth

            this._queue([
                {'size': {fontWidth, fontHeight}},
            ]);

            return this;
        },

        font(fontName) {
            this._queue([
                {'font': fontName},
            ]);

            return this;
        },
        /**
         * Saltos de línea
         *
         * @param value                 Numero de lineas
         * @returns {EscPosEncoder}     Return the object, for easy chaining commands
         */
        feed(value) {
            this._queue([
                {'feed': value},
            ]);

            return this;
        },

        /**
         * Apertura de caja de dinero
         *
         * @returns {EscPosEncoder}     Return the object, for easy chaining commands
         */
        openCashBox() {
            this._queue([
                {'openCashBox': true},
            ]);
            return this;
        },

        /**
         * Reinicia el estilo por defecto
         * @returns {EscPosEncoder}
         */
        resetStyle() {
            this._queue([
                {'resetStyle': true},
            ]);
            return this;
        },

        /**
         * Change text alignment
         *
         * @param  {string}          value   left, center or right
         * @return {object}                  Return the object, for easy chaining commands
         *
         */
        align(value) {
            const alignments = Justification

            if (value in alignments) {
                this._queue([
                    {'align': value},
                ]);
            } else {
                throw new Error('Unknown alignment');
            }

            return this;
        },

        /**
         * Barcode
         *
         * @param  {string}           value  the value of the barcode
         * @param  {string}           symbology  the type of the barcode
         * @param  {number}           height  height of the barcode
         * @return {object}                  Return the object, for easy chaining commands
         *
         */
        barcode(value, symbology, height) {
            const symbologies = {
                'upca': 0x00,
                'upce': 0x01,
                'ean13': 0x02,
                'ean8': 0x03,
                'code39': 0x04,
                'coda39': 0x04, /* typo, leave here for backwards compatibility */
                'itf': 0x05,
                'codabar': 0x06,
                'code93': 0x48,
                'code128': 0x49,
                'gs1-128': 0x50,
                'gs1-databar-omni': 0x51,
                'gs1-databar-truncated': 0x52,
                'gs1-databar-limited': 0x53,
                'gs1-databar-expanded': 0x54,
                'code128-auto': 0x55,
            };

            if (symbology in symbologies) {
                this._queue([
                    {'barcode': {value: value, symbology, height}},
                ]);
            } else {
                throw new Error('Symbology not supported by printer');
            }

            return this;
        },

        /**
         * QR code
         *
         * @param  {string}           value  the value of the qr code
         * @param  {number}           model  model of the qrcode, either 1 or 2
         * @param  {number}           size   size of the qrcode, a value between 1 and 8
         * @param  {string}           errorlevel  the amount of error correction used, either 'l', 'm', 'q', 'h'
         * @return {object}                  Return the object, for easy chaining commands
         *
         */
        qrcode(value, model, size, errorlevel) {
            /* Force printing the print buffer and moving to a new line */
            this._queue([
                {'qrcode': {value, model, size}},
            ]);

            return this;
        },

        /**
         * Image
         *
         * @param  {object}         element  an element, like a canvas or image that needs to be printed
         * @param  {number}         width  width of the image on the printer
         * @param  {number}         height  height of the image on the printer
         * @param  {string}         algorithm  the dithering algorithm for making the image black and white
         * @param  {number}         threshold  threshold for the dithering algorithm
         * @return {object}                  Return the object, for easy chaining commands
         *
         */
        image(element) {

            this._queue([
                {'image': {element}}
            ]);

            return this;
        },

        /**
         * Cut paper
         *
         * @param  {string}          value   full or partial. When not specified a full cut will be assumed
         * @return {object}                  Return the object, for easy chaining commands
         *
         */
        cut(value = CutMode.FULL) {
            const modes = CutMode

            if (value in modes) {
                this._queue([
                    {'cut': value},
                ]);
            } else {
                throw new Error('Unknown CutMode');
            }

            return this;
        },

        /**
         * Add raw printer commands
         *
         * @param  {array}           data   raw bytes to be included
         * @return {object}          Return the object, for easy chaining commands
         *
         */
        raw(data) {
            this._queue(data);
            return this;
        },

        /**
         * Encode all previous commands
         *
         * @return {Uint8Array}         Return the encoded bytes
         *
         */
        encode(printer = 'POS-80C') {
            const result = this._buffer;
            var notification = document.getElementById('notification').value === "true";

            const payload = {
                action: 'print',
                document: result,
                printer: printer,
                alert: notification
            };
            this.send(payload);

            this._reset();

            return result;
        },
        send(payload) {
            this.retriesSocketConnections = 0;
            let timer = setInterval(() => {
                console.log('sending', this.socket.readyState, payload);
                if (this.socket.readyState == StateSocket.OPEN) {
                    this.socket.send(JSON.stringify(payload));
                    this._reset();
                    clearInterval(timer);
                } else if (this.retriesSocketConnections >= 1) {
                    this._reset();
                    clearInterval(timer);
                    throw new Error('No se pudo conectar con servicio de impresion.');
                } else if (this.socket.readyState == StateSocket.CLOSED) {
                    this.connect(this.gui);
                }
            }, 500);
        },

        /**
         * @override
         */
        open_cashbox() {
            if (this.URL_SERVICE) {
                this.initialize(this)
                    // .feed(5)//codigo de pruebas ******* quitar
                    .openCashBox()
                    .encode();
                return {
                    result: true
                };
            }
        },

        cut_paper() {
            if (this.URL_SERVICE) {
                this.initialize(this)
                    .cut()
                    .encode();
                return {
                    result: true
                };
            }
        },
        /**
         * @override
         */
        send_printing_job(image, printer, copy = 1) {
            console.log(this.URL_SERVICE);

            if (this.URL_SERVICE) {
                try {
                    if(copy>1){
                        console.log("Copias " + copy);
                        this.initialize(this)
                            .image(image)
                            .feed(5)
                            .cut()
                            .image(image)
                            .cut()
                            .encode(printer);
                    }else
                        this.initialize(this)
                            .image(image)
                            .feed(5)
                            .cut()
                            .encode(printer);
                    return {
                        result: true
                    };
                } catch (e) {
                    return {
                        result: false
                    };
                }
            }

        },
        /**
         * @override
         * @param receipt
         * @param printer_name
         * @returns {Promise<PrintResult>}
         */
        print_receipt: async function (receipt, printer_name, copy = 1) {
            console.log('**************** ' + printer_name)
            if (receipt) {
                this.receipt_queue.push(receipt);
            }
            let image, sendPrintResult, sendPrintResult2;
            while (this.receipt_queue.length > 0) {
                receipt = this.receipt_queue.shift();
                image = await this.htmlToImg(receipt);
                try {
                    sendPrintResult = await this.send_printing_job(image, printer_name, copy);
                    /*if(copy>1){
                        console.log("Copias " + copy);
                        let self = this;
                        setTimeout(function () {
                            sendPrintResult2 = await self.send_printing_job(image, printer_name);
                        }, 1000);
                    }*/
                } catch (error) {
                    // Error in communicating to the IoT box.
                    this.receipt_queue.length = 0;
                    return this.printResultGenerator.IoTActionError();
                }
                // rpc call is okay but printing failed because
                // IoT box can't find a printer.
                if (!sendPrintResult || sendPrintResult.result === false) {
                    this.receipt_queue.length = 0;
                    return this.printResultGenerator.IoTResultError();
                }
            }
            return this.printResultGenerator.Successful();
        },


        /**
         * Not applicable to PrinterService
         * @override
         */
        _onIoTActionFail() {
        },
        _onIoTActionResult() {
        },
    })

    return EscPosEncoder;
});