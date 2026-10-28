import { ServerError } from '@bluehalo/node-fhir-server-core';
import { buscarOrganizacion, buscarOrganizacionId } from './../../controller/organization/organization';

async function search(args: any, context: any) {
	try {
		const { base_version } = args;
		const searchParams = Object.keys(args).filter(
			key => key !== 'base_version' && args[key] !== undefined && args[key] !== ''
		);
		if (searchParams.length > 0) {
			return await buscarOrganizacion(base_version, args, context.req);
		} else {
			throw new ServerError('Se requiere enviar al menos un parámetro de búsqueda', {
				resourceType: 'OperationOutcome',
				issue: [{ severity: 'warning', code: 'required', diagnostics: 'Se requiere enviar al menos un parámetro de búsqueda' }]
			});
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

async function searchById(args: any, _context: any) {
	try {
		const { base_version, id } = args;
		return await buscarOrganizacionId(base_version, id);
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

const OrganizationService = {
	search,
	searchById
};

export = OrganizationService;