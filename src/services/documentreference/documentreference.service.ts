import console = require('console');
import { getDocumentReference } from '../../controller/documentreference/documentreference';
import { CONSTANTS } from './../../constants';
import { fhirError } from './../../utils/errorHandler';

export = {
	search: async (args) => {

		try {

			console.log(args)
			let { base_version } = args;
			let subjIdentifier = args['subject:identifier'] || args['subject'];
			let type = args['type'];
			let custodian = args['custodian'];
			subjIdentifier = subjIdentifier ? subjIdentifier.split('|') : [];
			type = type ? type.split('|') : [];
			if (subjIdentifier.length > 0 && type.length > 0 && custodian) {
				if (type[1] === CONSTANTS.LOINC.DOCUMENT_REFERENCE && custodian === process.env.IPS_DOMINIO) {
					const patientID = subjIdentifier[1];
					const documentReference = await getDocumentReference(base_version, patientID);
					return documentReference;
				} else {
					if (type[1] !== CONSTANTS.LOINC.DOCUMENT_REFERENCE) {
						const message = 'This server dont support this lonic code';
						fhirError(message, 'Error', 500, 'El código Loinc enviado no es soportado para este Document Reference.')

					}
					if (custodian[0] !== process.env.IPS_DOMINIO) {
						const message = 'This custodian is not valid';
						fhirError(message, 'Error', 500, 'El custodian enviado no es válido para este servidor.')
					}
				}
			} else {
				const message = 'Invalid parametes for processing';
				fhirError(message, 'Error', 500, 'Los parámetros enviados no son válidos')
			}
		} catch (err) {
			return err;
		}

	}
}

