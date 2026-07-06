import os

PROMPTS_DIR = os.path.dirname(os.path.abspath(__file__))

def load_prompt(filename):
    """
    Loads an LLM system prompt template from a text file in the prompts directory.
    
    @param {str} filename - Name of the prompt file (e.g. 'summary.txt')
    """
    path = os.path.join(PROMPTS_DIR, filename)
    try:
        with open(path, "r", encoding="utf-8") as f:
            return f.read().strip()
    except Exception as e:
        # Raise standard FileNotFoundError for global handler mapping
        raise FileNotFoundError(f"LLM Prompt template file not found: {filename}. Error: {str(e)}")
