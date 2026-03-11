
import { IsOptional, IsString, IsNumber, IsArray, IsEnum } from 'class-validator';
import { RecommendedDecision } from '../../entities/candidate-summary.entity';

export class UpdateCandidateSummaryDto {
  @IsOptional()
  @IsNumber()
  score?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  strengths?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  concerns?: string[];

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsEnum(['advance', 'hold', 'reject'])
  recommendedDecision?: RecommendedDecision;
}
