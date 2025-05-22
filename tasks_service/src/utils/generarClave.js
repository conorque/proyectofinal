function generarClaveAcceso(fechaEmision, tipoComprobante, ruc, ambiente, establecimiento, puntoEmision, secuencial, tipoEmision) {
    // Convertir la fecha de formato DD/MM/AAAA a AAAA-MM-DD para que sea compatible con new Date()
    const [dia, mes, año] = fechaEmision.split('/');
    const fechaFormateada = `${dia.padStart(2, '0')}${mes.padStart(2, '0')}${año}`;

    // Eliminar el primer dígito del secuencial para obtener el código numérico
    const codigoNumerico = secuencial.substring(1);

    // Datos iniciales
    const claveAccesoSinVerificador = fechaFormateada +
        tipoComprobante +
        ruc +
        ambiente +
        establecimiento +
        puntoEmision +
        secuencial.padStart(9, '0') + // Asegurarse de que el secuencial tenga 9 dígitos
        codigoNumerico.padStart(8, '0') + // Asegurarse de que el código numérico tenga 8 dígitos
        tipoEmision;

    // Calcular dígito verificador
    const digitoVerificador = calcularDigitoVerificador(claveAccesoSinVerificador);

    // Clave de acceso completa
    const claveAcceso = claveAccesoSinVerificador + digitoVerificador;

    return claveAcceso;
}

function calcularDigitoVerificador(clave) {
    const pesos = [2, 3, 4, 5, 6, 7];
    let total = 0;

    for (let i = clave.length - 1, j = 0; i >= 0; i--, j++) {
        total += parseInt(clave[i], 10) * pesos[j % 6];
    }

    const modulo11 = 11 - (total % 11);
    const digitoVerificador = modulo11 === 11 ? 0 : modulo11 === 10 ? 1 : modulo11;

    return digitoVerificador.toString();
}

module.exports = generarClaveAcceso;
