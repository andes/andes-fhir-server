import { ObjectId } from 'mongodb';
import {
    AllergyIntolerance,
    Bundle,
    Composition,
    Condition,
    Device,
    Immunization,
    Medication,
    MedicationStatement,
    Patient as fhirPac
} from '@andes/fhir';
import { resolveSchema, ServerError } from '@bluehalo/node-fhir-server-core';
import { buscarOrganizacionSisa } from '../../controller/organization/organization';
import { ApiAndes } from '../../utils/apiAndesQuery';
import { createResource, fullurl } from '../../utils/data.util';
import { FhirIdentifierSystems } from '../../constants';
import PrestationRepository from '../../repositories/prestation.repository';
import VaccineRepository from '../../repositories/vaccine.repository';

const getMedication = (base_version: string) => resolveSchema(base_version, 'medication');
const getMedicationStatement = (base_version: string) => resolveSchema(base_version, 'medicationstatement');
const getAllergyIntolerance = (base_version: string) => resolveSchema(base_version, 'allergyintolerance');
const getPatientSchema = (base_version: string) => resolveSchema(base_version, 'Patient');

function filtrarDuplicados(registros: any[]): any[] {
    const mapping: Record<string, any> = {};
    registros.sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }).forEach((registro) => {
        const conceptId = registro.concepto?.conceptId;
        if (conceptId && !mapping[conceptId]) {
            mapping[conceptId] = registro;
        }
    });
    return Object.values(mapping);
}

function filtrarRegistrosClinicos(prestaciones: any[], semanticTags: string[], snomedAlergias: any[] = []) {
    let registrosMedicos: any[] = [];
    let prestacionMedicamentos: any[] = [];
    let registrosAlergias: any[] = [];

    prestaciones.forEach(prestacion => {
        if (!prestacion.ejecucion?.registros) {
            return;
        }
        prestacion.ejecucion.registros.forEach((registro: any) => {
            const semTag = registro.concepto?.semanticTag;
            if (semTag === 'producto' || semTag === 'fármaco de uso clínico') {
                // Actualmente no se incluyen fármacos desde prestaciones directamente
            } else {
                const alergia = snomedAlergias.find(al => al.conceptId === registro.concepto?.conceptId);
                const exist = semanticTags.includes(semTag);
                if (alergia) {
                    registrosAlergias.push(registro);
                } else if (exist) {
                    registrosMedicos.push(registro);
                }
            }
        });
    });

    return { registrosMedicos, prestacionMedicamentos, registrosAlergias };
}

async function procesarMedicamentos(version: string, prestacionMedicamentos: any[], FHIRPatient: any, apiAndes: ApiAndes): Promise<any[]> {
    if (!prestacionMedicamentos || prestacionMedicamentos.length === 0) {
        return [];
    }
    const medicationSchema = getMedication(version);
    const medicationStatementSchema = getMedicationStatement(version);
    const FHIRMedicationStatement: any[] = [];

    for (const pm of prestacionMedicamentos) {
        const medicamento = await apiAndes.getSnomedByConceptId(pm.concepto.conceptId);
        const FHIRMedication = new medicationSchema(Medication.encode(medicamento));
        FHIRMedicationStatement.push(new medicationStatementSchema(MedicationStatement.encode(fullurl(FHIRPatient), fullurl(FHIRMedication), pm)));
    }
    return FHIRMedicationStatement;
}

