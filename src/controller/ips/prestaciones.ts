import { CONSTANTS } from './../../constants';
const globals = require('../../globals');
var moment = require('moment');

export async function getPrestaciones(paciente, { estado = 'validada', desde = null, hasta = null }) {
    const db = globals.get(CONSTANTS.CLIENT_DB);
    let collection = db.collection(CONSTANTS.COLLECTION.PRESTATIONS);
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

export function filtrarRegistros(prestaciones: any[], { semanticTags }, snomedAlergias) {
    let registrosMedicos = [];
    let prestacionMedicamentos = [];
    let registrosAlergias = [];
    // Busco los descenientes de las alergias a sustancias
    prestaciones.forEach(prestacion => {
        prestacion.ejecucion.registros.forEach(registro => {
            if (registro.concepto.semanticTag === 'producto' || registro.concepto.semanticTag === 'fármaco de uso clínico') {
                // prestacionMedicamentos = [...prestacionMedicamentos, registro]
            } else {
                const alergia = snomedAlergias.find(al => al.conceptId === registro.concepto.conceptId);
                const semTag = registro.concepto.semanticTag;
                const exist = semanticTags.find(el => el === semTag);
                if (alergia) {
                    registrosAlergias = [...registrosAlergias, registro];
                } else if (exist) {
                    registrosMedicos = [...registrosMedicos, registro];
                }

            }
        });
    });
    return { registrosMedicos, prestacionMedicamentos, registrosAlergias }
}