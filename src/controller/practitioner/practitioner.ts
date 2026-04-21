import PractitionerService from '../../services/practitioner/practitioner.service';

/**
 * @deprecated Use PractitionerService.search directly
 */
export async function buscarPractitioner(version: string, parameters: any, req: any) {
    return PractitionerService.search({ base_version: version, ...parameters }, { req });
}

/**
 * @deprecated Use PractitionerService.searchById directly
 */
export async function buscarPractitionerId(version: string, id: string) {
    return PractitionerService.searchById({ base_version: version, id }, {});
}
