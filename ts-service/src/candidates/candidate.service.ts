import { randomUUID } from 'crypto';

import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AuthUser } from '../auth/auth.types';
import { CandidateDocument } from '../entities/candidate-document.entity';
import { CandidateSummary, SummaryStatus } from '../entities/candidate-summary.entity';
import { SampleCandidate } from '../entities/sample-candidate.entity';
import { SampleWorkspace } from '../entities/sample-workspace.entity';
import { QueueService } from '../queue/queue.service';
import { CandidateSummaryResponseDto } from './dto/candidate-summary-response.dto';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { UploadDocumentDto } from './dto/upload-document.dto';

@Injectable()
export class CandidateService {
  constructor(
    @InjectRepository(SampleWorkspace)
    private readonly workspaceRepository: Repository<SampleWorkspace>,
    @InjectRepository(SampleCandidate)
    private readonly candidateRepository: Repository<SampleCandidate>,
    @InjectRepository(CandidateDocument)
    private readonly documentRepository: Repository<CandidateDocument>,
    @InjectRepository(CandidateSummary)
    private readonly summaryRepository: Repository<CandidateSummary>,
    private readonly queueService: QueueService,
  ) {}

  async createCandidate(user: AuthUser, dto: CreateCandidateDto): Promise<SampleCandidate> {
    await this.ensureWorkspace(user.workspaceId);

    const candidate = this.candidateRepository.create({
      id: randomUUID(),
      workspaceId: user.workspaceId,
      fullName: dto.fullName.trim(),
      email: dto.email?.trim() ?? null,
    });

    return this.candidateRepository.save(candidate);
  }

  async listCandidates(user: AuthUser): Promise<SampleCandidate[]> {
    return this.candidateRepository.find({
      where: { workspaceId: user.workspaceId },
      order: { createdAt: 'DESC' },
    });
  }

  private async ensureWorkspace(workspaceId: string): Promise<void> {
    const existing = await this.workspaceRepository.findOne({ where: { id: workspaceId } });

    if (existing) {
      return;
    }

    const workspace = this.workspaceRepository.create({
      id: workspaceId,
      name: `Workspace ${workspaceId}`,
    });

    await this.workspaceRepository.save(workspace);
  }

  async uploadDocument(
    user: AuthUser,
    candidateId: string,
    dto: UploadDocumentDto,
  ): Promise<CandidateDocument> {
    const candidate = await this.candidateRepository.findOne({
      where: { id: candidateId },
      relations: ['workspace'],
    });

    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }

    if (candidate.workspaceId !== user.workspaceId) {
      throw new UnauthorizedException('Access denied to this candidate');
    }

    const document = this.documentRepository.create({
      id: randomUUID(),
      candidateId,
      documentType: dto.documentType,
      fileName: dto.fileName.trim(),
      storageKey: dto.storageKey.trim(),
      rawText: dto.rawText.trim(),
    });

