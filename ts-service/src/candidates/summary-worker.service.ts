import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { SummarizationProvider, SUMMARIZATION_PROVIDER } from '../llm/summarization-provider.interface';
import { CandidateDocument } from '../entities/candidate-document.entity';
import { CandidateSummary, SummaryStatus, RecommendedDecision } from '../entities/candidate-summary.entity';
import { Inject } from '@nestjs/common';

@Injectable()
export class SummaryWorkerService implements OnModuleInit {
  private readonly logger = new Logger(SummaryWorkerService.name);
  private isProcessing = false;

  constructor(
    @InjectRepository(CandidateDocument)
    private readonly documentRepository: Repository<CandidateDocument>,
    @InjectRepository(CandidateSummary)
    private readonly summaryRepository: Repository<CandidateSummary>,
    @Inject(SUMMARIZATION_PROVIDER)
    private readonly summarizationProvider: SummarizationProvider,
  ) {}

  async onModuleInit() {
    // Start processing queue on startup
    this.startProcessing();
  }

  private startProcessing() {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    this.logger.log('Summary worker started processing queue');
    
    // In a real implementation, this would connect to a proper queue system
    // For this assessment, we'll simulate queue processing with a simple interval
    setInterval(() => {
      this.processQueue();
    }, 5000); // Process every 5 seconds
  }

  private async processQueue() {
    try {
      // Find pending summaries
      const pendingSummaries = await this.summaryRepository.find({
        where: { status: SummaryStatus.PENDING },
        take: 10,
        order: { createdAt: 'ASC' },
      });

      for (const summary of pendingSummaries) {
        await this.processSummary(summary);
      }
    } catch (error) {
      this.logger.error('Error processing queue:', error);
    }
  }

  private async processSummary(summary: CandidateSummary): Promise<void> {
    this.logger.log(`Processing summary ${summary.id}`);

    try {
      // Note: We keep the status as 'pending' during processing to avoid enum issues
      // The summary remains in 'pending' state until completion or failure

      // Get documents for this candidate
      const documents = await this.documentRepository.find({
        where: { candidateId: summary.candidateId },
      });

      if (documents.length === 0) {
        throw new Error('No documents found for summary generation');
      }

      const documentTexts = documents.map((doc) => doc.rawText);
      
      // Call summarization provider
      const result = await this.summarizationProvider.generateCandidateSummary({
        candidateId: summary.candidateId,
        documents: documentTexts,
      });

      // Update summary with results
      await this.summaryRepository.update(summary.id, {
        status: SummaryStatus.COMPLETED,
        score: result.score,
        strengths: result.strengths,
        concerns: result.concerns,
        summary: result.summary,
        recommendedDecision: result.recommendedDecision as RecommendedDecision,
        provider: this.summarizationProvider.providerName,
        promptVersion: '1.0',
        updatedAt: new Date(),
      });

      this.logger.log(`Summary ${summary.id} completed successfully`);
    } catch (error) {
      this.logger.error(`Failed to process summary ${summary.id}:`, error);
      
      await this.summaryRepository.update(summary.id, {
        status: SummaryStatus.FAILED,
        errorMessage: error instanceof Error ? error.message : 'Unknown error occurred',
        updatedAt: new Date(),
      });
    }
  }

  async processSummaryGeneration(job: {
    summaryId: string;
    candidateId: string;
    documentIds: string[];
  }): Promise<void> {
    // This method is called when a new summary is requested
    // In a real queue system, this would enqueue the job
    // For now, we'll just log it and let the periodic processing handle it
    this.logger.log(`Summary generation requested for summary ${job.summaryId}`);
  }
}