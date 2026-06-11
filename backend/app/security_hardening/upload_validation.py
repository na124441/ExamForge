from fastapi import UploadFile, HTTPException, status

ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".pdf", ".json", ".txt", ".csv"}
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 # 10MB

def validate_uploaded_file(file: UploadFile, content: bytes):
    """
    Validates the uploaded file size and extension to prevent malicious file uploads.
    """
    # 1. Check file size
    if len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds the 10MB limit."
        )

    # 2. Check extension
    filename = file.filename or ""
    import os
    ext = os.path.splitext(filename.lower())[1]
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File type is not allowed. Rejecting dangerous upload."
        )
    
    # Simple check for execution signatures inside text/JSON files
    if ext in [".txt", ".json", ".csv"]:
        content_str = content.decode("utf-8", errors="ignore").lower()
        # look for typical shell code patterns
        if "eval(" in content_str or "exec(" in content_str or "system(" in content_str or "import os" in content_str:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File content contains suspicious script patterns. Upload rejected."
            )
            
    return True
