const axios = require('axios');
const { parseStringPromise } = require('xml2js');

async function consultarAutorizacion(claveAcceso, ambiente) {
    const url = ambiente === 'produccion'
        ? 'https://cel.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl'
        : 'https://celcer.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl';

    const soapRequest = `
        <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ec="http://ec.gob.sri.ws.autorizacion">
            <soapenv:Header/>
            <soapenv:Body>
                <ec:autorizacionComprobante>
                    <claveAccesoComprobante>${claveAcceso}</claveAccesoComprobante>
                </ec:autorizacionComprobante>
            </soapenv:Body>
        </soapenv:Envelope>
    `;

    try {
        const { data } = await axios.post(url, soapRequest, {
            headers: {
                'Content-Type': 'text/xml',
                'SOAPAction': ''
            }
        });

        // Parsear la respuesta SOAP
        const parsedResult = await parseStringPromise(data, { explicitArray: false });

        // Acceder al resultado de autorización
        const autorizacion = parsedResult['soap:Envelope']['soap:Body']['ns2:autorizacionComprobanteResponse']['RespuestaAutorizacionComprobante']['autorizaciones']['autorizacion'];

        // Verificar si está autorizado y devolver clave de acceso y estado
        const estado = autorizacion.estado;
        if (estado === 'AUTORIZADO') {
            return {
                claveAcceso: autorizacion.numeroAutorizacion,
                estado: 'AUTORIZADO'
            };
        } else {
            return {
                claveAcceso: autorizacion.numeroAutorizacion,
                estado: 'NO AUTORIZADO'
            };
        }
    } catch (error) {
        console.error('Error al consultar la autorización:', error.message);
        return null;
    }
}

// const xmlFilePath = '2105202501010526043400110010010000000010000000117';
// const ambiente = 'pruebas';  // Cambia a 'produccion' cuando sea necesario

// consultarAutorizacion(xmlFilePath, ambiente)
//     .then(result => {
//         console.log('Resultado del envío:', result);
//     })
//     .catch(error => {
//         console.error('Error inesperado:', error);
//     });

module.exports = consultarAutorizacion;
