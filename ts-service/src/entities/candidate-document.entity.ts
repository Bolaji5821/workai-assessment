import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

import { SampleCandidate } from './sample-candidate.entity';

export enum DocumentType {
  RESUME = 'resume',
  COVER_LETTER = 'cover_letter',
  PORTFOLIO = 'portfolio',
  OTHER = 'other',
}

@Entity({ name: 'candidate_documents' })
export class CandidateDocument {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  id!: string;

  @Column({ name: 'candidate_id', type: 'varchar', length: 64 })
  candidateId!: string;

  @Column({ name: 'document_type', type: 'enum', enum: DocumentType })
  documentType!: DocumentType;

  @Column({ name: 'file_name', type: 'varchar', length: 255 })
  fileName!: string;

  @Column({ name: 'storage_key', type: 'varchar', length: 255 })
  storageKey!: string;

  @Column({ name: 'raw_text', type: 'text' })
  rawText!: string;

  @CreateDateColumn({ name: 'uploaded_at', type: 'timestamptz' })
  uploadedAt!: Date;

  @ManyToOne(() => SampleCandidate, (candidate) => candidate.documents, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'candidate_id' })
  candidate!: SampleCandidate;

  // @OneToMany relationship removed to avoid circular dependency
  // summaries!: CandidateSummary[];
}