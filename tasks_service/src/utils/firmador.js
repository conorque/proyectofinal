const fs = require('fs');
const forge = require('node-forge');
const { DOMParser, XMLSerializer } = require('@xmldom/xmldom');
const crypto = require('crypto');
const pretty = require('pretty');

function firmarXMLConP12(xmlPath, p12Path, p12Password) {
    try {
        // Leer el archivo XML
        const xml = fs.readFileSync(xmlPath, 'utf8');

        // Leer el archivo .p12 con node-forge
        const p12Buffer = fs.readFileSync(p12Path, 'binary');
        const p12Asn1 = forge.asn1.fromDer(p12Buffer);
        const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, p12Password);

        // Extraer clave privada y certificado
        const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
        const keyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag][0];
        const privateKey = keyBag.key;

        const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
        const certBag = certBags[forge.pki.oids.certBag][0];
        const certificate = certBag.cert;

        // Extraer el nombre del emisor y el número de serie desde el certificado
        const issuer = certificate.issuer.attributes.map(attr => `${attr.shortName}=${attr.value}`).join(', ');
        const serialNumber = certificate.serialNumber;

        // Crear el documento XML
        const doc = new DOMParser().parseFromString(xml, 'application/xml');

        // Crear el elemento <ds:Signature>
        const signatureElement = doc.createElement('ds:Signature');
        signatureElement.setAttribute('xmlns:ds', 'http://www.w3.org/2000/09/xmldsig#');
        signatureElement.setAttribute('xmlns:etsi', 'http://uri.etsi.org/01903/v1.3.2#');
        signatureElement.setAttribute('Id', 'Signature325964');

        // Crear el nodo <SignedInfo>
        const signedInfo = doc.createElement('ds:SignedInfo');
        signedInfo.setAttribute('Id', 'Signature-SignedInfo703355');

        // CanonicalizationMethod
        const canonicalizationMethod = doc.createElement('ds:CanonicalizationMethod');
        canonicalizationMethod.setAttribute('Algorithm', 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315');
        signedInfo.appendChild(canonicalizationMethod);

        // SignatureMethod
        const signatureMethod = doc.createElement('ds:SignatureMethod');
        signatureMethod.setAttribute('Algorithm', 'http://www.w3.org/2000/09/xmldsig#rsa-sha1');
        signedInfo.appendChild(signatureMethod);

        // Reference for SignedProperties
        const referenceSignedProperties = doc.createElement('ds:Reference');
        referenceSignedProperties.setAttribute('Id', 'SignedPropertiesID45207');
        referenceSignedProperties.setAttribute('Type', 'http://uri.etsi.org/01903#SignedProperties');
        referenceSignedProperties.setAttribute('URI', '#Signature325964-SignedProperties218153');

        const digestMethodSignedProperties = doc.createElement('ds:DigestMethod');
        digestMethodSignedProperties.setAttribute('Algorithm', 'http://www.w3.org/2000/09/xmldsig#sha1');
        referenceSignedProperties.appendChild(digestMethodSignedProperties);

        // Crear <etsi:SignedProperties>
        const signedProperties = doc.createElement('etsi:SignedProperties');
        signedProperties.setAttribute('Id', 'Signature325964-SignedProperties218153');
        const signedSignatureProperties = doc.createElement('etsi:SignedSignatureProperties');
        const signingTime = doc.createElement('etsi:SigningTime');
        signingTime.textContent = new Date().toISOString();
        signedSignatureProperties.appendChild(signingTime);

        const signingCertificate = doc.createElement('etsi:SigningCertificate');
        const certDigest = doc.createElement('etsi:CertDigest');
        const digestMethodCert = doc.createElement('ds:DigestMethod');
        digestMethodCert.setAttribute('Algorithm', 'http://www.w3.org/2000/09/xmldsig#sha1');
        const digestValueCert = doc.createElement('ds:DigestValue');

        // Calcular digest del certificado
        const certDigestValue = crypto.createHash('sha1').update(forge.asn1.toDer(forge.pki.certificateToAsn1(certificate)).getBytes()).digest('base64');
        digestValueCert.textContent = certDigestValue;

        certDigest.appendChild(digestMethodCert);
        certDigest.appendChild(digestValueCert);

        const issuerSerial = doc.createElement('etsi:IssuerSerial');
        const x509IssuerName = doc.createElement('ds:X509IssuerName');
        x509IssuerName.textContent = issuer;
        const x509SerialNumber = doc.createElement('ds:X509SerialNumber');
        x509SerialNumber.textContent = serialNumber;

        issuerSerial.appendChild(x509IssuerName);
        issuerSerial.appendChild(x509SerialNumber);

        signingCertificate.appendChild(certDigest);
        signingCertificate.appendChild(issuerSerial);
        signedSignatureProperties.appendChild(signingCertificate);
        signedProperties.appendChild(signedSignatureProperties);

        // Agregar <DataObjectFormat> para "comprobante"
        const signedDataObjectProperties = doc.createElement('etsi:SignedDataObjectProperties');
        const dataObjectFormat = doc.createElement('etsi:DataObjectFormat');
        dataObjectFormat.setAttribute('ObjectReference', '#Reference-ID-152289');
        const description = doc.createElement('etsi:Description');
        description.textContent = 'contenido comprobante';
        const mimeType = doc.createElement('etsi:MimeType');
        mimeType.textContent = 'text/xml';

        dataObjectFormat.appendChild(description);
        dataObjectFormat.appendChild(mimeType);
        signedDataObjectProperties.appendChild(dataObjectFormat);
        signedProperties.appendChild(signedDataObjectProperties);

        const serializedSignedProperties = new XMLSerializer().serializeToString(signedProperties);

        // Calcular digest de SignedProperties
        const digestValueSignedProperties = crypto.createHash('sha1').update(serializedSignedProperties).digest('base64');
        const digestValueSignedPropertiesElement = doc.createElement('ds:DigestValue');
        digestValueSignedPropertiesElement.textContent = digestValueSignedProperties;
        referenceSignedProperties.appendChild(digestValueSignedPropertiesElement);

        signedInfo.appendChild(referenceSignedProperties);

        // Reference for Certificate
        const referenceCertificate = doc.createElement('ds:Reference');
        referenceCertificate.setAttribute('URI', '#Certificate1270111');

        const digestMethodCertificate = doc.createElement('ds:DigestMethod');
        digestMethodCertificate.setAttribute('Algorithm', 'http://www.w3.org/2000/09/xmldsig#sha1');
        referenceCertificate.appendChild(digestMethodCertificate);

        const digestValueCertificateElement = doc.createElement('ds:DigestValue');
        digestValueCertificateElement.textContent = certDigestValue;
        referenceCertificate.appendChild(digestValueCertificateElement);

        signedInfo.appendChild(referenceCertificate);

        // Reference for the "comprobante"
        const referenceComprobante = doc.createElement('ds:Reference');
        referenceComprobante.setAttribute('Id', 'Reference-ID-152289');
        referenceComprobante.setAttribute('URI', '#comprobante');

        const transforms = doc.createElement('ds:Transforms');
        const transform = doc.createElement('ds:Transform');
        transform.setAttribute('Algorithm', 'http://www.w3.org/2000/09/xmldsig#enveloped-signature');
        transforms.appendChild(transform);

        referenceComprobante.appendChild(transforms);

        const digestMethodComprobante = doc.createElement('ds:DigestMethod');
        digestMethodComprobante.setAttribute('Algorithm', 'http://www.w3.org/2000/09/xmldsig#sha1');
        referenceComprobante.appendChild(digestMethodComprobante);

        // Calcular digest del comprobante
        const serializedComprobante = new XMLSerializer().serializeToString(doc.documentElement);
        const digestValueComprobante = crypto.createHash('sha1').update(Buffer.from(serializedComprobante, 'utf8')).digest('base64');
        const digestValueComprobanteElement = doc.createElement('ds:DigestValue');
        digestValueComprobanteElement.textContent = digestValueComprobante;
        referenceComprobante.appendChild(digestValueComprobanteElement);

        signedInfo.appendChild(referenceComprobante);

        // Firmar <SignedInfo> usando la clave privada
        const signedInfoCanon = new XMLSerializer().serializeToString(signedInfo);
        const signer = crypto.createSign('RSA-SHA1');
        signer.update(signedInfoCanon);
        const signatureValue = signer.sign({
            key: forge.pki.privateKeyToPem(privateKey),
            padding: crypto.constants.RSA_PKCS1_PADDING,
        }, 'base64');

        // Agregar <SignatureValue> después de <SignedInfo>
        const signatureValueElement = doc.createElement('ds:SignatureValue');
        signatureValueElement.textContent = signatureValue;
        signatureValueElement.setAttribute('Id', 'SignatureValue427178');

        // Añadir <SignedInfo> y <SignatureValue> al <Signature>
        signatureElement.appendChild(signedInfo);
        signatureElement.appendChild(signatureValueElement);

        // Agregar <KeyInfo> y <RSAKeyValue>
        const keyInfo = doc.createElement('ds:KeyInfo');
        keyInfo.setAttribute('Id', 'Certificate1270111');
        const x509Data = doc.createElement('ds:X509Data');
        const x509Certificate = doc.createElement('ds:X509Certificate');
        const certBase64 = forge.util.encode64(forge.asn1.toDer(forge.pki.certificateToAsn1(certificate)).getBytes());
        x509Certificate.textContent = certBase64;
        x509Data.appendChild(x509Certificate);
        keyInfo.appendChild(x509Data);

        const keyValue = doc.createElement('ds:KeyValue');
        const rsaKeyValue = doc.createElement('ds:RSAKeyValue');
        const modulus = doc.createElement('ds:Modulus');
        const exponent = doc.createElement('ds:Exponent');

        // Calcular el modulus y el exponente de la clave pública
        const publicKey = forge.pki.setRsaPublicKey(privateKey.n, privateKey.e);
        modulus.textContent = Buffer.from(publicKey.n.toByteArray()).toString('base64');
        exponent.textContent = Buffer.from(publicKey.e.toByteArray()).toString('base64');

        rsaKeyValue.appendChild(modulus);
        rsaKeyValue.appendChild(exponent);
        keyValue.appendChild(rsaKeyValue);
        keyInfo.appendChild(keyValue);

        signatureElement.appendChild(keyInfo);

        // Agregar el nodo <ds:Object> con las propiedades calificadas
        const signatureObject = doc.createElement('ds:Object');
        signatureObject.setAttribute('Id', 'Signature325964-Object675960');

        const qualifyingProperties = doc.createElement('etsi:QualifyingProperties');
        qualifyingProperties.setAttribute('Target', '#Signature325964');

        qualifyingProperties.appendChild(signedProperties);
        signatureObject.appendChild(qualifyingProperties);
        signatureElement.appendChild(signatureObject);

        // Añadir la firma al nodo raíz del XML
        doc.documentElement.appendChild(signatureElement);

        // Serializar el documento XML firmado
        const signedXml = new XMLSerializer().serializeToString(doc);

        // Formatear el XML para que esté en múltiples líneas
        const prettyXml = pretty(signedXml);

        // Guardar el XML firmado en un archivo
        const signedXmlPath = xmlPath.replace('.xml', '_signed.xml');
        fs.writeFileSync(signedXmlPath, prettyXml, 'utf8');
        console.log(`XML firmado guardado en: ${signedXmlPath}`);

        return prettyXml;
    } catch (error) {
        console.error('Error al firmar el XML:', error);
        throw error;
    }
}

module.exports = firmarXMLConP12;
