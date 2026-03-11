import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { DocumentType } from '../../entities/candidate-document.entity';

export class UploadDocumentDto {
  @IsEnum(DocumentType)
  documentType!: DocumentType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fileName!: string;

  @IsString()
  @IsNotEmpty()
  storageKey!: string;

  @IsString()
  @IsNotEmpty()
  rawText!: string;
}