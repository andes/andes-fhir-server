import { makeUrl } from './config';
import {
    Organization,
    ContactPoint,
    Address,
} from 'fhir/r4';

import {
    AndesOrganization,
    AndesContactoOrg,
    AndesDireccionOrg
} from '../types/andes/organization.types';
import { mapAndesRankingToFhirRank } from '../utils/rankingMapping';
import { FhirIdentifierSystems } from '../constants/identifier-systems';

/**
 * Encode an ANDES Organization to FHIR Organization
 */
export function encode(organization: AndesOrganization | null | undefined): Organization | null {
    const data = organization;
    if (!data) return null;

    // Identificadores
    const identificadores: any[] = [];

    if (data.codigo?.sisa) {
        identificadores.push({
            system: FhirIdentifierSystems.SISA,
            value: data.codigo.sisa
        });
    }
    if (data.codigo?.cuie) {
        identificadores.push({
            system: FhirIdentifierSystems.CUIE,
            value: data.codigo.cuie
        });
    }
    if (data.codigo?.remediar) {
        identificadores.push({
            system: FhirIdentifierSystems.REMEDIAR,
            value: data.codigo.remediar
        });
    }
    if (data.codigo?.sips) {
        identificadores.push({
            system: FhirIdentifierSystems.SIPS,
            value: data.codigo.sips
        });
    }

    identificadores.push({
        system: makeUrl('Organization'),
        value: data._id ?? data.id
    });

    // Contactos → telecom
    const contactos: ContactPoint[] = (data.contacto ?? [])
        .map((item: AndesContactoOrg): ContactPoint => {
            const cp: ContactPoint = {
                value: item.valor,
                rank: mapAndesRankingToFhirRank(item.ranking)
            };
            switch (item.tipo) {
                case 'fijo':
                case 'celular':
                    cp.system = 'phone';
                    break;
                case 'email':
                    cp.system = 'email';
                    break;
            }
            return cp;
        });

    // Dirección → address
    const direcciones: Address[] = [];

    if (data.direccion) {
        const dir: AndesDireccionOrg = data.direccion;

        const address: Address = {};
        const city = dir.ubicacion?.localidad?.nombre;
        const state = dir.ubicacion?.provincia?.nombre;
        const country = dir.ubicacion?.pais?.nombre;

        if (dir.valor?.trim()) {
            address.line = [dir.valor.trim()];
        }
        if (dir.codigoPostal && String(dir.codigoPostal).trim()) {
            address.postalCode = String(dir.codigoPostal).trim();
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

        direcciones.push(address);
    }

    // Organización FHIR
    const organizacionFHIR: Organization = {
        resourceType: 'Organization',
        id: data._id ?? data.id,
        text: {
            status: 'generated',
            div: `<div xmlns="http://www.w3.org/1999/xhtml"><p>${data.nombre || 'Organización'}</p></div>`
        },
        identifier: identificadores,
        active: data.activo ?? undefined,
        name: data.nombre ?? undefined,
        type: data.tipoEstablecimiento
            ? [{
                text: data.tipoEstablecimiento.nombre
            }]
            : undefined
    };

    if (contactos.length > 0) {
        organizacionFHIR.telecom = contactos;
    }

    if (direcciones.length > 0) {
        organizacionFHIR.address = direcciones;
    }

    return organizacionFHIR;
}
