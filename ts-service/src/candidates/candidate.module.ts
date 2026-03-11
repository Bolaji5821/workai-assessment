import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CandidateDocument } from '../entities/candidate-document.entity';
import { CandidateSummary } from '../entities/candidate-summary.entity';
import { SampleCandidate } from '../entities/sample-candidate.entity';
import { SampleWorkspace } from '../entities/sample-workspace.entity';
import { LlmModule } from '../llm/llm.module';
import { QueueModule } from '../queue/queue.module';
import { CandidateController } from './candidate.controller';
import { CandidateService } from './candidate.service';
import { SummaryWorkerService } from './summary-worker.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SampleCandidate,
      CandidateDocument,
      CandidateSummary,
      SampleWorkspace,
    ]),
    QueueModule,
    LlmModule,
  ],
  controllers: [CandidateController],
  providers: [CandidateService, SummaryWorkerService],
})
export class CandidateModule {}