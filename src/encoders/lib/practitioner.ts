import {
    Practitioner,
    ContactPoint,
    Address,
    Identifier,
} from 'fhir/r4';
import {
    AndesPractitioner,
    AndesContacto,
    AndesDomicilio,
    AndesFormacionGrado,
    AndesFormacionPosgrado,
    AndesRelacion
} from '../types/andes/practitioner.types';
import { formatFHIRDateTime, formatFHIRDate } from '../utils/fhirDate';
import { mapAndesRankingToFhirRank } from '../utils/rankingMapping';
import { escapeHtml } from '../utils/escapeHtml';
import { FhirIdentifierSystems } from '../../constants';

function buildPractitionerNarrative(data: AndesPractitioner) {
    const family = data.apellido ?? '';
    const given = data.nombre ?? '';
    const dni = data.documento ?? '';
    const summary = `Practitioner: ${family}, ${given}. DNI: ${dni}.`;

    return {
        status: 'generated' as const,
        div: `<div xmlns="http://www.w3.org/1999/xhtml">${escapeHtml(summary)}</div>`
    };
}

export function encode(practitioner: AndesPractitioner | null | undefined): Practitioner | null {
    const data = practitioner;

    if (!data) {
        return null;
    }

    // -----------------------------
    // Identificadores
    // -----------------------------
    const identificadores: Identifier[] = [];

    if (data.documento) {
        identificadores.push({
            system: FhirIdentifierSystems.DNI,
            value: data.documento
        });
    }

    if (data.cuit) {
        identificadores.push({
            system: FhirIdentifierSystems.CUIT,
            value: data.cuit
        });
    }

    identificadores.push({
        system: FhirIdentifierSystems.ANDES_ID,
        value: data._id
    });

    // -----------------------------
    // Contactos → telecom
    // -----------------------------
    const contactos: ContactPoint[] = (data.contacto ?? []).map((unContacto: AndesContacto): ContactPoint => {
        const cont: ContactPoint = {
            value: unContacto.valor,
            rank: mapAndesRankingToFhirRank(unContacto.ranking)
        };

        switch (unContacto.tipo) {
            case 'fijo':
            case 'celular':
                cont.system = 'phone';
                break;
            case 'email':
                cont.system = 'email';
                break;
        }

        return cont;
    });

    // -----------------------------
    // Direcciones → address
    // -----------------------------
    const direcciones: Address[] = (data.domicilios ?? []).map((unDomicilio: AndesDomicilio): Address => {
        const address: Address = {};
        const city = unDomicilio.ubicacion?.localidad?.nombre;
        const state = unDomicilio.ubicacion?.provincia?.nombre;
        const country = unDomicilio.ubicacion?.pais?.nombre;

        if (unDomicilio.valor?.trim()) {
            address.line = [unDomicilio.valor.trim()];
        }
        if (unDomicilio.codigoPostal && String(unDomicilio.codigoPostal).trim()) {
            address.postalCode = String(unDomicilio.codigoPostal).trim();
        }
        if (city?.trim()) {
            address.city = city.trim();
        }
        if (state?.trim()) {
            address.state = state.trim();
        }
        if (country?.trim()) {
            address.country = country.trim();
        }

        return address;
    });

    // -----------------------------
    // Relaciones (hoy no se usan en Practitioner)
    // Si en algún momento van a Communication o a otro resource, ya está tipado.
    // -----------------------------
    const _relaciones: AndesRelacion[] = data.relaciones ?? [];

    // -----------------------------
    // Matriculación de grado
    // -----------------------------
    const matriculas = (data.formacionGrado ?? []).map((datosGrado: AndesFormacionGrado) => {
        const cantMatriculaciones = datosGrado.matriculacion?.length ?? 0;

        const ultima = cantMatriculaciones > 0
            ? datosGrado.matriculacion![cantMatriculaciones - 1]
            : undefined;

        const unaMatricula: any = {
            identifier: datosGrado.profesion?.nombre
                ? [{
                    system: 'https://www.saludneuquen.gob.ar/matriculacionGrado',
                    value: String(datosGrado.profesion.nombre ?? '')
                }]
                : []
        };

        if (ultima) {
            unaMatricula.code = {
                coding: [{
                    system: 'http://www.saludneuquen.gob.ar/fiscalizacion.html',
                    code: String(datosGrado.profesion?.codigo ?? ''),
                    display: String(datosGrado.profesion?.tipoDeFormacion ?? '')
                }],
                text: String(ultima.matriculaNumero ?? '')
            };

            const start = formatFHIRDateTime(ultima.inicio);
            const end = formatFHIRDateTime(ultima.fin);

            if (start || end) {
                unaMatricula.period = {};
                if (start) {
                    unaMatricula.period.start = start;
                }
                if (end) {
                    unaMatricula.period.end = end;
                }
            }
        }

        return unaMatricula;
    });

    // -----------------------------
    // Matriculación de posgrado / especialidad
    // -----------------------------
    const matriculasEspecialidad = (data.formacionPosgrado ?? []).map((datosPosgrado: AndesFormacionPosgrado) => {
        const cantMatriculacionesEsp = datosPosgrado.matriculacion?.length ?? 0;

        const ultima = cantMatriculacionesEsp > 0
            ? datosPosgrado.matriculacion![cantMatriculacionesEsp - 1]
            : undefined;

        const unaMatricula: any = {
            identifier: datosPosgrado.especialidad?.nombre
                ? [{
                    system: 'https://www.saludneuquen.gob.ar/matriculacionEspecialidad/',
                    value: String(datosPosgrado.especialidad.nombre ?? '')
                }]
                : []
        };

        if (ultima) {
            unaMatricula.code = {
                coding: [{
                    system: 'http://www.saludneuquen.gob.ar/fiscalizacion.html',
                    code: String(datosPosgrado.especialidad?.codigo?.sisa ?? ''),
                    display: String(datosPosgrado.especialidad?.nombre ?? '')
                }],
                text: String(ultima.matriculaNumero ?? '')
            };

            const start = formatFHIRDateTime(ultima.inicio);
            const end = formatFHIRDateTime(ultima.fin);

            if (start || end) {
                unaMatricula.period = {};
                if (start) {
                    unaMatricula.period.start = start;
                }
                if (end) {
                    unaMatricula.period.end = end;
                }
            }
        }

        return unaMatricula;
    });

    // -----------------------------
    // Género
    // -----------------------------
    let genero: Practitioner['gender'] | undefined;

    if (data.sexo) {
        switch (data.sexo.toLowerCase()) {
            case 'femenino':
                genero = 'female';
                break;
            case 'masculino':
                genero = 'male';
                break;
            case 'otro':
                genero = 'other';
                break;
            default:
                genero = undefined;
                break;
        }
    }

    // -----------------------------
    // Practitioner FHIR
    // -----------------------------
    const profesionalFHIR: Practitioner = {
        resourceType: 'Practitioner',
        id: data._id,
        text: buildPractitionerNarrative(data),
        identifier: identificadores,
        active: data.habilitado ?? undefined,
        name: [{
            family: data.apellido,
            given: data.nombre?.split(' ') ?? []
        }],
        gender: genero,
        birthDate: formatFHIRDate(data.fechaNacimiento),
    };

    if (contactos.length > 0) {
        profesionalFHIR.telecom = contactos;
    }

    if (direcciones.length > 0) {
        profesionalFHIR.address = direcciones;
    }

    const todasLasMatriculas = [...matriculas, ...matriculasEspecialidad].filter(m => m);
    if (todasLasMatriculas.length > 0) {
        // usamos any porque la definición de qualification en fhir/r4
        // es más estricta que lo que trae Andes (code requerido, etc.)
        profesionalFHIR.qualification = todasLasMatriculas as any;
    }

    if (data.foto) {
        profesionalFHIR.photo = [{
            data: data.foto
        }];
    }

    return profesionalFHIR;
}
