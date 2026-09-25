import { SnowstormService, getSemanticTagFromFsn, SNOMED_ADVERSE_REACTIONS, SNOMED_ALLERGIES, SNOMED_INTOLERANCES, ALLERGIES_INTOLERANCES_TTL_MS } from '../../src/services/snomed/snowstorm.service';

describe('SnowstormService', () => {
    let service: SnowstormService;
    const mockHost = 'http://test-snowstorm:8080';
    const mockBranch = 'MAIN/TEST';

    beforeEach(() => {
        jest.clearAllMocks();
        service = new SnowstormService(mockHost, mockBranch);
    });

    describe('getSemanticTagFromFsn', () => {
        it('should extract semantic tag from FSN string with parentheses', () => {
            expect(getSemanticTagFromFsn('alergia a penicilina (hallazgo)')).toBe('hallazgo');
            expect(getSemanticTagFromFsn('asma (trastorno)')).toBe('trastorno');
            expect(getSemanticTagFromFsn('paracetamol 500 mg (fármaco de uso clínico)')).toBe('fármaco de uso clínico');
        });

        it('should return empty string if no parentheses or invalid format', () => {
            expect(getSemanticTagFromFsn('')).toBe('');
            expect(getSemanticTagFromFsn('sin parentesis')).toBe('');
            expect(getSemanticTagFromFsn('solo (abierto')).toBe('');
        });
    });

    describe('getConcept', () => {
        it('should fetch and normalize concept in full format', async () => {
            const mockRawConcept = {
                conceptId: '123456',
                active: true,
                moduleId: '900000000000207008',
                fsn: { term: 'amoxicilina 500 mg (fármaco de uso clínico)', lang: 'es' },
                pt: { term: 'amoxicilina 500 mg', lang: 'es' }
            };

            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                json: async () => mockRawConcept
            } as any);

            const result = await service.getConcept('123456', 'full');

            expect(global.fetch).toHaveBeenCalledWith(
                `${mockHost}/browser/${mockBranch}/concepts/123456`,
                expect.objectContaining({
                    method: 'GET',
                    headers: expect.objectContaining({
                        'Accept-Language': 'es'
                    })
                })
            );

            expect(result).toBeDefined();
            expect(result.conceptId).toBe('123456');
            expect(result.term).toBe('amoxicilina 500 mg');
            expect(result.fsn).toBe('amoxicilina 500 mg (fármaco de uso clínico)');
            expect(result.semanticTag).toBe('fármaco de uso clínico');
            expect(result.pt.term).toBe('amoxicilina 500 mg');
        });

        it('should return summary format when requested', async () => {
            const mockRawConcept = {
                conceptId: '123456',
                fsn: { term: 'amoxicilina 500 mg (fármaco de uso clínico)' },
                pt: { term: 'amoxicilina 500 mg' }
            };

            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                json: async () => mockRawConcept
            } as any);

            const result = await service.getConcept('123456', 'summary');

            expect(result).toEqual({
                conceptId: '123456',
                term: 'amoxicilina 500 mg',
                fsn: 'amoxicilina 500 mg (fármaco de uso clínico)',
                semanticTag: 'fármaco de uso clínico'
            });
        });

        it('should return null when fetch fails or response is not ok', async () => {
            global.fetch = jest.fn().mockResolvedValue({
                ok: false,
                status: 404
            } as any);

            const result = await service.getConcept('not-found');
            expect(result).toBeNull();
        });
    });

    describe('getChildren & getSnomedAllergies', () => {
        it('should query children and filter active concepts for allergies', async () => {
            const mockChildren = [
                {
                    conceptId: '419199008',
                    active: true,
                    fsn: { term: 'alergia a penicilina (hallazgo)' },
                    pt: { term: 'alergia a penicilina' }
                },
                {
                    conceptId: '419199009',
                    active: false,
                    fsn: { term: 'alergia inactiva (hallazgo)' },
                    pt: { term: 'alergia inactiva' }
                }
            ];

            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                json: async () => mockChildren
            } as any);

            const allergies = await service.getSnomedAllergies(419199007);

            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining(`${mockHost}/browser/${mockBranch}/concepts/419199007/children?limit=1000&form=inferred`),
                expect.any(Object)
            );

            expect(allergies.length).toBe(1);
            expect(allergies[0]).toEqual({
                conceptId: '419199008',
                term: 'alergia a penicilina',
                fsn: 'alergia a penicilina (hallazgo)',
                semanticTag: 'hallazgo'
            });
        });

        it('should query descendants when all: true', async () => {
            const mockDescendants = {
                items: [
                    {
                        conceptId: '999999',
                        active: true,
                        fsn: { term: 'descendiente (hallazgo)' },
                        pt: { term: 'descendiente' }
                    }
                ]
            };

            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                json: async () => mockDescendants
            } as any);

            const result = await service.getChildren('419199007', { all: true, completed: true });

            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining(`${mockHost}/${mockBranch}/concepts/419199007/descendants?limit=1000&stated=false`),
                expect.any(Object)
            );

            expect(result).toHaveLength(1);
            expect(result![0].conceptId).toBe('999999');
        });

        it('should return conceptId array when completed is false', async () => {
            const mockChildren = [
                { conceptId: '111', active: true, pt: { term: 'A' }, fsn: { term: 'A (tag)' } },
                { conceptId: '222', active: true, pt: { term: 'B' }, fsn: { term: 'B (tag)' } }
            ];

            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                json: async () => mockChildren
            } as any);

            const result = await service.getChildren('000', { completed: false });
            expect(result).toEqual(['111', '222']);
        });
    });

    describe('getSnomedIntolerances & getSnomedAllergiesAndIntolerances', () => {
        it('should query children and filter active concepts for intolerances using 782197009 by default', async () => {
            const mockChildren = [
                {
                    conceptId: '235719003',
                    active: true,
                    fsn: { term: 'intolerancia a la lactosa (trastorno)' },
                    pt: { term: 'intolerancia a la lactosa' }
                },
                {
                    conceptId: '999999999',
                    active: false,
                    fsn: { term: 'intolerancia inactiva (trastorno)' },
                    pt: { term: 'intolerancia inactiva' }
                }
            ];

            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                json: async () => mockChildren
            } as any);

            const intolerances = await service.getSnomedIntolerances();

            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining(`${mockHost}/browser/${mockBranch}/concepts/${SNOMED_INTOLERANCES}/children?limit=1000&form=inferred`),
                expect.any(Object)
            );

            expect(intolerances.length).toBe(1);
            expect(intolerances[0]).toEqual({
                conceptId: '235719003',
                term: 'intolerancia a la lactosa',
                fsn: 'intolerancia a la lactosa (trastorno)',
                semanticTag: 'trastorno'
            });
        });

        it('should call getConceptsByEcl with <<420134006 and 24 hours TTL', async () => {
            const mockEclResults = [
                { conceptId: '419199008', term: 'alergia a penicilina', fsn: 'alergia a penicilina (hallazgo)', semanticTag: 'hallazgo' },
                { conceptId: '235719003', term: 'intolerancia a la lactosa', fsn: 'intolerancia a la lactosa (trastorno)', semanticTag: 'trastorno' }
            ];
            const eclSpy = jest.spyOn(service, 'getConceptsByEcl').mockResolvedValue(mockEclResults);

            const result = await service.getSnomedAllergiesAndIntolerances();

            expect(eclSpy).toHaveBeenCalledWith(`<<${SNOMED_ADVERSE_REACTIONS}`, {
                bypassCache: false,
                ttlMs: ALLERGIES_INTOLERANCES_TTL_MS
            });
            expect(result).toEqual(mockEclResults);
        });
    });

    describe('getConceptsByEcl', () => {
        it('should fetch concepts with ECL in a single page and map fields', async () => {
            const mockResponse = {
                items: [
                    {
                        conceptId: '16224591000119103',
                        active: true,
                        fsn: { term: 'alergia a veneno de abeja (hallazgo)', lang: 'es' },
                        pt: { term: 'alergia a veneno de abeja', lang: 'es' }
                    }
                ],
                total: 1,
                limit: 1000
            };

            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                json: async () => mockResponse
            } as any);

            const result = await service.getConceptsByEcl('<<420134006');

            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining(`${mockHost}/${mockBranch}/concepts?ecl=%3C%3C420134006&limit=1000&activeFilter=true`),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'Accept-Language': 'es'
                    })
                })
            );

            expect(result).toHaveLength(1);
            expect(result[0]).toEqual({
                conceptId: '16224591000119103',
                term: 'alergia a veneno de abeja',
                fsn: 'alergia a veneno de abeja (hallazgo)',
                semanticTag: 'hallazgo'
            });
        });

        it('should paginate multiple pages using searchAfter until all concepts are retrieved', async () => {
            const page1 = {
                items: [
                    { conceptId: '111', pt: { term: 'Alergia 1' }, fsn: { term: 'Alergia 1 (hallazgo)' } }
                ],
                total: 2,
                limit: 1,
                searchAfter: 'cursor-token-page-1'
            };
            const page2 = {
                items: [
                    { conceptId: '222', pt: { term: 'Alergia 2' }, fsn: { term: 'Alergia 2 (hallazgo)' } }
                ],
                total: 2,
                limit: 1
            };

            global.fetch = jest.fn()
                .mockResolvedValueOnce({ ok: true, json: async () => page1 } as any)
                .mockResolvedValueOnce({ ok: true, json: async () => page2 } as any);

            const result = await service.getConceptsByEcl('<<420134006', { limit: 1 });

            expect(global.fetch).toHaveBeenCalledTimes(2);
            expect(global.fetch).toHaveBeenNthCalledWith(
                1,
                expect.stringContaining('limit=1&activeFilter=true'),
                expect.any(Object)
            );
            expect(global.fetch).toHaveBeenNthCalledWith(
                2,
                expect.stringContaining('searchAfter=cursor-token-page-1'),
                expect.any(Object)
            );

            expect(result).toHaveLength(2);
            expect(result.map(c => c.conceptId)).toEqual(['111', '222']);
        });

        it('should cache ECL results with custom ttlMs and return from cache without re-fetching', async () => {
            const mockResponse = {
                items: [
                    { conceptId: '333', pt: { term: 'Intolerancia' }, fsn: { term: 'Intolerancia (trastorno)' } }
                ],
                total: 1,
                limit: 1000
            };

            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                json: async () => mockResponse
            } as any);

            const res1 = await service.getConceptsByEcl('<<782197009', { ttlMs: 24 * 60 * 60 * 1000 });
            expect(global.fetch).toHaveBeenCalledTimes(1);
            expect(res1).toHaveLength(1);

            const res2 = await service.getConceptsByEcl('<<782197009');
            expect(global.fetch).toHaveBeenCalledTimes(1);
            expect(res2).toEqual(res1);
        });

        it('should bypass cache when bypassCache is true', async () => {
            const mockResponse = {
                items: [
                    { conceptId: '444', pt: { term: 'Hipersensibilidad' }, fsn: { term: 'Hipersensibilidad (trastorno)' } }
                ],
                total: 1,
                limit: 1000
            };

            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                json: async () => mockResponse
            } as any);

            await service.getConceptsByEcl('<<21626009');
            expect(global.fetch).toHaveBeenCalledTimes(1);

            await service.getConceptsByEcl('<<21626009', { bypassCache: true });
            expect(global.fetch).toHaveBeenCalledTimes(2);
        });
    });

    describe('getConcepts', () => {
        it('should fetch multiple concepts by ids in batch', async () => {
            const mockBatchResponse = {
                items: [
                    {
                        conceptId: '101',
                        active: true,
                        fsn: { term: 'Concepto 101 (trastorno)' },
                        pt: { term: 'Concepto 101' }
                    }
                ]
            };

            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                json: async () => mockBatchResponse
            } as any);

            const result = await service.getConcepts(['101', '102']);

            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining(`${mockHost}/${mockBranch}/concepts?limit=1000&conceptIds=101&conceptIds=102`),
                expect.any(Object)
            );

            expect(result).toHaveLength(1);
            expect(result[0].conceptId).toBe('101');
            expect(result[0].semanticTag).toBe('trastorno');
        });
    });

    describe('Cache functionality', () => {
        it('should cache allergies and avoid redundant fetch on consecutive calls', async () => {
            const mockChildren = [
                {
                    conceptId: '419199008',
                    active: true,
                    fsn: { term: 'alergia a polvo (hallazgo)', lang: 'es' },
                    pt: { term: 'alergia a polvo', lang: 'es' }
                }
            ];

            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                json: async () => mockChildren
            } as any);

            // First call -> calls fetch
            const res1 = await service.getSnomedAllergies(419199007);
            expect(global.fetch).toHaveBeenCalledTimes(1);
            expect(res1).toHaveLength(1);
            expect(service.getCacheSize()).toBe(1);

            // Second call -> returns from cache, fetch NOT called again
            const res2 = await service.getSnomedAllergies(419199007);
            expect(global.fetch).toHaveBeenCalledTimes(1);
            expect(res2).toEqual(res1);
        });

        it('should cache intolerances and avoid redundant fetch on consecutive calls', async () => {
            const mockChildren = [
                {
                    conceptId: '235719003',
                    active: true,
                    fsn: { term: 'intolerancia a la lactosa (trastorno)' },
                    pt: { term: 'intolerancia a la lactosa' }
                }
            ];

            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                json: async () => mockChildren
            } as any);

            const res1 = await service.getSnomedIntolerances();
            expect(global.fetch).toHaveBeenCalledTimes(1);
            expect(res1).toHaveLength(1);
            expect(service.getCacheSize()).toBe(1);

            const res2 = await service.getSnomedIntolerances();
            expect(global.fetch).toHaveBeenCalledTimes(1);
            expect(res2).toEqual(res1);
        });

        it('should bypass cache when bypassCache is true', async () => {
            const mockChildren = [
                {
                    conceptId: '419199008',
                    active: true,
                    fsn: { term: 'alergia a polvo (hallazgo)', lang: 'es' },
                    pt: { term: 'alergia a polvo', lang: 'es' }
                }
            ];

            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                json: async () => mockChildren
            } as any);

            await service.getSnomedAllergies(419199007);
            expect(global.fetch).toHaveBeenCalledTimes(1);

            // Call with bypassCache = true -> should call fetch again
            await service.getSnomedAllergies(419199007, true);
            expect(global.fetch).toHaveBeenCalledTimes(2);
        });

        it('should cache getConcept calls and respect clearCache', async () => {
            const mockRawConcept = {
                conceptId: '123456',
                fsn: { term: 'amoxicilina (fármaco de uso clínico)' },
                pt: { term: 'amoxicilina' }
            };

            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                json: async () => mockRawConcept
            } as any);

            const c1 = await service.getConcept('123456', 'summary');
            expect(global.fetch).toHaveBeenCalledTimes(1);
            expect(c1.term).toBe('amoxicilina');

            // Cached call
            const c2 = await service.getConcept('123456', 'summary');
            expect(global.fetch).toHaveBeenCalledTimes(1);
            expect(c2).toEqual(c1);

            // Clear cache and call again
            service.clearCache();
            expect(service.getCacheSize()).toBe(0);

            await service.getConcept('123456', 'summary');
            expect(global.fetch).toHaveBeenCalledTimes(2);
        });

        it('should treat expired cache entries as cache miss', async () => {
            // Service with 1ms TTL
            const shortLivedService = new SnowstormService(mockHost, mockBranch, 1);

            const mockChildren = [
                {
                    conceptId: '100',
                    active: true,
                    fsn: { term: 'alergia (hallazgo)' },
                    pt: { term: 'alergia' }
                }
            ];

            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                json: async () => mockChildren
            } as any);

            await shortLivedService.getSnomedAllergies(419199007);
            expect(global.fetch).toHaveBeenCalledTimes(1);

            // Wait 10ms for TTL to expire
            await new Promise(resolve => setTimeout(resolve, 10));

            await shortLivedService.getSnomedAllergies(419199007);
            expect(global.fetch).toHaveBeenCalledTimes(2);
        });
    });
});
