import { buscarOrganizacion } from './../../controller/organization/organization';

async function search(args: any, context: any) {
	try {
		let { base_version } = args;
		if (Object.keys(args).length > 1) {
			return await buscarOrganizacion(base_version, args, context.req);
		} else {
			throw { warning: 'Se requiere enviar al menos un parámetro de búsqueda' };
		}
	} catch (err) {
		return err
	}
}

async function searchById(args: any, context: any) {
	try {
		let { base_version } = args;
		return await buscarOrganizacion(base_version, args, context.req);
	} catch (err) {
		return err
	}
}

const OrganizationService = {
	search,
	searchById
};

export = OrganizationService;