    return this.documentRepository.save(document);
  }

  async requestSummaryGeneration(user: AuthUser, candidateId: string): Promise<CandidateSummary> {
    const candidate = await this.candidateRepository.findOne({
      where: { id: candidateId },
      relations: ['workspace'],
    });

    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }

    if (candidate.workspaceId !== user.workspaceId) {
      throw new UnauthorizedException('Access denied to this candidate');
    }

    const documents = await this.documentRepository.find({
      where: { candidateId },
    });

    if (documents.length === 0) {
      throw new NotFoundException('No documents found for this candidate');
    }

    const summary = this.summaryRepository.create({
      id: randomUUID(),
      candidateId,
      status: SummaryStatus.PENDING,
      score: null,
      strengths: null,
      concerns: null,
      summary: null,
      recommendedDecision: null,
      provider: null,
      promptVersion: null,
      errorMessage: null,
    });

    const savedSummary = await this.summaryRepository.save(summary);

    this.queueService.enqueue('generate-candidate-summary', {
      summaryId: savedSummary.id,
      candidateId,
      documentIds: documents.map((doc) => doc.id),
    });

    return savedSummary;
  }

  async listSummaries(user: AuthUser, candidateId: string): Promise<CandidateSummaryResponseDto[]> {
    const candidate = await this.candidateRepository.findOne({
      where: { id: candidateId },
      relations: ['workspace'],
    });

    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }

    if (candidate.workspaceId !== user.workspaceId) {
      throw new UnauthorizedException('Access denied to this candidate');
    }

    const summaries = await this.summaryRepository.find({
      where: { candidateId },
      order: { createdAt: 'DESC' },
    });

    return summaries.map((summary) => this.mapToResponseDto(summary));
  }

  async getSummary(
    user: AuthUser,
    candidateId: string,
    summaryId: string,
  ): Promise<CandidateSummaryResponseDto> {
    const summary = await this.summaryRepository.findOne({
      where: { id: summaryId, candidateId },
    });

    if (!summary) {
      throw new NotFoundException('Summary not found');
    }

    const candidate = await this.candidateRepository.findOne({
      where: { id: candidateId },
      relations: ['workspace'],
    });

    if (!candidate || candidate.workspaceId !== user.workspaceId) {
      throw new UnauthorizedException('Access denied');
    }

    return this.mapToResponseDto(summary);
  }

  async updateSummary(
    user: AuthUser,
    candidateId: string,
    summaryId: string,
    updateDto: any,
  ): Promise<CandidateSummaryResponseDto> {
    const summary = await this.summaryRepository.findOne({
      where: { id: summaryId, candidateId },
    });

    if (!summary) {
      throw new NotFoundException('Summary not found');
    }

    const candidate = await this.candidateRepository.findOne({
      where: { id: candidateId },
      relations: ['workspace'],
    });

    if (!candidate || candidate.workspaceId !== user.workspaceId) {
      throw new UnauthorizedException('Access denied');
    }

    await this.summaryRepository.update(summaryId, {
      ...updateDto,
      updatedAt: new Date(),
    });

    const updatedSummary = await this.summaryRepository.findOne({
      where: { id: summaryId },
    });

    if (!updatedSummary) {
      throw new NotFoundException('Summary not found after update');
    }

    return this.mapToResponseDto(updatedSummary);
  }

  async deleteSummary(
    user: AuthUser,
    candidateId: string,
    summaryId: string,
  ): Promise<void> {
    const summary = await this.summaryRepository.findOne({
      where: { id: summaryId, candidateId },
    });

    if (!summary) {
      throw new NotFoundException('Summary not found');
    }

    const candidate = await this.candidateRepository.findOne({
      where: { id: candidateId },
      relations: ['workspace'],
    });

    if (!candidate || candidate.workspaceId !== user.workspaceId) {
      throw new UnauthorizedException('Access denied');
    }

    await this.summaryRepository.delete(summaryId);
  }

  async deleteDocument(
    user: AuthUser,
    candidateId: string,
    documentId: string,
  ): Promise<void> {
    const document = await this.documentRepository.findOne({
      where: { id: documentId, candidateId },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    const candidate = await this.candidateRepository.findOne({
      where: { id: candidateId },
      relations: ['workspace'],
    });

    if (!candidate || candidate.workspaceId !== user.workspaceId) {
      throw new UnauthorizedException('Access denied');
    }

    await this.documentRepository.delete(documentId);
  }

  async deleteCandidate(
    user: AuthUser,
    candidateId: string,
  ): Promise<void> {
    const candidate = await this.candidateRepository.findOne({
      where: { id: candidateId },
      relations: ['workspace'],
    });

    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }

    if (candidate.workspaceId !== user.workspaceId) {
      throw new UnauthorizedException('Access denied');
    }

    // Related documents and summaries will be deleted via cascade if configured in DB
    // Or we can manually delete them here if needed.
    // Assuming DB cascade is set up for relationships, simply deleting the candidate is enough.
    // If not, we should delete children first.
    // Let's assume manual cleanup for safety or TypeORM cascade.
    
    // TypeORM cascade:
    // If entities have { cascade: true } or onDelete: 'CASCADE', it works.
    // Let's check entities first. If not sure, manual deletion is safer.
    
    await this.summaryRepository.delete({ candidateId });
    await this.documentRepository.delete({ candidateId });
    await this.candidateRepository.delete(candidateId);
  }

  async processSummaryGeneration(job: {
    summaryId: string;
    candidateId: string;
    documentIds: string[];
  }): Promise<void> {
    try {
      const documents = await this.documentRepository.findByIds(job.documentIds);
      
      if (documents.length === 0) {
        throw new Error('No documents found for summary generation');
      }

      const documentTexts = documents.map((doc) => doc.rawText);
      
      // This will be implemented by the worker service
      // For now, we'll update the status to simulate processing
      await this.summaryRepository.update(job.summaryId, {
        status: SummaryStatus.COMPLETED,
        updatedAt: new Date(),
      });
    } catch (error) {
      await this.summaryRepository.update(job.summaryId, {
        status: SummaryStatus.FAILED,
        errorMessage: error instanceof Error ? error.message : 'Unknown error occurred',
        updatedAt: new Date(),
      });
    }
  }

  private mapToResponseDto(summary: CandidateSummary): CandidateSummaryResponseDto {
    return {
      id: summary.id,
      candidateId: summary.candidateId,
      status: summary.status,
      score: summary.score ?? undefined,
      strengths: summary.strengths ?? undefined,
      concerns: summary.concerns ?? undefined,
      summary: summary.summary ?? undefined,
      recommendedDecision: summary.recommendedDecision ?? undefined,
      provider: summary.provider ?? undefined,
      promptVersion: summary.promptVersion ?? undefined,
      errorMessage: summary.errorMessage ?? undefined,
      createdAt: summary.createdAt,
      updatedAt: summary.updatedAt,
    };
  }
}