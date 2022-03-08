odoo.define('l10n_ec_point_of_sale.ClientDetailsEdit', function (require) {
        'use strict';

        const ClientDetailsEdit = require('point_of_sale.ClientDetailsEdit');
        const Registries = require('point_of_sale.Registries');

        const mensajeValidarCedula = '';


        const L10nECPOSClientDetailsEdit = ClientDetailsEdit =>
            class extends ClientDetailsEdit {

            validar(numero) {
                this.mensajeValidarCedula = '';

              var suma = 0;
              var residuo = 0;
              var pri = false;
              var pub = false;
              var nat = false;
              var numeroProvincias = 24;
              var modulo = 11;

              /* Verifico que el campo no contenga letras */
              var ok=1;
              for (var i=0; i<numero.length && ok==1 ; i++){
                 var n = parseInt(numero.charAt(i));
                 if (isNaN(n)) ok=0;
              }
              if (ok==0){
                 this.mensajeValidarCedula ="No puede ingresar caracteres en el número";
                 return false;
              }

              if (numero.length < 10 ){
                 this.mensajeValidarCedula ='El número ingresado no es válido';
                 return false;
              }

              /* Los primeros dos digitos corresponden al codigo de la provincia */
              var provincia = numero.substr(0,2);
              if (provincia < 1 || provincia > numeroProvincias){
                 this.mensajeValidarCedula ='El código de la provincia (dos primeros dígitos) es inválido';
             return false;
              }

              /* Aqui almacenamos los digitos de la cedula en variables. */
              var d1  = numero.substr(0,1);
              var d2  = numero.substr(1,1);
              var d3  = numero.substr(2,1);
              var d4  = numero.substr(3,1);
              var d5  = numero.substr(4,1);
              var d6  = numero.substr(5,1);
              var d7  = numero.substr(6,1);
              var d8  = numero.substr(7,1);
              var d9  = numero.substr(8,1);
              var d10 = numero.substr(9,1);

              /* El tercer digito es: */
              /* 9 para sociedades privadas y extranjeros   */
              /* 6 para sociedades publicas */
              /* menor que 6 (0,1,2,3,4,5) para personas naturales */

              if (d3==7 || d3==8){
                 this.mensajeValidarCedula ='El tercer dígito ingresado es inválido';
                 return false;
              }

              var p1, p2, p3, p4, p5, p6, p7, p8, p9;

              /* Solo para personas naturales (modulo 10) */
              if (d3 < 6 || numero.length == 10){
                 nat = true;
                 p1 = d1 * 2;  if (p1 >= 10) p1 -= 9;
                 p2 = d2 * 1;  if (p2 >= 10) p2 -= 9;
                 p3 = d3 * 2;  if (p3 >= 10) p3 -= 9;
                 p4 = d4 * 1;  if (p4 >= 10) p4 -= 9;
                 p5 = d5 * 2;  if (p5 >= 10) p5 -= 9;
                 p6 = d6 * 1;  if (p6 >= 10) p6 -= 9;
                 p7 = d7 * 2;  if (p7 >= 10) p7 -= 9;
                 p8 = d8 * 1;  if (p8 >= 10) p8 -= 9;
                 p9 = d9 * 2;  if (p9 >= 10) p9 -= 9;
                 modulo = 10;
              }

              /* Solo para sociedades publicas (modulo 11) */
              /* Aqui el digito verficador esta en la posicion 9, en las otras 2 en la pos. 10 */
              else if(d3 == 6){
                 pub = true;
                 p1 = d1 * 3;
                 p2 = d2 * 2;
                 p3 = d3 * 7;
                 p4 = d4 * 6;
                 p5 = d5 * 5;
                 p6 = d6 * 4;
                 p7 = d7 * 3;
                 p8 = d8 * 2;
                 p9 = 0;
              }

              /* Solo para entidades privadas (modulo 11) */
              else if(d3 == 9) {
                 pri = true;
                 p1 = d1 * 4;
                 p2 = d2 * 3;
                 p3 = d3 * 2;
                 p4 = d4 * 7;
                 p5 = d5 * 6;
                 p6 = d6 * 5;
                 p7 = d7 * 4;
                 p8 = d8 * 3;
                 p9 = d9 * 2;
              }

              suma = p1 + p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9;
              residuo = suma % modulo;

              /* Si residuo=0, dig.ver.=0, caso contrario 10 - residuo*/
              var digitoVerificador = residuo==0 ? 0: modulo - residuo;

              console.log(suma, modulo, residuo, digitoVerificador, d9);

              /* ahora comparamos el elemento de la posicion 10 con el dig. ver.*/
              if (pub==true){
                 if (digitoVerificador != d9){
                    this.mensajeValidarCedula ='El RUC de la empresa del sector público es incorrecto.';
                    return false;
                 }
                 /* El ruc de las empresas del sector publico terminan con 0001*/
                 if ( numero.substr(9,4) != '0001' ){
                    this.mensajeValidarCedula ='El RUC de la empresa del sector público debe terminar con 0001';

                    return false;
                 }
              }
              else if(pri == true){
                 if (digitoVerificador != d10){
                    this.mensajeValidarCedula ='El ruc de la empresa del sector privado es incorrecto.';
                    return false;
                 }
                 if ( numero.substr(10,3) != '001' ){
                    this.mensajeValidarCedula ='El ruc de la empresa del sector privado debe terminar con 001';
                    return false;
                 }
              }

              else if(nat == true){
                 if (digitoVerificador != d10){
                    this.mensajeValidarCedula ='El número de cédula de la persona natural es incorrecto.';
                    return false;
                 }
                 if (numero.length >10 && numero.substr(10,3) != '001' ){
                    this.mensajeValidarCedula ='El RUC de la persona natural debe terminar con 001';
                    return false;
                 }
              }
              return true;
           }

            validarDos(dni) {
                console.log("validando");
                var cad = dni.trim();
                /*if(cad.length == 13)
                    return this.validarRuc(cad);
                if(cad.length == 10)
                    return this.validarCedula(cad);*/
                return false;
                /*
                var cad = dni.trim();
                if(cad.length == 13)
                     if(cad.substr(10, 13) !== '001')
                         return false;
                     cad = cad.substr(0,10)

                var total = 0;
                var longitud = cad.length;
                var longcheck = longitud - 1;

                if (cad !== "" && longitud === 10){
                  for(var i = 0; i < longcheck; i++){
                    if (i%2 === 0) {
                      var aux = cad.charAt(i) * 2;
                      if (aux > 9) aux -= 9;
                      total += aux;
                    } else {
                      total += parseInt(cad.charAt(i)); // parseInt o concatenará en lugar de sumar
                    }
                  }

                  total = total % 10 ? 10 - total % 10 : 0;

                  if (cad.charAt(longitud-1) == total) {
                    return true;
                  }else{
                    return false;
                  }
                }*/
              }


                saveChanges() {
                    let cedula = /^[0-9]{10}$/;
                    let ruc = /^[0-9]{13}$/;
                    let email = /^[^@]+@[^@]+\.[a-zA-Z]{2,}$/;

                    let processedChanges = {};
                    for (let [key, value] of Object.entries(this.changes)) {
                        if (this.intFields.includes(key)) {
                            processedChanges[key] = parseInt(value) || false;
                        } else {
                            processedChanges[key] = value;
                        }
                    }
                    if ((!this.props.partner.name && !processedChanges.name) ||
                        processedChanges.name === '') {
                        return this.showPopup('ErrorPopup', {
                            title: _('Por favor ingrese un nombre de cliente valido'),
                        });
                    }

                    if ((!this.props.partner.vat && !processedChanges.vat) ||
                        !(cedula.test(processedChanges.vat ? processedChanges.vat : this.props.partner.vat) || ruc.test(processedChanges.vat ? processedChanges.vat : this.props.partner.vat))) {
                        return this.showPopup('ErrorPopup', {
                            title: _('Por favor ingrese un número de cédula o ruc de cliente valido.'),
                        });
                    }

                    var vat = processedChanges.vat ? processedChanges.vat : this.props.partner.vat;
                    console.log('validando cedula')
                    if ((vat.length == 10 || vat.length ==13) && !this.validar(vat)) {
                        return this.showPopup('ErrorPopup', {
                            title: _('Por favor ingrese un número de cédula o ruc de valido.\n'+ this.mensajeValidarCedula),
                        });
                    }


                    if ((!this.props.partner.email && !processedChanges.email) ||
                        processedChanges.email === '' || !email.test(processedChanges.email ? processedChanges.email : this.props.partner.email)) {
                        return this.showPopup('ErrorPopup', {
                            title: _('Por favor ingrese un email valido'),
                        });
                    }

                    if ((!this.props.partner.phone && !processedChanges.phone) ||
                        processedChanges.phone === '') {
                        return this.showPopup('ErrorPopup', {
                            title: _('Por favor ingrese un número de teléfono valido'),
                        });
                    }

                    console.log('validando repetidos')
                    if (this.props.partner.id === undefined) {
                        var vat = processedChanges.vat ? processedChanges.vat : this.props.partner.vat;
                        var i;
                        for (i = 0; i < this.env.pos.partners.length; i++) {
                            var client = this.env.pos.partners[i];

                            if (client.vat === vat) {
                                return this.showPopup('ErrorPopup', {
                                    title: _('Ya existe un cliente registrado con la cedula/ruc'),
                                });
                            }
                        }
                    }

                    var vat  = processedChanges.vat ? processedChanges.vat : this.props.partner.vat;

                    if(vat.length == 10){
                        this.props.partner.l10n_latam_identification_type_id = 5;
                    }else if(vat.length == 13){
                        this.props.partner.l10n_latam_identification_type_id = 4;
                    }else{
                        this.props.partner.l10n_latam_identification_type_id = 2;
                    }
                    processedChanges.l10n_latam_identification_type_id = this.props.partner.l10n_latam_identification_type_id;

                    processedChanges.id = this.props.partner.id || false;
                    this.trigger('save-changes', {processedChanges});
                }

            };

        Registries.Component.extend(ClientDetailsEdit, L10nECPOSClientDetailsEdit);

        return ClientDetailsEdit;
    }
);
