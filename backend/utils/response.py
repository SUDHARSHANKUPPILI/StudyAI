from flask import jsonify

def make_success_response(message, data=None, status_code=200):
    """
    Generates a standardized API success response.
    
    Format:
    {
      "success": true,
      "message": "...",
      "data": { ... }
    }
    """
    return jsonify({
        "success": True,
        "message": message,
        "data": data if data is not None else {}
    }), status_code

def make_error_response(message, error_code="INTERNAL_ERROR", status_code=500):
    """
    Generates a standardized API error response.
    
    Format:
    {
      "success": false,
      "message": "...",
      "error": "..."
    }
    """
    return jsonify({
        "success": False,
        "message": message,
        "error": error_code
    }), status_code
