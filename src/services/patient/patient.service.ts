import { ServerError } from '@asymmetrik/node-fhir-server-core';
import { Permissions } from './../../lib/permissions';

const { buscarPacienteId, buscarPaciente, crearPaciente } = require('./../../controller/patient/patient');
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
	},
	create: async (args, context) => {
		try {
			let { base_version, resource } = args;
			const req = context.req;
			const resultado = await crearPaciente(base_version, req.body);

			if (resultado.existingPatient) {
				throw new ServerError(
					`El paciente ya existe. ID: ${resultado.patientId}`,
					{
						resourceType: 'OperationOutcome',
						issue: [{ severity: 'information', code: 'informational', diagnostics: `El paciente ya existe. ID: ${resultado.patientId}` }],
						data: resultado.operationOutcome?.data
					}
				);
			}
			return resultado.patientData;
		} catch (err) {
			throw err;
		}
	}

};
