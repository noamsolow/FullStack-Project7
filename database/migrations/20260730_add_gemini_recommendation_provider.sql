ALTER TABLE recommendation_requests
  MODIFY provider_used ENUM('gemini', 'openai', 'fallback') NOT NULL;
