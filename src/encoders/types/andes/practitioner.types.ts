// Tipos de apoyo para PRACTITIONER de ANDES

export type AndesSexo = 'masculino' | 'femenino' | 'otro' | string;

export interface AndesContacto {
    tipo: 'fijo' | 'celular' | 'email' | string;
    valor: string;
    ranking?: number;
}

export interface AndesUbicacionLocalidad {
    nombre: string;
}

export interface AndesUbicacionProvincia {
    nombre: string;
}

export interface AndesUbicacionPais {
    nombre: string;
}

export interface AndesUbicacion {
    localidad?: AndesUbicacionLocalidad;
    provincia?: AndesUbicacionProvincia;
    pais?: AndesUbicacionPais;
}

export interface AndesDomicilio {
    valor: string;
    codigoPostal?: string;
    ubicacion?: AndesUbicacion;
}

export interface AndesRelacionTipo {
    nombre: string;
}

export interface AndesRelacion {
    relacion: AndesRelacionTipo;
    apellido: string;
    nombre: string;
}

export interface AndesMatriculaItem {
    matriculaNumero?: string;
    inicio?: string;
    fin?: string;
}

export interface AndesProfesion {
    nombre?: string;
    codigo?: string;
    tipoDeFormacion?: string;
}

export interface AndesEspecialidad {
    nombre?: string;
    codigo: {
        sisa: string;
    };
}

export interface AndesFormacionGrado {
    profesion: AndesProfesion;
    matriculacion?: AndesMatriculaItem[];
}

export interface AndesFormacionPosgrado {
    especialidad: AndesEspecialidad;
    matriculacion?: AndesMatriculaItem[];
}

export interface AndesPractitioner {
    _id: string;

    documento?: string;
    cuit?: string;

    nombre: string;
    apellido: string;

    sexo?: AndesSexo;
    fechaNacimiento?: string;

    contacto?: AndesContacto[];
    domicilios?: AndesDomicilio[];
    relaciones?: AndesRelacion[];

    formacionGrado?: AndesFormacionGrado[];
    formacionPosgrado?: AndesFormacionPosgrado[];

    habilitado?: boolean;
    foto?: string;
}
