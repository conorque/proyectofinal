const axios = require('axios');
const { parseStringPromise, processors } = require('xml2js');
const { stripPrefix } = processors;

async function consultarAutorizacion(claveAcceso, ambiente) {
    console.log('Clave cruda:', JSON.stringify(claveAcceso));
    console.log('Longitud:', claveAcceso.length);
    console.log('Sólo dígitos?:', /^[0-9]+$/.test(claveAcceso));
  // 1️⃣ URL sin ?wsdl
  const urlBase = ambiente === 'produccion'
    ? 'https://cel.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline'
    : 'https://celcer.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline';

  // 2️⃣ Envelope SOAP
  const soapRequest = `
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                      xmlns:ec="http://ec.gob.sri.ws.autorizacion">
      <soapenv:Header/>
      <soapenv:Body>
        <ec:autorizacionComprobante>
          <claveAccesoComprobante>${claveAcceso}</claveAccesoComprobante>
        </ec:autorizacionComprobante>
      </soapenv:Body>
    </soapenv:Envelope>
  `;

  try {
    // 3️⃣ Llamada al endpoint
    const response = await axios.post(urlBase, soapRequest, {
      headers: { 'Content-Type': 'text/xml' },
      timeout: 20000
    });

    const xml = response.data;
    console.log('--- XML de respuesta crudo ---\n', xml);

    // 4️⃣ Parsear con stripPrefix para ignorar prefijos
    const parsed = await parseStringPromise(xml, {
      explicitArray: false,
      tagNameProcessors: [ stripPrefix ]
    });

    const body = parsed.Envelope.Body;

    // 5️⃣ ¿Hay un Fault?
    if (body.Fault) {
      console.error('--- SOAP Fault recibido ---');
      console.error('faultcode   :', body.Fault.faultcode);
      console.error('faultstring :', body.Fault.faultstring);
      return {
        error: true,
        tipo: 'SOAP Fault',
        faultcode: body.Fault.faultcode,
        faultstring: body.Fault.faultstring
      };
    }

    // 6️⃣ Buscar la respuesta de autorizacion (sin preocuparnos de prefijos)
    const respKey = Object.keys(body)
      .find(k => k.toLowerCase().includes('autorizacioncomprobanteresponse'));
    const resp   = body[respKey].RespuestaAutorizacionComprobante;
    const autorizaciones = resp.autorizaciones.autorizacion;
    const auth = Array.isArray(autorizaciones) ? autorizaciones[0] : autorizaciones;

    console.log('--- Detalle de autorización ---\n', auth);

    return {
      error: false,
      estado:           auth.estado,
      claveAcceso:      auth.claveAcceso,        // tu clave original
      numeroAutorizacion: auth.numeroAutorizacion,
      fechaAutorizacion: auth.fechaAutorizacion,
      ambiente:           auth.ambiente,
      motivo:             auth.motivo,            // en NO AUTORIZADO suele venir
      mensaje:            auth.mensaje            // más detalle
    };

  } catch (err) {
    // 7️⃣ Si recibes un HTTP 500, axios lo trata como error, pero puede traer XML en err.response.data
    if (err.response?.data) {
      console.error('--- Respuesta de error crudo ---\n', err.response.data);
    }
    console.error('Error en la petición:', err.message);
    return {
      error: true,
      tipo: 'HTTP Error',
      message: err.message
    };
  }
}

// Ejemplo de uso
consultarAutorizacion(
  '2105202501010526043400110010010000000060000000610',
  'pruebas'
).then(res => console.log('Resultado estructurado:', res));
