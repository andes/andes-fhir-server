import { CONSTANTS } from '../../constants';
import globals from '../../globals';

function startOfDay(date: string | Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}

function endOfDay(date: string | Date): Date {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
}

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
            query['ejecucion.fecha']['$gte'] = startOfDay(desde);
        }
        if (hasta) {
            query['ejecucion.fecha']['$lte'] = endOfDay(hasta);
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