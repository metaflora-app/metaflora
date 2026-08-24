const EMBEDDING_PATTERN = /(?:embedding|embed|bge-|e5-|minilm|mpnet|sentence-transformers)/iu;

export function isPolzaEmbeddingModel({ providerModelId = '', name = '', category = '' } = {}) {
  return category === 'embedding' || EMBEDDING_PATTERN.test(`${providerModelId} ${name}`);
}
