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
			if (Object.keys(args).length > 0) {
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
			let resp: any;
			let statusCode: number;
			let issue = [];
			let data: any;
			if (resultado.existingPatient) {
				resp = `El paciente ya existe. ID: ${resultado.patientId}`;
				statusCode = 200;
				issue = [
					{
						severity: 'information',
						code: 'informational',
						diagnostics: `El paciente ya existe. ID: ${resultado.patientId}`,
					}
				]
				data = resultado.operationOutcome?.data;
			} else {
				resp = `El paciente fue creado. ID: ${resultado.patientId}`;
				statusCode = 201;
				data = {
					system: process.env.IPS_DOMINIO,
					value: resultado.patientId
				}
			}
			throw new ServerError(
				resp,
				{
					statusCode,
					resourceType: 'OperationOutcome',
					issue,
					data
				}
			);
		}
		catch (err) {
			throw err;
		}
	}
};
