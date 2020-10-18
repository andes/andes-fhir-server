import { CONSTANTS } from './../../constants';
const globals = require('../../globals');

export async function getVacunas(paciente) {
    const db = globals.get(CONSTANTS.CLIENT_DB);
    let collection = db.collection(`${CONSTANTS.COLLECTION.VACCINES}`);
    const conditions = {
        documento: paciente.documento
    };
    const sort = { fechaAplicacion: -1 };
    return await collection.find(conditions).sort(sort).toArray();

};