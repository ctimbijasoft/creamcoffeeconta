/**
 * Una clase para interactura con Servicio de impresión
 *
 * @author jasoft
 *
 */
odoo.define('l10n_ec_point_of_sale.PrinterService', function (require) {
    'use strict';

    const Registries = require('point_of_sale.Registries');

    const State = {
        CONNECTING: 0,
        OPEN: 1,
        CLOSING: 2,
        CLOSED: 3
    }

    const Command = {
        TextoConAcentos: "textoacentos",
        QRComoImagen: "qrimagen",
        Imagen: "imagen",
        Text: "text",
        Cut: "cut",
        Pulse: "pulse",
        CutPartial: "cutpartial",
        Justification: "setJustification",
        TextSize: "setTextSize",
        Font: "setFont",
        Emphasize: "setEmphasis",
        Feed: "feed",
        QR: "qrCode",
        AlineacionCentro: "center",
        AlineacionDerecha: "right",
        AlineacionIzquierda: "left",
        FuenteA: "A",
        FuenteB: "B",
        FuenteC: "C",
        Barcode128: "barcode128",
        Barcode39: "barcode39",
        Barcode93: "barcode93",
        BarcodeItf: "barcodeitf",
        BarcodeJan13: "barcodejan13",
        BarcodeJan8: "barcodejan8",
        BarcodeTextAbove: "barcodetextabove",
        BarcodeTextBelow: "barcodetextbelow",
        BarcodeTextNone: "barcodetextnone",
        BarcodeUPCA: "barcodeUPCA",
        BarcodeUPCE: "barcodeUPCE",
        ImagenLocal: "imagenlocal",
    };

    var Class = require('web.Class');
    var PrinterService = Class.extend({
        socket: null,
        retriesSocketConnections: 0,
        gui: null,
        init: function(attributes) {
            this.operaciones = [];
        },
        URL_SERVICE: "ws://localhost:8787/jasoft/printer",
        operaciones: [],
        connect: function(gui){
            this.gui = gui;
            if(this.socket == null)
                this.socket = new WebSocket(this.URL_SERVICE);
            else if(this.socket.readyState == State.CLOSED)
                this.socket = new WebSocket(this.URL_SERVICE);
            else
                return;

            this.retriesSocketConnections ++;

            this.socket.onopen = function(e) {
              console.log("[open] Connection established");
              this.retriesSocketConnections = 0;
            };

            this.socket.onmessage = function(event) {
                let data = JSON.parse(event.data)
                console.log("[message] Data received from server:", data);
            };

            this.socket.onclose = function(event) {
              if (event.wasClean) {
                console.log(`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
              } else {
                console.log('[close] Connection died', event);
              }
            };

            this.socket.onerror = function(error) {
              console.log(`[error] ${error.message}`);
            };
        },
        reset: function (){
            this.operaciones = [];
        },
        load: function(){
            console.log('load');
        },
        text: function(text) {
            this.operaciones.push({command: Command.Text, data: text});
        },
        textoConAcentos: function(texto) {
            this.operaciones.push({command: Command.TextoConAcentos, data: texto});
        },
        feed: function(n) {
            if (!parseInt(n) || parseInt(n) < 0) {
                throw Error("Valor para feed inválido");
            }
            this.operaciones.push({command: Command.Feed, data: n});
        },
        setFontSize: function (multiplicadorAncho, multiplicadorAlto) {
            multiplicadorAncho = parseInt(multiplicadorAncho);
            multiplicadorAlto = parseInt(multiplicadorAlto)
            if (multiplicadorAncho < 1 || multiplicadorAncho > 8) throw "El multiplicador de ancho está fuera del rango";
            if (multiplicadorAlto < 1 || multiplicadorAlto > 8) throw "El multiplicador de alto está fuera del rango";
            this.operaciones.push({command: Command.TextSize, data: `${multiplicadorAncho},${multiplicadorAlto}`});
        },
        setFont: function(font) {
            if (font !== Command.FuenteA && font !== Command.FuenteB && font !== Command.FuenteC) throw Error("Fuente inválida");
            this.operaciones.push({command: Command.Font, data: font});
        },
        setBold: function(val) {
            if (val !== 0 && val !== 1) {
                throw Error("El valor debe ser 1 para true, 0 para false");
            }
            this.operaciones.push({command: Command.Emphasize, data: val});
        },
        setAling: function(justification) {
            if (justification !== Command.AlineacionCentro && justification !== Command.AlineacionDerecha && justification !== Command.AlineacionIzquierda) {
                throw Error(`Alineación ${justification} inválida`);
            }
            this.operaciones.push({command: Command.Justification, data: justification});
        },
        cut: function() {
            this.operaciones.push({command: Command.Cut, data: ""});
        },
        openCash: function() {
            this.operaciones.push({command: Command.Pulse, data: ""});
        },
        cortarParcialmente: function() {
            this.operaciones.push({command: Command.CutPartial, data: ""});
        },
        imagenDesdeUrl: function(url) {
            this.operaciones.push({command: Command.Imagen, data: url});
        },
        imagenLocal: function(ubicacion) {
            this.operaciones.push({command: Command.ImagenLocal, data: ubicacion});
        },
        qr: function(contenido) {
            this.operaciones.push({command: Command.QR, data: contenido});
        },
        qrComoImagen: function(contenido) {
            this.operaciones.push({command: Command.QRComoImagen, data: contenido});
        },
        validarTipoDeCodigoDeBarras: function(tipo) {
            if (
                [
                    Command.Barcode128,
                    Command.Barcode39,
                    Command.Barcode93,
                    Command.BarcodeItf,
                    Command.BarcodeJan13,
                    Command.BarcodeJan8,
                    Command.BarcodeTextAbove,
                    Command.BarcodeTextBelow,
                    Command.BarcodeTextNone,
                    Command.BarcodeUPCA,
                    Command.BarcodeUPCE,
                ]
                    .indexOf(tipo) === -1
            ) throw Error("Tipo de código de barras no soportado");
        },
        barcode: function(contenido, tipo) {
            this.validarTipoDeCodigoDeBarras(tipo);
            this.operaciones.push({command: tipo, contenido});
        },
        print: function(printer = 'termica') {
            const payload = {
                action: 'print',
                document: this.operaciones,
                printer: printer
            };
            this.send(payload);
        },
        send: function (payload){
            this.retriesSocketConnections = 0;
            let timer = setInterval(() => {
                console.log('sending', this.socket.readyState, payload);
                if (this.socket.readyState == State.OPEN) {
                  this.socket.send(JSON.stringify(payload));
                  this.reset();
                  clearInterval(timer);
                }else if(this.retriesSocketConnections >= 1){
                    this.gui.showPopup('ErrorPopup', { title: 'Alerta',
                        body: 'No se ha podido establecer conexión con servidor de impresión.\nRevise el servicio.' });
                    this.reset();
                    clearInterval(timer);
                }else if(this.socket.readyState == State.CLOSED ) {
                    this.connect(this.gui);
                }
            }, 500);
        }
    })

    return PrinterService;
});