export class IpsService {
    /**
     * Construye un International Patient Summary (IPS) FHIR Bundle tipo document
     * a partir de un paciente dado y su versión FHIR.
     */
    static async build(version: string, patientRaw: any): Promise<any> {
        if (!patientRaw) {
            throw new ServerError('Patient not found', {
                statusCode: 404,
                resourceType: 'OperationOutcome',
                issue: [
                    {
                        severity: 'error',
                        code: 'not-found',
                        diagnostics: 'Patient not found'
                    }
                ]
            });
        }

        const apiAndes = new ApiAndes();
        const pacienteId = patientRaw._id?.toString() || patientRaw.id;

        // 1. Obtener conceptos SNOMED para alergias a sustancias
        const snomedAlergias = await apiAndes.getSnomedAllergies(419199007) || [];

        // 2. Obtener organización custodio (SISA '0' -> Subsecretaría de Salud)
        const FHIRCustodian = await buscarOrganizacionSisa(version, '0');

        // 3. Obtener prestaciones validadas de la historia clínica del paciente
        const prestaciones = await PrestationRepository.findByPatientId(pacienteId);

        const semanticTags = ['trastorno', 'producto', 'fármaco de uso clínico'];
        const { registrosMedicos, prestacionMedicamentos, registrosAlergias } = filtrarRegistrosClinicos(
            prestaciones,
            semanticTags,
            Array.isArray(snomedAlergias) ? snomedAlergias : []
        );

        // 4. Obtener vacunas
        const documento = patientRaw.documento || (
            Array.isArray(patientRaw.identifier)
                ? patientRaw.identifier.find((i: any) => i.system === FhirIdentifierSystems.DNI)?.value
                : null
        );
        const vacunas = documento ? await VaccineRepository.findByDocument(documento) : [];

        // 5. Instanciar paciente en formato FHIR
        const PatientSchema = getPatientSchema(version);
        const FHIRPatient = patientRaw.resourceType === 'Patient'
            ? patientRaw
            : new PatientSchema(fhirPac.encode(patientRaw));

        const FHIRDevice = Device.encode();

        // 6. Armar secciones clínicas (Medicamentos, Alergias, Vacunas, Condiciones)
        const FHIRMedicationStatement = await procesarMedicamentos(version, prestacionMedicamentos, FHIRPatient, apiAndes);

        const AllergyIntoleranceSchema = getAllergyIntolerance(version);
        const FHIRAllergyIntolerance = registrosAlergias.length
            ? registrosAlergias.map(registro => {
                const registroNormalizado = {
                    ...registro,
                    valor: registro.valor || { fechaInicio: registro.createdAt || new Date() }
                };
                return new AllergyIntoleranceSchema(AllergyIntolerance.encode(fullurl(FHIRPatient), registroNormalizado));
            })
            : [];

        const FHIRImmunization = vacunas.length
            ? vacunas.map(vacuna => Immunization.encode(fullurl(FHIRPatient), vacuna))
            : [];

        const rs = filtrarDuplicados(registrosMedicos);
        const FHIRCondition = rs.length
            ? rs.map(registro => {
                const registroNormalizado = {
                    ...registro,
                    valor: {
                        estado: registro.valor?.estado || 'active',
                        evolucion: registro.valor?.evolucion || '',
                        ...registro.valor
                    }
                };
                return Condition.encode(fullurl(FHIRPatient), registroNormalizado);
            })
            : [];

        // 7. Generar Composition y Bundle tipo document
        const CompositionID = new ObjectId();
        const FHIRComposition = Composition.encode(
            CompositionID,
            fullurl(FHIRPatient),
            fullurl(FHIRCustodian),
            fullurl(FHIRDevice),
            FHIRMedicationStatement.map(fullurl),
            FHIRImmunization.map(fullurl),
            FHIRAllergyIntolerance.map(fullurl),
            FHIRCondition.map(fullurl)
        );

        const BundleID = new ObjectId();
        const FHIRBundle = Bundle.encode(BundleID, [
            createResource(FHIRComposition),
            createResource(FHIRPatient),
            ...FHIRMedicationStatement.map(createResource),
            ...FHIRAllergyIntolerance.map(createResource),
            ...FHIRCondition.map(createResource),
            ...FHIRImmunization.map(createResource),
            createResource(FHIRDevice),
            createResource(FHIRCustodian)
        ]);

        return FHIRBundle;
    }
}

export default IpsService;
