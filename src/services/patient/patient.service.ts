import { ServerError } from '@asymmetrik/node-fhir-server-core';
import { buscarPacienteId, buscarPaciente, crearPaciente } from './../../controller/patient/patient';

/**
 *
 * @param {*} args
 * @param {*} context
 * @param {*} logger
 */

/**
 * Implementación del servicio Patient en formato CommonJS,
 * compatible con node-fhir-server-core.
 */

async function search(args: any, context: any) {
	try {
		const { base_version } = args;
		if (Object.keys(args).length > 0) {
			return await buscarPaciente(base_version, args, context.req);
		} else {
			throw { warning: 'Se requiere enviar al menos un parametro de búsqueda' };
		}
	} catch (err) {
		return err;
	}
}
async function searchById(args: any, context: any) {
	try {
		const { base_version, id } = args;
		return await buscarPacienteId(base_version, id);
	} catch (err) {
		return err;
	}
}
async function create(args: any, context: any) {
	const { base_version, resource } = args;
	const req = context.req;
	const resultado = await crearPaciente(base_version, req.body);
	let resp: string;
	let statusCode: number;
	let issue: Record<string, any>[] = [];
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
		];
		data = resultado.operationOutcome?.data;
	} else {
		resp = `El paciente fue creado. ID: ${resultado.patientId}`;
		statusCode = 201;
		data = {
			system: process.env.IPS_DOMINIO,
			value: resultado.patientId
		};
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

const PatientService = {
	search,
	searchById,
	create
};

export = PatientService;
