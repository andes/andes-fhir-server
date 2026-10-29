import {
    RelatedPerson,
    ContactPoint,
    Address,
    Identifier,
    CodeableConcept,
} from 'fhir/r4';
import {
    AndesPatient,
    AndesContacto,
    AndesDireccion,
    AndesRelacion
} from '../types/andes/patient.types';
import { mapAndesRankingToFhirRank } from '../utils/rankingMapping';
import { formatFHIRDate } from '../utils/fhirDate';
import { escapeHtml } from '../utils/escapeHtml';
import { FhirIdentifierSystems, resolveIdentifierSystem } from '../../constants';
import { makeUrl } from './config';

const HL7_ROLE_CODE_SYSTEM = 'http://terminology.hl7.org/CodeSystem/v3-RoleCode';

interface RoleMapping {
    code: string;
    display: string;
    andesNombre: string;
    andesOpuesto: string;
    esConviviente: boolean;
}

const RELATIONSHIP_MAP: Record<string, RoleMapping> = {
    'hijo/a': { code: 'CHILD', display: 'child', andesNombre: 'hijo/a', andesOpuesto: 'progenitor/a', esConviviente: false },
    'hijo': { code: 'CHILD', display: 'child', andesNombre: 'hijo/a', andesOpuesto: 'progenitor/a', esConviviente: false },
    'hija': { code: 'CHILD', display: 'child', andesNombre: 'hijo/a', andesOpuesto: 'progenitor/a', esConviviente: false },
    'progenitor/a': { code: 'PRN', display: 'parent', andesNombre: 'progenitor/a', andesOpuesto: 'hijo/a', esConviviente: false },
    'padre': { code: 'PRN', display: 'parent', andesNombre: 'progenitor/a', andesOpuesto: 'hijo/a', esConviviente: false },
    'madre': { code: 'PRN', display: 'parent', andesNombre: 'progenitor/a', andesOpuesto: 'hijo/a', esConviviente: false },
    'hermano/a': { code: 'SIB', display: 'sibling', andesNombre: 'hermano/a', andesOpuesto: 'hermano/a', esConviviente: false },
    'hermano': { code: 'SIB', display: 'sibling', andesNombre: 'hermano/a', andesOpuesto: 'hermano/a', esConviviente: false },
    'hermana': { code: 'SIB', display: 'sibling', andesNombre: 'hermano/a', andesOpuesto: 'hermano/a', esConviviente: false },
    'tutor': { code: 'GUARD', display: 'guardian', andesNombre: 'tutor', andesOpuesto: 'tutor', esConviviente: false },
    'tutor/a': { code: 'GUARD', display: 'guardian', andesNombre: 'tutor', andesOpuesto: 'tutor', esConviviente: false },
    'conyuge': { code: 'SPS', display: 'spouse', andesNombre: 'conyuge', andesOpuesto: 'conyuge', esConviviente: true },
    'cónyuge': { code: 'SPS', display: 'spouse', andesNombre: 'conyuge', andesOpuesto: 'conyuge', esConviviente: true },
    'conviviente': { code: 'SPS', display: 'spouse', andesNombre: 'conviviente', andesOpuesto: 'conviviente', esConviviente: true },
    'abuelo/a': { code: 'GRPRN', display: 'grandparent', andesNombre: 'abuelo/a', andesOpuesto: 'nieto/a', esConviviente: false },
    'nieto/a': { code: 'GRNDCHILD', display: 'grandchild', andesNombre: 'nieto/a', andesOpuesto: 'abuelo/a', esConviviente: false },
    'otro': { code: 'OTH', display: 'other', andesNombre: 'otro', andesOpuesto: 'otro', esConviviente: false },
};

