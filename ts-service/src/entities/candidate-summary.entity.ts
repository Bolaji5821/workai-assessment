import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

import { SampleCandidate } from './sample-candidate.entity';

export enum SummaryStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum RecommendedDecision {
  ADVANCE = 'advance',
  HOLD = 'hold',
  REJECT = 'reject',
}

@Entity({ name: 'candidate_summaries' })
export class CandidateSummary {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  id!: string;

  @Column({ name: 'candidate_id', type: 'varchar', length: 64 })
  candidateId!: string;

  @Column({ name: 'status', type: 'enum', enum: SummaryStatus, default: SummaryStatus.PENDING })
  status!: SummaryStatus;

  @Column({ name: 'score', type: 'int', nullable: true })
  score!: number | null;

  @Column({ name: 'strengths', type: 'text', array: true, nullable: true })
  strengths!: string[] | null;

  @Column({ name: 'concerns', type: 'text', array: true, nullable: true })
  concerns!: string[] | null;

  @Column({ name: 'summary', type: 'text', nullable: true })
  summary!: string | null;

  @Column({ name: 'recommended_decision', type: 'enum', enum: RecommendedDecision, nullable: true })
  recommendedDecision!: RecommendedDecision | null;

  @Column({ name: 'provider', type: 'varchar', length: 64, nullable: true })
  provider!: string | null;

  @Column({ name: 'prompt_version', type: 'varchar', length: 32, nullable: true })
  promptVersion!: string | null;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @ManyToOne(() => SampleCandidate, (candidate) => candidate.summaries, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'candidate_id' })
  candidate!: SampleCandidate;
}