
export interface AndesCodigoOrg {
    sisa?: string;
    cuie?: string;
    remediar?: string;
    sips?: string;
}

export interface AndesUbicacionOrg {
    localidad?: { nombre: string };
    provincia?: { nombre: string };
    pais?: { nombre: string };
}

export interface AndesDireccionOrg {
    valor: string;
    codigoPostal?: string;
    ubicacion: AndesUbicacionOrg;
}

export interface AndesContactoOrg {
    tipo: 'fijo' | 'celular' | 'email' | string;
    valor: string;
    ranking?: number;
}

export interface AndesOrganization {
    _id?: string;
    id?: string;

    nombre?: string;
    activo?: boolean;

    tipoEstablecimiento?: { nombre: string };

    codigo: AndesCodigoOrg;
    direccion?: AndesDireccionOrg;
    contacto?: AndesContactoOrg[];
}
