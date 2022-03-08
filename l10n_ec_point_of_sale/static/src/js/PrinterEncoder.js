function printPosPrinter() {
    var name = document.getElementsByName("name")[0].innerText;
    var user = document.getElementsByName("user_id")[0].innerText;
    var pos_id = document.getElementsByName("config_id")[0].innerText;
    var start_at = document.getElementsByName("start_at")[0].innerText;
    var stop_at = document.getElementsByName("stop_at")[0].innerText;
    var cash_real_trans = document.getElementsByName("cash_real_transaction")[0].innerText;
    var cash_real_expected = document.getElementsByName("cash_real_expected")[0].innerText;
    var cash_register = document.getElementsByName("cash_register_balance_end_real")[0].innerText;
    var cash_real_dif = document.getElementsByName("cash_real_difference")[0].innerText;

    let printer = new PosPrinter();
    let space = "   ";

    printer.initialize(this);
    printer.align("Center");
    printer.bold(true);
    printer.size("_2", "_2");
    printer.line(name);

    printer.size("_1", "_1");
    printer.bold(false);
    printer.align("Left_Default");
    printer.line(space + "Abierta por:");
    printer.align("Right");
    printer.line(user + space);

    printer.align("Left_Default");
    printer.line(space + "Punto de Venta:");
    printer.align("Right");
    printer.line(pos_id + space);

    printer.align("Left_Default");
    printer.line(space + "Fecha de apertura:");
    printer.align("Right");
    printer.line(start_at + space);

    printer.align("Left_Default");
    printer.line(space + "Fecha de Cierre:");
    printer.align("Right");
    printer.line(stop_at + space);

    printer.align("Left_Default");
    printer.line(space + "+ Transacciones:");
    printer.align("Right");
    printer.line(cash_real_trans + space);

    printer.align("Left_Default");
    printer.line(space + "= Esperado:");
    printer.align("Right");
    printer.line(cash_real_expected + space);

    printer.align("Left_Default");
    printer.line(space + "Actual en efectivo:");
    printer.align("Right");
    printer.line(cash_register + space);

    printer.align("Left_Default");
    printer.line(space + "Diferencia:");
    printer.align("Right");
    printer.line(cash_real_dif + space);

    printer.feed(10);
    printer.align("Center");
    printer.line("Firma");
    printer.feed(2);
    printer.cut();
    printer.encode();

    console.log(printer);
}


class PosPrinter {

    socket = null;
    retriesSocketConnections = 0;
    gui = null;
    URL_SERVICE = "ws://192.168.1.100:8787/jasoft/printer";

    constructor() {

    }

    init() {
        this._reset();
    }

    /**
     //      * Reset the state of the object
     //      *
     //      */
    _reset() {
        this._buffer = [];
        this._codepage = 'ascii';

        this._state = {
            'bold': false,
            'italic': false,
            'underline': false,
            'hanzi': false,
        };
    }

    connect() {
        if (this.socket == null)
            this.socket = new WebSocket(this.URL_SERVICE);
        else if (this.socket.readyState === this.StateSocket.CLOSED)
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
    }

    send(payload) {
        this.retriesSocketConnections = 0;
        let timer = setInterval(() => {
            console.log('sending', this.socket.readyState, payload);
            if (this.socket.readyState == this.StateSocket.OPEN) {
                this.socket.send(JSON.stringify(payload));
                this._reset();
                clearInterval(timer);
            } else if (this.retriesSocketConnections >= 1) {
                this._reset();
                clearInterval(timer);
                throw new Error('No se pudo conectar con servicio de impresion.');
            } else if (this.socket.readyState == this.StateSocket.CLOSED) {
                this.connect(this.gui);
            }
        }, 500);
    }

    newline() {
        this._queue([
            {'newLine': {}}
        ]);

        return this;
    }

    line(value, wrap) {
        if (wrap) {

        }

        this._queue([
            {'line': {value: value, wrap}}
        ]);
        return this;
    }

    size(fontWidth, fontHeight) {

        if (fontHeight === undefined)
            fontHeight = fontWidth

        this._queue([
            {'size': {fontWidth, fontHeight}},
        ]);

        return this;
    }

    bold(value) {
        if (typeof value === 'undefined') {
            value = !this._state.bold;
        }
        this._state.bold = value;
        this._queue([
            {'bold': value},
        ]);
        return this;
    }

    align(value) {
        const alignments = this.Justification

        if (value in alignments) {
            this._queue([
                {'align': value},
            ]);
        } else {
            throw new Error('Unknown alignment');
        }

        return this;
    }

    feed(value) {
        this._queue([
            {'feed': value},
        ]);

        return this;
    }

    text(value, wrap) {
        if (wrap) {

        }

        this._queue([
            {'text': {value: value, wrap}}
        ]);

        return this;
    }

    cut(value = this.CutMode.FULL) {
        const modes = this.CutMode

        if (value in modes) {
            this._queue([
                {'cut': value},
            ]);
        } else {
            throw new Error('Unknown CutMode');
        }

        return this;
    }

    encode(printer = 'POS-80C') {
        const result = this._buffer;

        const payload = {
            action: 'print',
            document: result,
            printer: printer,
            alert: true
        };
        this.send(payload);

        this._reset();

        return result;
    }

    _queue(value) {
        value.forEach((item) => this._buffer.push(item));
    }

    initialize(gui) {
        this.gui = gui;
        this.init();
        this.connect();
        this._queue([
            {'initialize': {}}
        ]);

        return this;
    }


    CutMode = {
        FULL: 'FULL',
        PART: 'PART',
    }

    Justification = {
        Left_Default: 'Left_Default',
        Center: 'Center',
        Right: 'Right'
    };

    StateSocket = {
        CONNECTING: 0,
        OPEN: 1,
        CLOSING: 2,
        CLOSED: 3
    };

}

