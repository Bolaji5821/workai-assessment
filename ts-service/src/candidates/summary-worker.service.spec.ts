
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CandidateDocument } from '../entities/candidate-document.entity';
import { CandidateSummary, SummaryStatus } from '../entities/candidate-summary.entity';
import { SUMMARIZATION_PROVIDER, SummarizationProvider } from '../llm/summarization-provider.interface';
import { SummaryWorkerService } from './summary-worker.service';

const mockSummarizationProvider = {
  providerName: 'mock-provider',
  generateCandidateSummary: jest.fn(),
};

const mockCandidateDocumentRepository = {
  find: jest.fn(),
};

const mockCandidateSummaryRepository = {
  find: jest.fn(),
  update: jest.fn(),
};

describe('SummaryWorkerService', () => {
  let service: SummaryWorkerService;
  let summarizationProvider: SummarizationProvider;
  let documentRepository: Repository<CandidateDocument>;
  let summaryRepository: Repository<CandidateSummary>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SummaryWorkerService,
        {
          provide: getRepositoryToken(CandidateDocument),
          useValue: mockCandidateDocumentRepository,
        },
        {
          provide: getRepositoryToken(CandidateSummary),
          useValue: mockCandidateSummaryRepository,
        },
        {
          provide: SUMMARIZATION_PROVIDER,
          useValue: mockSummarizationProvider,
        },
      ],
    }).compile();

    service = module.get<SummaryWorkerService>(SummaryWorkerService);
    summarizationProvider = module.get<SummarizationProvider>(SUMMARIZATION_PROVIDER);
    documentRepository = module.get<Repository<CandidateDocument>>(getRepositoryToken(CandidateDocument));
    summaryRepository = module.get<Repository<CandidateSummary>>(getRepositoryToken(CandidateSummary));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processSummary', () => {
    it('should successfully process a summary', async () => {
      const summaryId = 'summary-123';
      const candidateId = 'candidate-123';
      const mockSummary = {
        id: summaryId,
        candidateId: candidateId,
        status: SummaryStatus.PENDING,
      } as CandidateSummary;

      const mockDocuments = [
        { id: 'doc-1', rawText: 'Document content 1' },
        { id: 'doc-2', rawText: 'Document content 2' },
      ] as CandidateDocument[];

      const mockResult = {
        score: 85,
        strengths: ['Strength 1', 'Strength 2'],
        concerns: ['Concern 1'],
        summary: 'A good candidate',
        recommendedDecision: 'advance',
      };

      mockCandidateDocumentRepository.find.mockResolvedValue(mockDocuments);
      mockSummarizationProvider.generateCandidateSummary.mockResolvedValue(mockResult);
      mockCandidateSummaryRepository.update.mockResolvedValue({ affected: 1 });

      // Access private method for testing purposes
      await (service as any).processSummary(mockSummary);

      expect(documentRepository.find).toHaveBeenCalledWith({
        where: { candidateId: candidateId },
      });

      expect(summarizationProvider.generateCandidateSummary).toHaveBeenCalledWith({
        candidateId: candidateId,
        documents: ['Document content 1', 'Document content 2'],
      });

      expect(summaryRepository.update).toHaveBeenCalledWith(summaryId, {
        status: SummaryStatus.COMPLETED,
        score: mockResult.score,
        strengths: mockResult.strengths,
        concerns: mockResult.concerns,
        summary: mockResult.summary,
        recommendedDecision: mockResult.recommendedDecision,
        provider: 'mock-provider',
        promptVersion: '1.0',
        updatedAt: expect.any(Date),
      });
    });

    it('should handle errors during processing', async () => {
      const summaryId = 'summary-error';
      const candidateId = 'candidate-error';
      const mockSummary = {
        id: summaryId,
        candidateId: candidateId,
        status: SummaryStatus.PENDING,
      } as CandidateSummary;

      const error = new Error('Processing failed');

      mockCandidateDocumentRepository.find.mockRejectedValue(error);
      mockCandidateSummaryRepository.update.mockResolvedValue({ affected: 1 });

      // Access private method for testing purposes
      await (service as any).processSummary(mockSummary);

      expect(summaryRepository.update).toHaveBeenCalledWith(summaryId, {
        status: SummaryStatus.FAILED,
        errorMessage: 'Processing failed',
        updatedAt: expect.any(Date),
      });
    });
  });
});