const CODE_TO_ANDES_MAP: Record<string, { nombre: string; opuesto: string; esConviviente: boolean }> = {
    CHILD: { nombre: 'hijo/a', opuesto: 'progenitor/a', esConviviente: false },
    CHD: { nombre: 'hijo/a', opuesto: 'progenitor/a', esConviviente: false },
    SON: { nombre: 'hijo/a', opuesto: 'progenitor/a', esConviviente: false },
    DAU: { nombre: 'hijo/a', opuesto: 'progenitor/a', esConviviente: false },
    PRN: { nombre: 'progenitor/a', opuesto: 'hijo/a', esConviviente: false },
    MTH: { nombre: 'progenitor/a', opuesto: 'hijo/a', esConviviente: false },
    FTH: { nombre: 'progenitor/a', opuesto: 'hijo/a', esConviviente: false },
    SIB: { nombre: 'hermano/a', opuesto: 'hermano/a', esConviviente: false },
    GUARD: { nombre: 'tutor', opuesto: 'tutor', esConviviente: false },
    SPS: { nombre: 'conyuge', opuesto: 'conyuge', esConviviente: true },
    GRPRN: { nombre: 'abuelo/a', opuesto: 'nieto/a', esConviviente: false },
    GRNDCHILD: { nombre: 'nieto/a', opuesto: 'abuelo/a', esConviviente: false },
    OTH: { nombre: 'otro', opuesto: 'otro', esConviviente: false },
};

function mapSexoAndesToGenderFHIR(sexo?: string): RelatedPerson['gender'] | undefined {
    switch (sexo?.toLowerCase()) {
        case 'femenino':
        case 'female':
            return 'female';
        case 'masculino':
        case 'male':
            return 'male';
        case 'otro':
        case 'other':
            return 'other';
        default:
            return undefined;
    }
}

function mapGenderFHIRToSexoAndes(gender?: RelatedPerson['gender']): string | undefined {
    switch (gender) {
        case 'female':
            return 'femenino';
        case 'male':
            return 'masculino';
        case 'other':
            return 'otro';
        default:
            return undefined;
    }
}

export function buildRelationshipConcept(nombreRelacion?: string): CodeableConcept {
    const key = (nombreRelacion ?? 'otro').trim().toLowerCase();
    const mapped = RELATIONSHIP_MAP[key] ?? RELATIONSHIP_MAP['otro'];
    return {
        coding: [
            {
                system: HL7_ROLE_CODE_SYSTEM,
                code: mapped.code,
                display: mapped.display,
            }
        ],
        text: nombreRelacion || mapped.andesNombre,
    };
}

export function matchesRelationshipFilter(relacionNombre: string | undefined, filterValue: string): boolean {
    if (!filterValue) {
        return true;
    }
    const rawTarget = filterValue.includes('|') ? filterValue.split('|')[1] : filterValue;
    const targetLower = rawTarget.trim().toLowerCase();
    const targetUpper = rawTarget.trim().toUpperCase();
    const currentNombre = (relacionNombre ?? '').trim().toLowerCase();

    if (currentNombre === targetLower) {
        return true;
    }
    const concept = buildRelationshipConcept(relacionNombre);
    return (concept.coding ?? []).some(c => c.code?.toUpperCase() === targetUpper);
}

/**
 * Codifica una relación de un paciente de Andes (opcionalmente enriquecida con el documento del paciente relacionado)
 * a un recurso FHIR RelatedPerson.
 */
