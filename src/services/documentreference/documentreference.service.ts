import { ServerError } from '@bluehalo/node-fhir-server-core';
import { getDocumentReference } from '../../controller/documentreference/documentreference';
import { CONSTANTS } from './../../constants';
import { getDominio } from '../../encoders';
import { fhirError } from './../../utils/errorHandler';

export = {
	search: async (args: any) => {
		try {
			const { base_version } = args;
			let subjIdentifier = args['subject:identifier'] || args['subject'];
			let type = args['type'];
			const custodian = args['custodian'];
			const dominio = getDominio();
			subjIdentifier = subjIdentifier ? subjIdentifier.split('|') : [];
			type = type ? type.split('|') : [];
			if (subjIdentifier.length > 0 && type.length > 0 && custodian) {
				if (type[1] === CONSTANTS.LOINC.DOCUMENT_REFERENCE && custodian === dominio) {
					const patientID = subjIdentifier[1];
					const documentReference = await getDocumentReference(base_version, patientID);
					return documentReference;
				} else {
					if (type[1] !== CONSTANTS.LOINC.DOCUMENT_REFERENCE) {
						const message = 'This server dont support this lonic code';
						fhirError(message, 'error', 'not-supported', 'El código Loinc enviado no es soportado para este Document Reference.');
					}
					if (custodian !== dominio) {
						const message = 'This custodian is not valid';
						fhirError(message, 'error', 'invalid', 'El custodian enviado no es válido para este servidor.');
					}
				}
			} else {
				const message = 'Invalid parametes for processing';
				fhirError(message, 'error', 'invalid', 'Los parámetros enviados no son válidos');
			}
		} catch (err: any) {
			if (err instanceof ServerError) {
				throw err;
			}
			throw new ServerError(err.message || err, {
				resourceType: 'OperationOutcome',
				issue: [{ severity: 'error', code: err.code || 'exception', diagnostics: err.message || err }]
			});
		}
	}
};
