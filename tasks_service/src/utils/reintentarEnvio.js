const FacturaPendiente = require('../models/pendingInvoice');
const enviarFactura = require('./sriClient');

async function reintentarEnvio(factura, xmlFirmado, ambiente) {
    const maxReintentos = 2;
    for (let i = 0; i < maxReintentos; i++) {
        const enviado = await enviarFactura(xmlFirmado, ambiente);

        if (enviado) {
            return true; // Factura enviada correctamente
        }

        console.log(`Reintento ${i + 1} fallido para factura ${factura._id}`);
    }

    // Si llega aquí, significa que todos los reintentos fallaron
    console.log(`No se pudo enviar la factura ${factura._id} después de ${maxReintentos} intentos. Almacenando para reenvío.`);

    // Almacenar la factura para reenviar más tarde
    const facturaPendiente = new FacturaPendiente({
        facturaId: factura._id,
        xmlFirmado: xmlFirmado,
        reintentos: maxReintentos
    });

    await facturaPendiente.save();
    return false;
}

module.exports = reintentarEnvio;
