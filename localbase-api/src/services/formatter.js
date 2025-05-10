/**
 * LocalBase API Gateway
 * Response formatter service
 */

/**
 * Response formatter service
 * Formats API responses to match the OpenAI API format
 */
class ResponseFormatter {
  /**
   * Format chat completion response
   * 
   * @param {Object} result - Internal result object
   * @param {Object} request - Original request object
   * @returns {Object} - Formatted response
   */
  formatChatCompletion(result, request) {
    return {
      id: result.id,
      object: 'chat.completion',
      created: Math.floor(result.created_at / 1000),
      model: result.model,
      provider_id: result.provider_id,
      usage: {
        prompt_tokens: result.usage.input_tokens,
        completion_tokens: result.usage.output_tokens,
        total_tokens: result.usage.input_tokens + result.usage.output_tokens
      },
      choices: [
        {
          message: {
            role: 'assistant',
            content: result.output
          },
          finish_reason: result.finish_reason,
          index: 0
        }
      ]
    };
  }
  
  /**
   * Format streaming chat completion response chunk
   * 
   * @param {Object} chunk - Chunk data
   * @param {Object} request - Original request object
   * @returns {Object} - Formatted chunk
   */
  formatChatCompletionChunk(chunk, request) {
    return {
      id: chunk.id,
      object: 'chat.completion.chunk',
      created: Math.floor(chunk.created_at / 1000),
      model: chunk.model,
      choices: [
        {
          delta: {
            role: chunk.is_first ? 'assistant' : undefined,
            content: chunk.content
          },
          finish_reason: chunk.finish_reason || null,
          index: 0
        }
      ]
    };
  }
  
  /**
   * Format completion response
   * 
   * @param {Object} result - Internal result object
   * @param {Object} request - Original request object
   * @returns {Object} - Formatted response
   */
  formatCompletion(result, request) {
    return {
      id: result.id,
      object: 'text_completion',
      created: Math.floor(result.created_at / 1000),
      model: result.model,
      provider_id: result.provider_id,
      choices: [
        {
          text: result.output,
          index: 0,
          finish_reason: result.finish_reason
        }
      ],
      usage: {
        prompt_tokens: result.usage.input_tokens,
        completion_tokens: result.usage.output_tokens,
        total_tokens: result.usage.input_tokens + result.usage.output_tokens
      }
    };
  }
  
  /**
   * Format streaming completion response chunk
   * 
   * @param {Object} chunk - Chunk data
   * @param {Object} request - Original request object
   * @returns {Object} - Formatted chunk
   */
  formatCompletionChunk(chunk, request) {
    return {
      id: chunk.id,
      object: 'text_completion.chunk',
      created: Math.floor(chunk.created_at / 1000),
      model: chunk.model,
      choices: [
        {
          text: chunk.content,
          index: 0,
          finish_reason: chunk.finish_reason || null
        }
      ]
    };
  }
  
  /**
   * Format embedding response
   * 
   * @param {Object} result - Internal result object
   * @param {Object} request - Original request object
   * @returns {Object} - Formatted response
   */
  formatEmbedding(result, request) {
    // Handle batch embeddings
    if (Array.isArray(result.embeddings)) {
      return {
        object: 'list',
        data: result.embeddings.map((embedding, index) => ({
          object: 'embedding',
          embedding,
          index
        })),
        model: result.model,
        provider_id: result.provider_id,
        usage: {
          prompt_tokens: result.usage.input_tokens,
          total_tokens: result.usage.input_tokens
        }
      };
    }
    
    // Handle single embedding
    return {
      object: 'list',
      data: [
        {
          object: 'embedding',
          embedding: result.embedding,
          index: 0
        }
      ],
      model: result.model,
      provider_id: result.provider_id,
      usage: {
        prompt_tokens: result.usage.input_tokens,
        total_tokens: result.usage.input_tokens
      }
    };
  }
  
  /**
   * Format models list response
   * 
   * @param {Array} models - Array of models
   * @returns {Object} - Formatted response
   */
  formatModelsList(models) {
    return {
      object: 'list',
      data: models.map(model => ({
        id: model.id,
        object: 'model',
        created: Math.floor(model.created_at / 1000),
        owned_by: 'localbase',
        providers: model.providers
      }))
    };
  }
  
  /**
   * Format model details response
   * 
   * @param {Object} model - Model object
   * @returns {Object} - Formatted response
   */
  formatModelDetails(model) {
    return {
      id: model.id,
      object: 'model',
      created: Math.floor(model.created_at / 1000),
      owned_by: 'localbase',
      providers: model.providers
    };
  }
  
  /**
   * Format error response
   * 
   * @param {Error} error - Error object
   * @returns {Object} - Formatted error response
   */
  formatError(error) {
    return {
      error: {
        message: error.message,
        type: error.type || 'server_error',
        param: error.param,
        code: error.code || 'internal_server_error'
      }
    };
  }
}

module.exports = ResponseFormatter;
