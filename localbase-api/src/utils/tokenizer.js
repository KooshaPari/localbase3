/**
 * LocalBase API Gateway
 * Token counting utility
 * 
 * This is a simple implementation for development purposes.
 * In production, use a proper tokenizer like GPT-2/3 tokenizer.
 */

/**
 * Estimate token count for a string
 * This is a very rough approximation (4 chars = 1 token)
 * 
 * @param {string} text - Text to count tokens for
 * @returns {number} - Estimated token count
 */
function estimateTokenCount(text) {
  if (!text) return 0;
  
  // Simple approximation: ~4 characters per token
  return Math.ceil(text.length / 4);
}

/**
 * Estimate token count for chat messages
 * 
 * @param {Array} messages - Array of chat messages
 * @returns {number} - Estimated token count
 */
function estimateChatTokenCount(messages) {
  if (!messages || !Array.isArray(messages)) return 0;
  
  let totalTokens = 0;
  
  // Add tokens for each message
  for (const message of messages) {
    // Add tokens for message role
    totalTokens += estimateTokenCount(message.role);
    
    // Add tokens for message content
    if (typeof message.content === 'string') {
      totalTokens += estimateTokenCount(message.content);
    } else if (Array.isArray(message.content)) {
      // Handle content array (for multi-modal messages)
      for (const part of message.content) {
        if (part.type === 'text') {
          totalTokens += estimateTokenCount(part.text);
        } else if (part.type === 'image_url') {
          // Images typically use ~85-100 tokens
          totalTokens += 85;
        }
      }
    }
    
    // Add overhead for message formatting (3 tokens per message)
    totalTokens += 3;
  }
  
  // Add overhead for chat formatting (3 tokens)
  totalTokens += 3;
  
  return totalTokens;
}

module.exports = {
  estimateTokenCount,
  estimateChatTokenCount
};