export function encode(
    patient: AndesPatient | null | undefined,
    relacion: AndesRelacion | null | undefined,
    relatedPatient?: AndesPatient | null
): RelatedPerson | null {
    if (!patient || !relacion) {
        return null;
    }

    const patientId = String(patient._id ?? patient.id ?? '');
    if (!patientId) {
        return null;
    }

    const relId = String(
        relacion._id ??
        relacion.referencia ??
        relatedPatient?._id ??
        relatedPatient?.id ??
        `${patientId}-rel`
    );

    const identifiers: Identifier[] = [];
    const andesRefId = relacion.referencia ?? relatedPatient?._id ?? relatedPatient?.id ?? relacion._id;
    if (andesRefId) {
        identifiers.push({
            system: FhirIdentifierSystems.ANDES_ID,
            value: String(andesRefId)
        });
    }

    const documento = relatedPatient?.documento || relacion.documento;
    if (documento) {
        identifiers.push({
            system: FhirIdentifierSystems.DNI,
            value: String(documento)
        });
    }

    if (relatedPatient?.cuil) {
        identifiers.push({
            system: FhirIdentifierSystems.CUIL,
            value: String(relatedPatient.cuil)
        });
    }

    const tipoIdent = relatedPatient?.tipoIdentificacion ?? relacion.tipoIdentificacion;
    const nroIdent = relatedPatient?.numeroIdentificacion ?? relacion.numeroIdentificacion;
    if (tipoIdent && nroIdent) {
        let system: string | undefined;
        switch (tipoIdent) {
            case 'pasaporte':
                system = FhirIdentifierSystems.PASSPORT;
                break;
            case 'dni extranjero':
                system = FhirIdentifierSystems.FOREIGN_ID;
                break;
        }
        if (system) {
            identifiers.push({
                system,
                value: String(nroIdent)
            });
        }
    }

    const nombre = (relatedPatient?.nombre || relacion.nombre || '').trim();
    const apellido = (relatedPatient?.apellido || relacion.apellido || '').trim();
    const fullName = `${nombre} ${apellido}`.trim();

    const contactos: ContactPoint[] = (relatedPatient?.contacto ?? [])
        .filter((c: AndesContacto) => !!c.valor)
        .map((unContacto: AndesContacto): ContactPoint => {
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

    const direcciones: Address[] = (relatedPatient?.direccion ?? [])
        .filter((dir: AndesDireccion) => !!dir.ubicacion?.localidad)
        .map((unaDireccion: AndesDireccion): Address => {
            const city =
                typeof unaDireccion.ubicacion.localidad === 'object'
                    ? unaDireccion.ubicacion.localidad?.nombre
                    : unaDireccion.ubicacion.localidad;

            const state =
                typeof unaDireccion.ubicacion.provincia === 'object'
                    ? unaDireccion.ubicacion.provincia?.nombre
                    : unaDireccion.ubicacion.provincia;

            const country =
                typeof unaDireccion.ubicacion.pais === 'object'
                    ? unaDireccion.ubicacion.pais?.nombre
                    : unaDireccion.ubicacion.pais;

            const address: Address = {};
            if (unaDireccion.valor?.trim()) {
                address.line = [unaDireccion.valor.trim()];
            }
            if (unaDireccion.codigoPostal && String(unaDireccion.codigoPostal).trim()) {
                address.postalCode = String(unaDireccion.codigoPostal).trim();
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

    const gender = mapSexoAndesToGenderFHIR(
        (relatedPatient?.sexo ?? relatedPatient?.genero ?? relacion.sexo ?? relacion.genero) as string | undefined
    );
    const birthDate = formatFHIRDate(relatedPatient?.fechaNacimiento ?? relacion.fechaNacimiento);
    const active = relatedPatient?.activo ?? relacion.activo ?? true;
    const patientDisplay = `${patient.nombre || ''} ${patient.apellido || ''}`.trim();

    const relatedPersonFHIR: RelatedPerson = {
        resourceType: 'RelatedPerson',
        id: relId,
        text: {
            status: 'generated',
            div: `<div xmlns="http://www.w3.org/1999/xhtml"><p>${escapeHtml(fullName || 'Persona relacionada')}</p></div>`
        },
        ...(identifiers.length > 0 && { identifier: identifiers }),
        active,
        patient: {
            reference: `Patient/${patientId}`,
            ...(patientDisplay && { display: patientDisplay })
        },
        relationship: [buildRelationshipConcept(relacion.relacion?.nombre)],
        ...(fullName && {
            name: [{
                use: 'official',
                ...(apellido && { family: apellido }),
                given: nombre ? nombre.split(/\s+/) : [],
                text: fullName
            }]
        }),
        ...(gender && { gender }),
        ...(birthDate && { birthDate }),
    };

    if (contactos.length > 0) {
        relatedPersonFHIR.telecom = contactos;
    }

    if (direcciones.length > 0) {
        relatedPersonFHIR.address = direcciones;
    }

    const foto = relatedPatient?.foto ?? relacion.foto;
    if (foto) {
        relatedPersonFHIR.photo = [{ data: foto }];
    }

    return relatedPersonFHIR;
}

/**
 * Decodifica un recurso FHIR RelatedPerson a la estructura de relación de Andes y el ID del paciente principal.
 */
export function decode(relatedPerson: RelatedPerson): { patientId: string; relacion: AndesRelacion } {
    const rawRef = relatedPerson.patient?.reference ?? '';
    const patientId = rawRef.replace(/^(?:.*\/)?Patient\//, '').trim();

    function getValue(items: { system?: string; value?: string }[] | undefined, key: string): string | undefined {
        if (!items) {
            return undefined;
        }
        const resolvedKey = resolveIdentifierSystem(key);
        const element = items.find(el => resolveIdentifierSystem(el.system) === resolvedKey);
        return element?.value;
    }

    const firstRel = relatedPerson.relationship?.[0];
    const relCode = firstRel?.coding?.[0]?.code?.toUpperCase();
    const relText = firstRel?.text?.trim().toLowerCase();

    let relacionObj = { nombre: 'otro', opuesto: 'otro', esConviviente: false };
    if (relText && RELATIONSHIP_MAP[relText]) {
        relacionObj = {
            nombre: RELATIONSHIP_MAP[relText].andesNombre,
            opuesto: RELATIONSHIP_MAP[relText].andesOpuesto,
            esConviviente: RELATIONSHIP_MAP[relText].esConviviente
        };
    } else if (relCode && CODE_TO_ANDES_MAP[relCode]) {
        relacionObj = CODE_TO_ANDES_MAP[relCode];
    } else if (firstRel?.text) {
        const textClean = firstRel.text.trim();
        relacionObj = {
            nombre: textClean,
            opuesto: textClean,
            esConviviente: textClean.toLowerCase() === 'conviviente'
        };
    }

    const firstName = relatedPerson.name?.[0];
    const nombre = firstName ? (firstName.given ?? []).join(' ').trim() : '';
    const apellido = firstName
        ? (Array.isArray(firstName.family) ? firstName.family.join(' ').trim() : (firstName.family ?? ''))
        : '';

    let tipoIdentificacion: string | undefined;
    let numeroIdentificacion: string | undefined;
    const passportVal = getValue(relatedPerson.identifier, FhirIdentifierSystems.PASSPORT);
    const foreignVal = getValue(relatedPerson.identifier, FhirIdentifierSystems.FOREIGN_ID);
    if (passportVal) {
        tipoIdentificacion = 'pasaporte';
        numeroIdentificacion = passportVal;
    } else if (foreignVal) {
        tipoIdentificacion = 'dni extranjero';
        numeroIdentificacion = foreignVal;
    }

    const referencia =
        getValue(relatedPerson.identifier, FhirIdentifierSystems.ANDES_ID) ??
        getValue(relatedPerson.identifier, makeUrl('Patient'));

    const documento = getValue(relatedPerson.identifier, FhirIdentifierSystems.DNI);

    const sexo = mapGenderFHIRToSexoAndes(relatedPerson.gender);

    const relacion: AndesRelacion = {
        ...(relatedPerson.id && { _id: relatedPerson.id }),
        relacion: relacionObj,
        ...(referencia && { referencia }),
        ...(nombre && { nombre }),
        ...(apellido && { apellido }),
        ...(documento && { documento }),
        ...(tipoIdentificacion && { tipoIdentificacion }),
        ...(numeroIdentificacion && { numeroIdentificacion }),
        ...(relatedPerson.birthDate && { fechaNacimiento: relatedPerson.birthDate }),
        ...(sexo && { sexo, genero: sexo }),
        activo: relatedPerson.active ?? true
    };

    return { patientId, relacion };
}
