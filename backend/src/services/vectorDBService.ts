// backend/src/services/vectorDBService.ts
import { Pool } from 'pg';
import { config } from '../config';
import { logger } from '../utils/logger';

export interface VectorSearchResult {
  id: string;
  embedding: number[];
  metadata: Record<string, any>;
  similarity: number;
  created_at: Date;
}

export class VectorDBService {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      connectionString: config.PG_CONNECTION_STRING,
      max: 10,
    });

    this.initializeSchema();
  }

  private async initializeSchema(): Promise<void> {
    try {
      await this.pool.query(`
        CREATE EXTENSION IF NOT EXISTS vector;
        
        CREATE TABLE IF NOT EXISTS embeddings (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          embedding vector(${config.EMBEDDING_DIMENSIONS}),
          metadata JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS embeddings_embedding_idx 
        ON embeddings USING ivfflat (embedding vector_cosine_ops);
      `);
      
      logger.info('Vector database schema initialized');
    } catch (error) {
      logger.error('Failed to initialize vector database schema:', error);
    }
  }

  async store(
    embedding: number[],
    metadata: Record<string, any>
  ): Promise<string> {
    const result = await this.pool.query(
      `INSERT INTO embeddings (embedding, metadata) 
       VALUES ($1::vector, $2) 
       RETURNING id`,
      [`[${embedding.join(',')}]`, metadata]
    );

    return result.rows[0].id;
  }

  async search(
    queryEmbedding: number[],
    filter: Record<string, any> = {},
    limit: number = 10
  ): Promise<VectorSearchResult[]> {
    let query = `
      SELECT 
        id,
        embedding,
        metadata,
        1 - (embedding <=> $1::vector) as similarity,
        created_at
      FROM embeddings
    `;

    const params: any[] = [`[${queryEmbedding.join(',')}]`];
    
    if (Object.keys(filter).length > 0) {
      query += ` WHERE metadata @> $2`;
      params.push(filter);
    }

    query += ` ORDER BY embedding <=> $1::vector LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await this.pool.query(query, params);

    return result.rows.map(row => ({
      id: row.id,
      embedding: this.parseVector(row.embedding),
      metadata: row.metadata,
      similarity: row.similarity,
      created_at: row.created_at,
    }));
  }

  async update(
    id: string,
    embedding?: number[],
    metadata?: Record<string, any>
  ): Promise<void> {
    const updates: string[] = [];
    const params: any[] = [];

    if (embedding) {
      params.push(`[${embedding.join(',')}]`);
      updates.push(`embedding = $${params.length}::vector`);
    }

    if (metadata) {
      params.push(metadata);
      updates.push(`metadata = $${params.length}`);
    }

    if (updates.length === 0) return;

    params.push(id);
    await this.pool.query(
      `UPDATE embeddings 
       SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${params.length}`,
      params
    );
  }

  async delete(id: string): Promise<void> {
    await this.pool.query('DELETE FROM embeddings WHERE id = $1', [id]);
  }

  async findSimilar(
    id: string,
    limit: number = 10
  ): Promise<VectorSearchResult[]> {
    const result = await this.pool.query(
      `SELECT embedding FROM embeddings WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return [];
    }

    const embedding = this.parseVector(result.rows[0].embedding);
    return this.search(embedding, {}, limit + 1).then(results =>
      results.filter(r => r.id !== id).slice(0, limit)
    );
  }

  private parseVector(vectorString: string): number[] {
    // PostgreSQL returns vectors as strings like "[1,2,3]"
    return JSON.parse(vectorString.replace(/[\[\]]/g, '[' + vectorString.slice(1, -1) + ']'));
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
} 