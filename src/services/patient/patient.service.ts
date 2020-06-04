import { buscarPacienteId, buscarPaciente } from './../../controller/patient/patient';

/**
 *
 * @param {*} args
 * @param {*} context
 * @param {*} logger
 */
export = {
	search: async (args) => {
		try {
			let { base_version } = args;
			return await buscarPaciente(base_version, args);
		} catch (err) {
			return err;
		}

	},
	searchById: async (args) => {
		try {
			let { base_version, id } = args;
			return await buscarPacienteId(base_version, id);
		} catch (err) {
			return err;
		}
	}
};







