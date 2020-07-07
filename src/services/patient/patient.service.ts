
import { buscarPacienteId, buscarPaciente } from './../../controller/patient/patient';
import { Permissions } from './../../lib/permissions';

const p = Permissions;

/**
 *
 * @param {*} args
 * @param {*} context
 * @param {*} logger
 */

export = {
	search: async (args, context) => {
		try {
			if (context && context.req.authInfo) {
				const scope = context.req.authInfo.scope;
				if (!p.check(scope, 'fhir:patient:read')) {
					// TODO: Usar el handler de errores del core
					return { unauthorized: 403 }
				}
			}
			let { base_version } = args;
			return await buscarPaciente(base_version, args);
		} catch (err) {
			return err;
		}

	},
	searchById: async (args, context) => {
		try {
			if (context && context.req.authInfo) {
				const scope = context.req.authInfo.scope;
				if (!p.check(scope, 'fhir:patient:read')) {
					// TODO: Usar el handler de errores del core
					return { unauthorized: 403 }
				}
			}
			let { base_version, id } = args;
			return await buscarPacienteId(base_version, id);
		} catch (err) {
			return err;
		}
	}
};







