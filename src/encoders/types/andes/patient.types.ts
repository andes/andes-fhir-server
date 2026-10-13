export type AndesSexo = 'femenino' | 'masculino' | 'otro' | string;
export type AndesGenero = 'mujer' | 'mujer trans' | 'varon' | 'varon trans' | 'no binario' | 'travesti' | 'masculinidad trans' | 'femenino' | 'masculino' | 'otro' | string;

export interface AndesContacto {
    tipo: 'fijo' | 'celular' | 'email' | string;
    valor: string;
    ranking?: number;
}

export interface AndesUbicacionNombre {
    nombre: string;
}

export interface AndesUbicacion {
    // En Andes a veces viene como objeto { nombre }, a veces como string
    localidad?: AndesUbicacionNombre | string;
    provincia?: AndesUbicacionNombre | string;
    pais?: AndesUbicacionNombre | string;
}

export interface AndesDireccion {
    activo?: boolean;
    valor: string;
    codigoPostal?: string;
    ubicacion: AndesUbicacion;
}

export interface AndesRelacion {
    relacion: { nombre: string };
    nombre: string;
    apellido: string;
}

export interface AndesCreatedByOrganizacion {
    id: string;
    nombre: string;
}

export interface AndesCreatedBy {
    organizacion: AndesCreatedByOrganizacion;
}

export interface AndesPatient {
    _id?: string;
    id?: string;

    documento?: string;
    cuil?: string;
    tipoIdentificacion?: string | null;
    numeroIdentificacion?: string | null;

    nombre: string;
    apellido: string;

    fechaNacimiento?: string | Date;
    fechaFallecimiento?: string | Date | null;

    genero?: AndesGenero;
    sexo?: AndesSexo;
    estado?: string | null;          // validado | temporal | etc.
    activo?: boolean;

    estadoCivil?: string | null;     // casado, soltero, etc.

    contacto?: AndesContacto[];
    direccion?: AndesDireccion[];
    relaciones?: AndesRelacion[];

    foto?: string | null;

    createdBy?: AndesCreatedBy;
}
