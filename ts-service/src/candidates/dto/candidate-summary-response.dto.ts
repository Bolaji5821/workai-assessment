import { IsString, IsOptional, IsEnum } from 'class-validator';
import { RecommendedDecision } from '../../entities/candidate-summary.entity';

export class CandidateSummaryResponseDto {
  id!: string;
  candidateId!: string;
  status!: string;
  score?: number;
  strengths?: string[];
  concerns?: string[];
  summary?: string;
  recommendedDecision?: RecommendedDecision;
  provider?: string;
  promptVersion?: string;
  errorMessage?: string;
  createdAt!: Date;
  updatedAt!: Date;
}