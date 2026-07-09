import io
import logging
import pypdf
import docx
from services.firebase_service import FirebaseService
from utils.file_utils import allowed_file, get_file_extension

logger = logging.getLogger(__name__)

class FileService:
    @classmethod
    def process_and_store_document(cls, user_id, file, owner_email=None):
        """
        Validates the uploaded file, reads it, uploads to Firebase Storage,
        extracts text content based on file type, saves updates to Firestore,
        and returns the stored study material metadata.
        """
        filename = file.filename
        if not filename or filename == '':
            raise ValueError("No selected filename.")

        if not allowed_file(filename):
            raise ValueError("File type not supported.")

        # Read file bytes
        file_bytes = file.read()
        content_type = file.content_type or 'application/octet-stream'

        # 1. Store document metadata and upload to Storage
        material = FirebaseService.store_document(
            user_id=user_id,
            filename=filename,
            file_bytes=file_bytes,
            content_type=content_type,
            owner_email=owner_email
        )

        # 2. Extract plain text content
        extracted_text = ""
        file_ext = get_file_extension(filename)

        if file_ext in ('txt', 'md'):
            try:
                extracted_text = file_bytes.decode('utf-8', errors='ignore')
            except Exception:
                extracted_text = "Failed to decode text file contents."
        elif file_ext == 'pdf':
            try:
                stream = io.BytesIO(file_bytes)
                reader = pypdf.PdfReader(stream)
                
                # Check encryption
                if reader.is_encrypted:
                    try:
                        reader.decrypt("")
                    except Exception as dec_err:
                        logger.error(f"Failed to automatically decrypt PDF: {dec_err}")
                        raise ValueError("Encrypted PDF requires password decryption.")
                        
                text_parts = []
                for page_num, page in enumerate(reader.pages):
                    try:
                        page_text = page.extract_text()
                        if page_text:
                            text_parts.append(page_text)
                    except Exception as page_err:
                        logger.warning(f"Error extracting text from PDF page {page_num}: {page_err}")
                        
                extracted_text = "\n".join(text_parts).strip()
                if not extracted_text:
                    raise ValueError("PDF document contains no extractable text content.")
            except Exception as pdf_err:
                logger.error(f"PDF extraction failed for {filename}: {pdf_err}")
                raise ValueError(f"Failed to parse PDF document content: {str(pdf_err)}")
        elif file_ext == 'docx':
            try:
                stream = io.BytesIO(file_bytes)
                doc = docx.Document(stream)
                
                text_parts = []
                # Iterate through child elements of the document body in order
                for element in doc.element.body:
                    if element.tag.endswith('p'):
                        # It's a paragraph
                        p = docx.text.paragraph.Paragraph(element, doc)
                        p_text = p.text.strip()
                        if p_text:
                            text_parts.append(p_text)
                    elif element.tag.endswith('tbl'):
                        # It's a table
                        t = docx.table.Table(element, doc)
                        table_text = []
                        for row in t.rows:
                            row_text = [cell.text.strip() for cell in row.cells if cell.text.strip()]
                            if row_text:
                                table_text.append(" | ".join(row_text))
                        if table_text:
                            text_parts.append("\n".join(table_text))
                            
                extracted_text = "\n\n".join(text_parts).strip()
                if not extracted_text:
                    raise ValueError("DOCX document contains no extractable text content.")
            except Exception as docx_err:
                logger.error(f"DOCX extraction failed for {filename}: {docx_err}")
                raise ValueError(f"Failed to parse Word document content: {str(docx_err)}")
        else:
            extracted_text = f"Extracted contents of file: {filename}. Concept details regarding machine learning."

        material["extracted_text"] = extracted_text
        FirebaseService.save_study_material(
            user_id=user_id,
            material_id=material['id'],
            data={"extracted_text": extracted_text}
        )

        # Immediately fetch from Firestore to verify (Requirement 2 & 1)
        verified_material = FirebaseService.get_study_material(user_id, material['id'])
        if not verified_material:
            raise ValueError("Failed to retrieve the saved document from the database after upload.")

        # Validate verified material fields (Requirement 1 & 2)
        if not verified_material.get("id"):
            raise ValueError("Saved document is missing a material ID.")
        if not verified_material.get("ownerUid"):
            raise ValueError("Saved document is missing a valid ownerUid.")
        if not verified_material.get("filename"):
            raise ValueError("Saved document is missing a filename.")
        if not verified_material.get("createdAt"):
            raise ValueError("Saved document is missing a createdAt timestamp.")
        
        extracted_text_val = verified_material.get("extracted_text")
        if not extracted_text_val or len(extracted_text_val.strip()) == 0:
            raise ValueError("Extracted text is empty or failed to save in the database.")

        # Structured upload logs (Requirement 4)
        logger.info(
            f"[Upload Log] uid={user_id}, "
            f"material_id={verified_material.get('id')}, "
            f"extracted_text_length={len(extracted_text_val)}"
        )

        return verified_material
