import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../auth/auth-user.decorator';
import { AuthUser } from '../auth/auth.types';
import { FakeAuthGuard } from '../auth/fake-auth.guard';
import { CandidateService } from './candidate.service';
import { CandidateSummaryResponseDto } from './dto/candidate-summary-response.dto';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { UploadDocumentDto } from './dto/upload-document.dto';

@Controller('candidates')
@UseGuards(FakeAuthGuard)
export class CandidateController {
  constructor(private readonly candidateService: CandidateService) {}

  @Post()
  async createCandidate(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateCandidateDto,
  ) {
    return this.candidateService.createCandidate(user, dto);
  }

  @Get()
  async listCandidates(@CurrentUser() user: AuthUser) {
    return this.candidateService.listCandidates(user);
  }

  @Post(':candidateId/documents')
  async uploadDocument(
    @CurrentUser() user: AuthUser,
    @Param('candidateId') candidateId: string,
    @Body() dto: UploadDocumentDto,
  ) {
    const document = await this.candidateService.uploadDocument(user, candidateId, dto);
    
    return {
      id: document.id,
      candidateId: document.candidateId,
      documentType: document.documentType,
      fileName: document.fileName,
      storageKey: document.storageKey,
      uploadedAt: document.uploadedAt,
    };
  }

  @Post(':candidateId/summaries/generate')
  async generateSummary(
    @CurrentUser() user: AuthUser,
    @Param('candidateId') candidateId: string,
  ) {
    const summary = await this.candidateService.requestSummaryGeneration(user, candidateId);
    
    return {
      id: summary.id,
      candidateId: summary.candidateId,
      status: summary.status,
      createdAt: summary.createdAt,
    };
  }

  @Get(':candidateId/summaries')
  async listSummaries(
    @CurrentUser() user: AuthUser,
    @Param('candidateId') candidateId: string,
  ): Promise<CandidateSummaryResponseDto[]> {
    return this.candidateService.listSummaries(user, candidateId);
  }

  @Get(':candidateId/summaries/:summaryId')
  async getSummary(
    @CurrentUser() user: AuthUser,
    @Param('candidateId') candidateId: string,
    @Param('summaryId') summaryId: string,
  ): Promise<CandidateSummaryResponseDto> {
    return this.candidateService.getSummary(user, candidateId, summaryId);
  }

  @Post(':candidateId/summaries/:summaryId')
  async updateSummary(
    @CurrentUser() user: AuthUser,
    @Param('candidateId') candidateId: string,
    @Param('summaryId') summaryId: string,
    @Body() updateDto: any,
  ): Promise<CandidateSummaryResponseDto> {
    return this.candidateService.updateSummary(user, candidateId, summaryId, updateDto);
  }

  @Post(':candidateId/summaries/:summaryId/delete')
  async deleteSummary(
    @CurrentUser() user: AuthUser,
    @Param('candidateId') candidateId: string,
    @Param('summaryId') summaryId: string,
  ) {
    await this.candidateService.deleteSummary(user, candidateId, summaryId);
    return { success: true };
  }

  @Post(':candidateId/documents/:documentId/delete')
  async deleteDocument(
    @CurrentUser() user: AuthUser,
    @Param('candidateId') candidateId: string,
    @Param('documentId') documentId: string,
  ) {
    await this.candidateService.deleteDocument(user, candidateId, documentId);
    return { success: true };
  }

  @Post(':candidateId/delete')
  async deleteCandidate(
    @CurrentUser() user: AuthUser,
    @Param('candidateId') candidateId: string,
  ) {
    await this.candidateService.deleteCandidate(user, candidateId);
    return { success: true };
  }
}