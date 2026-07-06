ALLOWED_EXTENSIONS = {'txt', 'pdf', 'md', 'docx'}

def allowed_file(filename):
    """Checks if the filename has an allowed extension."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_file_extension(filename):
    """Retrieves the lowercase file extension from the filename."""
    if '.' not in filename:
        return ''
    return filename.rsplit('.', 1)[1].lower()
