import { buscarPractitioner, buscarPractitionerId } from './../../controller/practitioner/practitioner';

async function search(args: any, context: any) {
    try {
        let { base_version } = args;
        if (Object.keys(args).length > 1) {
            return await buscarPractitioner(base_version, args, context.req);
        } else {
            throw { warning: 'Al menos un parámetro de entrada es requerido' };
        }
    } catch (err) {
        return err;
    }
}

async function searchById(args: any, context: any) {
    try {
        let { base_version, id } = args;
        return await buscarPractitionerId(base_version, id);
    } catch (err) {
        return err;
    }
}

const PractitionerService = {
    search,
    searchById
};

export = PractitionerService;
