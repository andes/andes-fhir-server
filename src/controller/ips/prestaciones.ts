const { COLLECTION, CLIENT_DB } = require('./../../constants');
const globals = require('../../globals');
var moment = require('moment');

export async function getPrestaciones(paciente, { estado = 'validada', desde = null, hasta = null }) {
    const db = globals.get(CLIENT_DB);
    let collection = db.collection(`${COLLECTION.PRESTATIONS}`);
    const query = {
        'paciente.id': paciente._id, // Viene el objectId del paciente
        $where: `this.estados[this.estados.length - 1].tipo ==  "${estado}"`
    };
    if (desde || hasta) {
        query['ejecucion.fecha'] = {};
        if (desde) {
            query['ejecucion.fecha']['$gte'] = moment(desde).startOf('day').toDate();
        }
        if (hasta) {
            query['ejecucion.fecha']['$lte'] = moment(hasta).endOf('day').toDate();
        }
    }
    return await collection.find(query).toArray();
}

export function filtrarRegistros(prestaciones: any[], { semanticTags }) {
    let registrosMedicos = [];
    let prestacionMedicamentos = [];
    prestaciones.forEach(prestacion => {
        prestacion.ejecucion.registros.forEach(registro => {
            if (registro.concepto.semanticTag === 'producto' || registro.concepto.semanticTag === 'fármaco de uso clínico') {
                prestacionMedicamentos = [...prestacionMedicamentos, registro]
            } else {
                const semTag = registro.concepto.semanticTag;
                const exist = semanticTags.find(el => el === semTag);
                if (exist) {
                    registrosMedicos = [...registrosMedicos, registro];
                }
            }
        });
    });
    return { registrosMedicos, prestacionMedicamentos }
}