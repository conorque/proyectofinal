const { create } = require('xmlbuilder2');

function generarXMLFactura(factura) {
    // Agrupar y sumar los impuestos por código y códigoPorcentaje
    const totalImpuestos = factura.detalles.reduce((acum, detalle) => {
        detalle.impuestos.forEach((impuesto) => {
            const key = `${impuesto.codigo}-${impuesto.codigoPorcentaje}`;
            if (!acum[key]) {
                acum[key] = {
                    codigo: impuesto.codigo,
                    codigoPorcentaje: impuesto.codigoPorcentaje,
                    baseImponible: 0,
                    valor: 0,
                };
            }
            acum[key].baseImponible += impuesto.baseImponible;
            acum[key].valor += impuesto.valor;
        });
        return acum;
    }, {});

    // Convertir el objeto de impuestos a un array
    const totalConImpuestos = Object.values(totalImpuestos);

    const obj = {
        factura: {
            '@id': 'comprobante',
            '@version': '1.1.0',
            infoTributaria: {
                ambiente: factura.amb,
                tipoEmision: factura.tipoEmision,
                razonSocial: factura.emisor.razonSocial,
                nombreComercial: factura.emisor.nombreComercial,
                ruc: factura.emisor.ruc,
                claveAcceso: factura.claveAcceso,
                codDoc: '01',
                estab: factura.estab,
                ptoEmi: factura.ptoEmi,
                secuencial: factura.secuencial,
                dirMatriz: factura.emisor.direccionMatriz,
                contribuyenteRimpe: factura.emisor.contribuyenteRimpe
            },
            infoFactura: {
                fechaEmision: factura.fechaEmision,
                dirEstablecimiento: factura.emisor.direccionEstablecimiento,
                obligadoContabilidad: factura.emisor.obligadoContabilidad,
                tipoIdentificacionComprador: factura.receptor.tipoIdentificacion,
                razonSocialComprador: factura.receptor.razonSocial,
                identificacionComprador: factura.receptor.identificacion,
                totalSinImpuestos: factura.totalSinImpuestos,
                totalDescuento: factura.totalDescuento,
                totalConImpuestos: {
                    totalImpuesto: totalConImpuestos.map(impuesto => ({
                        codigo: impuesto.codigo,
                        codigoPorcentaje: impuesto.codigoPorcentaje,
                        baseImponible: impuesto.baseImponible,
                        valor: impuesto.valor
                    }))
                },
                propina: factura.propina,
                importeTotal: factura.importeTotal,
                moneda: factura.moneda,
                pagos: {
                    pago: factura.pagos.map(pago => ({
                        formaPago: pago.formaPago,
                        total: pago.total,
                        plazo: pago.plazo,
                        unidadTiempo: pago.unidadTiempo
                    }))
                }
            },
            detalles: {
                detalle: factura.detalles.map(detalle => ({
                    codigoPrincipal: detalle.codigoPrincipal,
                    codigoAuxiliar: detalle.codigoAuxiliar,
                    descripcion: detalle.descripcion,
                    cantidad: detalle.cantidad,
                    precioUnitario: detalle.precioUnitario,
                    descuento: detalle.descuento,
                    precioTotalSinImpuesto: detalle.precioTotalSinImpuesto,
                    impuestos: {
                        impuesto: detalle.impuestos.map(impuesto => ({
                            codigo: impuesto.codigo,
                            codigoPorcentaje: impuesto.codigoPorcentaje,
                            tarifa: impuesto.tarifa,
                            baseImponible: impuesto.baseImponible,
                            valor: impuesto.valor
                        }))
                    }
                }))
            }
        }
    };

    // Generar el XML con formato y líneas en blanco entre elementos
    const xml = create(obj).end({ prettyPrint: true, gap: '\n\n\n' });
    return xml;
}

module.exports = generarXMLFactura;
