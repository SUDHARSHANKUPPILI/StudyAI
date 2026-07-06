import json
import logging

logger = logging.getLogger(__name__)

def safe_json_parse(content, fallback_data):
    """
    Safely strips markdown block decorators (like ```json ... ```) 
    and parses raw JSON content. Returns a fallback object if parsing fails.
    """
    if not content:
        return fallback_data
    try:
        cleaned = content.strip()
        if cleaned.startswith("```"):
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            else:
                cleaned = cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            cleaned = cleaned.strip()
            
        return json.loads(cleaned)
    except Exception as e:
        logger.error(f"JSON parsing failed for content: {e}. Raw content: {content}")
        return fallback_data
