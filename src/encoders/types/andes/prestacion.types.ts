export type AndesSemanticTag =
    | 'objeto físico'
    | 'estructura corporal'
    | 'espécimen'
    | 'hallazgo'
    | 'sustancia'
    | 'concepto especial'
    | 'medio ambiente / localización'
    | 'metadato'
    | 'contexto social'
    | 'entidad observable'
    | 'procedimiento'
    | 'calificador'
    | 'fuerza física'
    | 'escala de estadificación'
    | 'elemento de registro'
    | 'producto'
    | 'evento'
    | 'organismo'
    | 'situación'
    | 'trastorno'
    | 'régimen/tratamiento'
    | 'medio ambiente'
    | 'medicamento clínico'
    | 'fármaco de uso clínico'
    | 'persona'
    | 'plan'
    | string;

export interface AndesSnomedConcept {
    id?: string;
    _id?: string;
    conceptId: string;
    term: string;
    fsn?: string;
    semanticTag?: AndesSemanticTag;
    noNominalizada?: boolean;
}

export type AndesPrestacionEstadoTipo =
    | 'anulada'
    | 'pendiente'
    | 'ejecucion'
    | 'auditoria'
    | 'aceptada'
    | 'rechazada'
    | 'validada'
    | 'desvinculada'
    | 'modificada'
    | 'asignada'
    | 'vencida'
    | 'resuelta'
    | string;

export interface AndesPrestacionEstado {
    tipo: AndesPrestacionEstadoTipo;
    idOrigenModifica?: string | null;
    motivoRechazo?: string | null;
    observaciones?: string | null;
    createdAt?: Date | string;
    createdBy?: any;
    updatedAt?: Date | string;
    updatedBy?: any;
}

export interface AndesPrestacionRegistroPrivacy {
    scope: 'private' | 'public' | 'termOnly' | string;
}

export interface AndesPrestacionRegistro {
    _id?: string | any;
    id?: string | any;
    nombre?: string;
    concepto: AndesSnomedConcept;
    destacado?: boolean;
    esSolicitud?: boolean;
    esDiagnosticoPrincipal?: boolean;
    params?: Record<string, any> | null;
    isEmpty?: boolean;
    privacy?: AndesPrestacionRegistroPrivacy;
    esPrimeraVez?: boolean;
    valor?: any;
    valorManual?: boolean;
    registros?: AndesPrestacionRegistro[];
    relacionadoCon?: any[];
    esCensable?: boolean;
    elementoRUP?: string | any;
    hasSections?: boolean;
    isSection?: boolean;
    noIndex?: boolean;
    idEvolucion?: string | any;
    createdAt?: Date | string;
    createdBy?: any;
    updatedAt?: Date | string;
    updatedBy?: any;
}

export interface AndesPrestacionOrganizacionRef {
    id?: string | any;
    _id?: string | any;
    nombre?: string;
}

export interface AndesPrestacionProfesionalRef {
    id?: string | any;
    _id?: string | any;
    nombre?: string;
    apellido?: string;
    documento?: string;
}

export interface AndesPrestacionSolicitud {
    fecha?: Date | string;
    ambitoOrigen?: 'ambulatorio' | 'internacion' | 'emergencia' | string;
    tipoPrestacion?: AndesSnomedConcept;
    tipoPrestacionOrigen?: AndesSnomedConcept;
    turno?: string | any;
    registros?: AndesPrestacionRegistro[];
    organizacion?: AndesPrestacionOrganizacionRef;
    organizacionOrigen?: AndesPrestacionOrganizacionRef;
    profesional?: AndesPrestacionProfesionalRef;
    profesionalOrigen?: AndesPrestacionProfesionalRef;
    prestacionOrigen?: string | any;
    historial?: any[];
    turneable?: boolean;
    reglaId?: string | any;
}

export interface AndesPrestacionEjecucion {
    fecha?: Date | string;
    organizacion?: AndesPrestacionOrganizacionRef;
    registros?: AndesPrestacionRegistro[];
    elementoRUP?: string | any;
}

export interface AndesPrestacionPacienteSub {
    id?: string | any;
    _id?: string | any;
    nombre?: string;
    apellido?: string;
    documento?: string;
    telefono?: string;
    sexo?: string;
    genero?: string;
    fechaNacimiento?: Date | string;
    idPacienteValidado?: string | any;
}

export interface AndesPrestacion {
    _id?: string | any;
    id?: string | any;
    trackId?: string | any;
    groupId?: string | any;
    inicio?: 'top' | 'agenda' | 'fuera-agenda' | 'internacion' | 'servicio-intermedio' | 'plan-indicaciones' | string;
    servicioIntermedioId?: string | any;
    paciente?: AndesPrestacionPacienteSub;
    noNominalizada?: boolean;
    estadoFacturacion?: {
        tipo?: string;
        numero?: number;
        numeroComprobante?: string;
        estado?: string;
    };
    metadata?: { key: string; valor: any }[];
    solicitud?: AndesPrestacionSolicitud;
    ejecucion?: AndesPrestacionEjecucion;
    tags?: any;
    estados?: AndesPrestacionEstado[];
    estadoActual?: AndesPrestacionEstado;
    unidadOrganizativa?: AndesSnomedConcept;
    periodosCensables?: any[];
    createdAt?: Date | string;
    createdBy?: any;
    updatedAt?: Date | string;
    updatedBy?: any;
}
