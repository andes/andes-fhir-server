import { ServerError } from '@bluehalo/node-fhir-server-core';
import { ips } from './../../controller/ips/ips';

export = {
	searchById: async (args: any) => {
		try {
			// verify token IPS
			const { base_version, id } = args;
			if (id) {
				return await ips(base_version, id);
			} else {
				return null;
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
