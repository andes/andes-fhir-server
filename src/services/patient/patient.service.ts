
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
			let { base_version } = args;
			if (Object.keys(args).length > 1) {
				return await buscarPaciente(base_version, args);
			} else {
				throw { warning: 'Se requiere enviar al menos un parametro de búsqueda' };
			}
		} catch (err) {
			return err;
		}

	},
	searchById: async (args, context) => {
		try {
			let { base_version, id } = args;
			return await buscarPacienteId(base_version, id);
		} catch (err) {
			return err;
		}
	}
};




