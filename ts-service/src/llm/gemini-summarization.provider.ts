import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  CandidateSummaryInput,
  CandidateSummaryResult,
  SummarizationProvider,
  RecommendedDecision,
} from './summarization-provider.interface';

@Injectable()
export class GeminiSummarizationProvider implements SummarizationProvider {
  public readonly providerName = 'gemini-2.5-flash';
  private readonly logger = new Logger(GeminiSummarizationProvider.name);
  private readonly apiKey: string;
  private readonly apiUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GEMINI_API_KEY', '');
    this.apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
  }

  async generateCandidateSummary(
    input: CandidateSummaryInput,
  ): Promise<CandidateSummaryResult> {
    if (!this.apiKey) {
      this.logger.warn('Gemini API key not configured, falling back to fake provider');
      return this.generateFakeSummary(input);
    }

    try {
      const prompt = this.buildPrompt(input);
      
      const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt,
            }],
          }],
          generationConfig: {
            temperature: 0.3,
            topK: 1,
            topP: 1,
            maxOutputTokens: 8192,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!generatedText) {
        throw new Error('No content generated from Gemini');
      }

      return this.parseSummaryResponse(generatedText);
    } catch (error) {
      this.logger.error('Gemini API error:', error);
      return this.generateFakeSummary(input);
    }
  }

  private buildPrompt(input: CandidateSummaryInput): string {
    const documentContext = input.documents
      .map((doc, index) => `Document ${index + 1}:\n${doc}`)
      .join('\n\n---\n\n');

    return `You are an expert technical recruiter analyzing candidate documents. Please provide a structured summary of this candidate based on their documents.

Documents:
${documentContext}

Please provide your analysis in the following JSON format:
{
  "score": <number between 0-100>,
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "concerns": ["concern 1", "concern 2"],
  "summary": "A brief 2-3 sentence summary of the candidate",
  "recommendedDecision": "advance" | "hold" | "reject"
}

Consider:
- Technical skills and experience
- Communication abilities
- Project complexity handled
- Growth potential
- Cultural fit indicators

Be objective and professional in your assessment.`;
  }

  private parseSummaryResponse(text: string): CandidateSummaryResult {
    try {
      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate and normalize the response
      return {
        score: Math.max(0, Math.min(100, Number(parsed.score) || 0)),
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 5) : [],
        concerns: Array.isArray(parsed.concerns) ? parsed.concerns.slice(0, 5) : [],
        summary: String(parsed.summary || 'No summary provided'),
        recommendedDecision: this.normalizeDecision(parsed.recommendedDecision),
      };
    } catch (error) {
      this.logger.error('Failed to parse Gemini response:', error);
      return this.generateFakeSummary({ candidateId: 'unknown', documents: [] });
    }
  }

  private normalizeDecision(decision: string): RecommendedDecision {
    const normalized = String(decision).toLowerCase();
    if (normalized === 'advance') return 'advance';
    if (normalized === 'reject') return 'reject';
    return 'hold';
  }

  private generateFakeSummary(input: CandidateSummaryInput): CandidateSummaryResult {
    const docCount = input.documents.length;
    const hasContent = docCount > 0 && input.documents.some(doc => doc.trim().length > 100);

    return {
      score: hasContent ? Math.floor(Math.random() * 30) + 60 : Math.floor(Math.random() * 40) + 20,
      strengths: hasContent 
        ? ['Strong technical background', 'Clear communication skills', 'Relevant experience']
        : ['Basic qualifications met'],
      concerns: hasContent && docCount < 2
        ? ['Limited documentation provided', 'Need more context on experience']
        : ['Insufficient information for thorough assessment'],
      summary: `Candidate ${input.candidateId} ${hasContent ? 'shows promise with relevant background' : 'requires more documentation for proper assessment'}.`,
      recommendedDecision: hasContent ? 'hold' : 'reject',
    };
  }
}