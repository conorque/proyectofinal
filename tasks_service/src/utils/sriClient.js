const axios = require('axios');
const fs = require('fs');

// Función para enviar el archivo XML firmado al SRI
async function enviarFactura(filePath, ambiente) {
    const url = ambiente === 'produccion'
        ? 'https://cel.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline'
        : 'https://celcer.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline';

    // Leer el archivo XML firmado desde el sistema de archivos
    const xmlFirmado = fs.readFileSync(filePath, 'utf8');

    // Crear el envoltorio SOAP con el contenido del XML firmado
    const soapEnvelope = `
        <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ec="http://ec.gob.sri.ws.recepcion">
            <soapenv:Header/>
            <soapenv:Body>
                <ec:validarComprobante>
                    <xml>${Buffer.from(xmlFirmado).toString('base64')}</xml>
                </ec:validarComprobante>
            </soapenv:Body>
        </soapenv:Envelope>
    `;

    try {
        // Enviar el envoltorio SOAP al SRI
        const response = await axios.post(url, soapEnvelope, {
            headers: {
                'Content-Type': 'text/xml',
                'SOAPAction': ''
            }
        });

        // Verificar el estado de la respuesta
        if (response.data.includes('<estado>RECIBIDA</estado>')) {
            console.log('Factura recibida correctamente por el SRI.', response.data);
            return true;
        } else {
            console.log('Error al enviar la factura al SRI:', response.data);
            return false;
        }
    } catch (error) {
        console.error('Error al enviar la factura al SRI:', error.message);
        return false;
    }
}

module.exports = enviarFactura;
