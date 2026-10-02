import PatientService from '../../services/patient/patient.service';

/**
 * @deprecated Use PatientService.search directly
 */
export async function buscarPaciente(version: string, parameters: any, req: any) {
    return PatientService.search({ base_version: version, ...parameters }, { req });
}

/**
 * @deprecated Use PatientService.searchById directly
 */
export async function buscarPacienteId(version: string, id: string) {
    return PatientService.searchById({ base_version: version, id }, {});
}

/**
 * @deprecated Use PatientService.create directly
 */
export async function crearPaciente(base_version: string, resource: Record<string, any>) {
    try {
        // Envolvemos create para devolver el formato esperado por otros controladores
        // aunque el servicio ahora lance ServerError para el servidor FHIR.
        // Nota: Si otros controladores llaman a esto, capturarán el ServerError.
        return await PatientService.create({ base_version, resource }, { req: { body: resource } });
    } catch (err) {
        if (err.statusCode === 200 || err.statusCode === 201) {
            // Transformamos el error informativo del servicio en el objeto de resultado esperado
            return {
                existingPatient: err.statusCode === 200,
                patientId: err.message.split('ID: ')[1],
                patientData: err.data, // El servicio pone el recurso o data relevante aquí
                operationOutcome: err.issue
            };
        }
        throw err;
    }
}
