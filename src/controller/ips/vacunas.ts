const { COLLECTION, CLIENT_DB } = require('./../../constants');
const globals = require('../../globals');

export async function getVacunas(paciente) {
    const db = globals.get(CLIENT_DB);
    let collection = db.collection(`${COLLECTION.VACCINES}`);
    const conditions = {
        documento: paciente.documento
    };
    const sort = { fechaAplicacion: -1 };
    return await collection.find(conditions).sort(sort).toArray();

};