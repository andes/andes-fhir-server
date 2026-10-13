import { getDominio, makeUrl } from './config';
import {
    Patient,
    ContactPoint,
    Address,
    HumanName,
    Identifier,
    Reference,
} from 'fhir/r4';
import {
    AndesPatient,
    AndesContacto,
    AndesDireccion,
    AndesRelacion
} from '../types/andes/patient.types';
import { mapAndesRankingToFhirRank, mapFhirRankToAndesRanking } from '../utils/rankingMapping';
import { FhirIdentifierSystems } from '../constants/identifier-systems';

/**
 * Helpers
 */

function formatDateOnly(value?: string | Date): string | undefined {
    if (!value) return undefined;
    const d = typeof value === 'string' ? new Date(value) : value;
    if (isNaN(d.getTime())) return undefined;
    return d.toISOString().slice(0, 10);
}

function formatDateTime(value?: string | Date): string | undefined {
    if (!value) return undefined;
    const d = typeof value === 'string' ? new Date(value) : value;
    if (isNaN(d.getTime())) return undefined;
    return d.toISOString();
}

function mapGeneroFHIRToAndes(gender?: Patient['gender']): string | undefined {
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
function mapSexoAndesToGenderFHIR(sexo?: string): Patient['gender'] | undefined {
    switch (sexo) {
        case 'femenino':
            return 'female';
        case 'masculino':
            return 'male';
        case 'otro':
            return 'other';
        default:
            return undefined; // unknown
    }
}


function buildGenderIdentityExtension(genero?: string) {
    if (!genero) {
        return [];
    }

    return [
        {
            "url": "https://andes.gob.ar/fhir/StructureDefinition/patient-genderIdentity",
            "valueCodeableConcept": {
                "coding": [
                    {
                        "system": "https://andes.gob.ar/fhir/CodeSystem/gender-identity",
                        "code": genero,
                        "display": genero
                    }
                ]
            }
        }
    ];
}

function buildStatusExtension(estado?: string | null) {
    const value = estado ?? 'temporal';
    return [{
        url: 'https://andes.gob.ar/fhir/StructureDefinition/patient-status',
        valueCode: value
    }];
}


function mapEstadoCivilAndesToFHIR(estadoCivil?: string): string {
    switch (estadoCivil) {
        case 'casado':
            return 'Married';
        case 'divorciado':
            return 'Divorced';
        case 'viudo':
            return 'Widowed';
        case 'soltero':
            return 'unmarried';
        default:
            return 'unknown';
    }
}

function mapEstadoCivilFHIRToAndes(estadoCivil?: string): string {
    switch (estadoCivil) {
        case 'Married':
            return 'casado';
        case 'Divorced':
            return 'divorciado';
        case 'Widowed':
            return 'viudo';
        case 'unmarried':
            return 'soltero';
        default:
            return 'otro';
    }
}

/**
 * Encode a patient from ANDES to FHIR
 */
export function encode(patient: AndesPatient | null | undefined): Patient | null {
    if (!patient) {
        return null;
    }

    // Identificadores
    const identificadores: Identifier[] = [];

    // Dominio local (id de ANDES o equivalente)
    identificadores.push({
        system: getDominio(),
        value: patient._id ?? patient.id
    });

    if (patient.documento) {
        identificadores.push({
            system: FhirIdentifierSystems.DNI,
            value: patient.documento
        });
    }

    if (patient.cuil) {
        identificadores.push({
            system: FhirIdentifierSystems.CUIL,
            value: patient.cuil
        });
    }

    if (patient.numeroIdentificacion) {
        if (patient.tipoIdentificacion === 'dni extranjero') {
            identificadores.push({
                system: FhirIdentifierSystems.FOREIGN_ID,
                value: patient.numeroIdentificacion
            });
        }
        if (patient.tipoIdentificacion === 'pasaporte') {
            identificadores.push({
                system: FhirIdentifierSystems.PASSPORT,
                value: patient.numeroIdentificacion
            });
        }
    }

    // Contactos → telecom
    const contactos: ContactPoint[] = (patient.contacto ?? [])
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

    // Direcciones → address
    const direcciones: Address[] = (patient.direccion ?? [])
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

    // Relaciones → contact
    const relacionesFHIR = (patient.relaciones ?? [])
        .filter((r: AndesRelacion) => !!r.relacion)
        .map((unaRelacion: AndesRelacion) => {
            return {
                relationship: [{
                    text: unaRelacion.relacion.nombre
                }],
                name: {
                    family: unaRelacion.apellido,
                    given: unaRelacion.nombre.split(' ')
                } as HumanName
            };
        });

    // Género
    // const generoFHIR = mapGeneroAndesToFHIR(patient.genero ?? patient.sexo);
    const generoFHIR = mapSexoAndesToGenderFHIR(patient.sexo ?? patient.genero as string);

    const genderIdentityExtensions = buildGenderIdentityExtension(patient.genero)
    const statusExtensions = buildStatusExtension(patient.estado);

    const birthDate = formatDateOnly(patient.fechaNacimiento);

    const extensions = [...statusExtensions, ...genderIdentityExtensions];

    const pacienteFHIR: Patient = {
        resourceType: 'Patient',
        id: patient._id ?? patient.id,
        text: {
            status: 'generated',
            div: `<div xmlns="http://www.w3.org/1999/xhtml"><p>${`${patient.nombre || ''} ${patient.apellido || ''}`.trim()}</p></div>`
        },
        identifier: identificadores,
        active: patient.activo ?? undefined,
        name: [{
            use: 'official',
            family: patient.apellido,
            given: patient.nombre.split(' '),
            text: `${patient.nombre} ${patient.apellido}`
        }],
        gender: generoFHIR,
        birthDate,
        ...(extensions.length > 0 && { extension: extensions })
    };

    if (patient.fechaFallecimiento) {
        const deceased = formatDateTime(patient.fechaFallecimiento);
        if (deceased) {
            pacienteFHIR.deceasedDateTime = deceased;
        }
    }

    if (patient.estadoCivil) {
        pacienteFHIR.maritalStatus = {
            text: mapEstadoCivilAndesToFHIR(patient.estadoCivil)
        } as any;
    }

    if (patient.foto) {
        pacienteFHIR.photo = [{ data: patient.foto }];
    }

    if (contactos.length > 0) {
        pacienteFHIR.telecom = contactos;
    }

    if (direcciones.length > 0) {
        pacienteFHIR.address = direcciones;
    }

    if (relacionesFHIR.length > 0) {
        pacienteFHIR.contact = relacionesFHIR;
    }

    if (patient.createdBy?.organizacion) {
        const managingOrganization: Reference = {
            reference: `Organization/${patient.createdBy.organizacion.id}`,
            display: patient.createdBy.organizacion.nombre
        };
        pacienteFHIR.managingOrganization = managingOrganization;
    }

    return pacienteFHIR;
}

/**
 * Decode a patient from FHIR to ANDES
 */
export function decode(patient: Patient): AndesPatient {
    let genero: string | undefined;
    let sexo: string | undefined;

    // Cuando el paciente viene por FHIR suponemos el valor del género
    genero = mapGeneroFHIRToAndes(patient.gender);
    sexo = genero;

    function getValue(
        items: { system?: string; value?: string }[] | undefined,
        key: string
    ): string | undefined {
        if (!items) return undefined;
        const element = items.find(el => el.system === key);
        return element?.value;
    }

    const tiposIdentificacion = [FhirIdentifierSystems.FOREIGN_ID, FhirIdentifierSystems.PASSPORT];
    const tipoAndes = ['dni extranjero', 'pasaporte'];
    let tipoIdentificacion: string | undefined;
    let numeroIdentificacion: string | undefined;

    for (let i = 0; i < tiposIdentificacion.length; i++) {
        const val = getValue(patient.identifier, tiposIdentificacion[i]);
        if (val) {
            tipoIdentificacion = tipoAndes[i];
            numeroIdentificacion = val;
        }
    }

    const firstName = patient.name?.[0];

    const nombre = firstName
        ? (firstName.given ?? []).join(' ').trim()
        : '';

    const apellido = firstName
        ? (Array.isArray(firstName.family)
            ? firstName.family.join(' ').trim()
            : (firstName.family ?? ''))
        : '';

    const pacienteAndes: AndesPatient = {
        id: getValue(patient.identifier, makeUrl('Patient')) ?? patient.id,
        documento: getValue(patient.identifier, FhirIdentifierSystems.DNI),
        tipoIdentificacion,
        numeroIdentificacion,
        nombre,
        apellido,
        fechaNacimiento: patient.birthDate,
        genero,
        sexo,
        estado: 'temporal'
    };

    const contactos = patient.telecom
        ? patient.telecom.map((unContacto: ContactPoint) => {
            const cont: any = {
                valor: unContacto.value,
                ranking: mapFhirRankToAndesRanking(unContacto.rank)
            };
            switch (unContacto.system) {
                case 'phone':
                    cont.tipo = 'celular';
                    break;
                case 'email':
                    cont.tipo = 'email';
                    break;
            }
            return cont;
        })
        : [];

    const relaciones = patient.contact
        ? patient.contact.map((aContact): AndesRelacion => {
            const relText = aContact.relationship?.[0]?.text ?? '';
            const givenName = (aContact.name?.given ?? []).join(' ').replace(',', ' ');
            const familyName = Array.isArray(aContact.name?.family)
                ? (aContact.name?.family as string[]).join(' ').replace(',', ' ')
                : (aContact.name?.family as string | undefined) ?? '';

            return {
                relacion: { nombre: relText },
                nombre: givenName,
                apellido: familyName
            };
        })
        : [];

    if (patient.maritalStatus?.text) {
        pacienteAndes.estadoCivil = mapEstadoCivilFHIRToAndes(patient.maritalStatus.text);
    }

    const direcciones = patient.address
        ? patient.address.map((unaDireccion): any => {
            const valor = Array.isArray(unaDireccion.line)
                ? (unaDireccion.line[0] ?? '')
                : (unaDireccion.line as string | undefined) ?? '';

            const dir = {
                activo: true,
                valor,
                codigoPostal: unaDireccion.postalCode,
                ubicacion: {
                    pais: unaDireccion.country,
                    provincia: unaDireccion.state,
                    localidad: unaDireccion.city
                }
            };
            return dir;
        })
        : [];

    pacienteAndes.direccion = direcciones;

    if (patient.active !== undefined) {
        pacienteAndes.activo = patient.active;
    }

    if (contactos.length > 0) {
        pacienteAndes.contacto = contactos;
    }

    if (patient.photo && patient.photo.length > 0) {
        pacienteAndes.foto = patient.photo[0].data as any;
    }

    if (relaciones.length > 0) {
        pacienteAndes.relaciones = relaciones;
    }

    if (patient.managingOrganization) {
        pacienteAndes.createdBy = {
            organizacion: {
                id: patient.managingOrganization.reference ?? '',
                nombre: patient.managingOrganization.display ?? ''
            }
        };
    }

    return pacienteAndes;
}

/**
 * Verify if a patient has a FHIR format
 */
export function verify(patient: any): boolean {
    let respuesta = true;
    const fieldVerified = Object.keys(patient).every(pacienteFHIRFields);

    if (fieldVerified) {
        respuesta = ('resourceType' in patient) && patient.resourceType === 'Patient';
        respuesta = respuesta && ('identifier' in patient);
        if (patient.identifier?.length > 0) {
            patient.identifier.forEach((anIdentifier: any) => {
                respuesta = respuesta && Object.keys(anIdentifier).every(identifierFields);
            });
        }
        patient.name?.forEach((aName: any) => {
            respuesta = respuesta && validName(aName);
        });
        if (patient.active !== undefined) {
            respuesta = respuesta && (typeof patient.active === 'boolean');
        }
        if (patient.telecom) {
            patient.telecom.forEach((aTelecom: any) => {
                respuesta = respuesta && Object.keys(aTelecom).every(telecomFields);
            });
        }
        if (patient.gender) {
            respuesta = respuesta && (patient.gender as string).match('male|female|other|unknown') != null;
        }
        if (patient.birthDate) {
            respuesta = respuesta && typeof patient.birthDate === 'string';
        }
        if (patient.deceasedDateTime) {
            respuesta = respuesta && typeof patient.deceasedDateTime === 'string';
        }
        if (patient.address) {
            patient.address.forEach((anAddress: any) => {
                respuesta = respuesta && Object.keys(anAddress).every(addressFields);
            });
        }
        if (patient.maritalStatus && patient.maritalStatus.text) {
            respuesta = respuesta &&
                Object.keys(patient.maritalStatus).every(codingFields) &&
                typeof patient.maritalStatus.text === 'string' &&
                patient.maritalStatus.text.match('Married|Divorced|Widowed|unmarried|unknown') != null;
        }
        if (patient.photo) {
            patient.photo.forEach((aPhoto: any) => {
                respuesta = respuesta && Object.keys(aPhoto).every(photoFields);
            });
        }
        if (patient.contact) {
            patient.contact.forEach((aContact: any) => {
                if (aContact.relationship) {
                    aContact.relationship.forEach((aRelation: any) => {
                        respuesta = respuesta && Object.keys(aRelation).every(codingFields);
                    });
                }
                if (aContact.name) {
                    respuesta = respuesta && validName(aContact.name);
                }
            });
        }
    } else {
        respuesta = fieldVerified;
    }

    return respuesta;
}

/**
 * Verify helpers
 */

function pacienteFHIRFields(elem: string): boolean {
    return elem.match('resourceType|identifier|active|name|telecom|gender|birthDate|deceasedBoolean|deceasedDateTime|address|maritalStatus|photo|contact') != null;
}

function identifierFields(elem: string): boolean {
    return elem.match('use|type|system|value|period|assigner') != null;
}

function nameFields(elem: string): boolean {
    return elem.match('resourceType|family|given') != null;
}

function telecomFields(elem: string): boolean {
    return elem.match('resourceType|system|value|use|rank|period') != null;
}

function addressFields(elem: string): boolean {
    return elem.match('resourceType|use|type|text|line|city|district|state|postalCode|country|period') != null;
}

function codingFields(elem: string): boolean {
    return elem.match('coding|text') != null;
}

function photoFields(elem: string): boolean {
    return elem.match('contentType|language|data|url|size|hash|title|creation') != null;
}

function validName(aName: any): boolean {
    return Object.keys(aName).every(nameFields) &&
        ('resourceType' in aName) && aName.resourceType === 'HumanName' &&
        ('family' in aName) && Array.isArray(aName.family) && aName.family.every(areStrings) &&
        ('given' in aName) && Array.isArray(aName.given) && aName.given.every(areStrings);
}

function areStrings(elem: unknown): boolean {
    return typeof elem === 'string';
}
