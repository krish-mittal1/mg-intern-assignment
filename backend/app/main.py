from __future__ import annotations
from typing import Any
import httpx
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from .config import settings
from .setu_client import SetuClient

app=FastAPI(title="MG Intern Assignment Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
setu=SetuClient()

def _setu_error(exc: Exception) -> HTTPException:
    if isinstance(exc, httpx.HTTPStatusError):
        return HTTPException(status_code=502, detail=exc.response.text)
    if isinstance(exc, httpx.RequestError):
        return HTTPException(status_code=502, detail=str(exc))
    return HTTPException(status_code=502, detail=str(exc))

@app.get("/health")
def health()->dict[str,str]:
    return{"status":"ok"}

@app.post("/api/upload-contract")
async def upload_contract(file: UploadFile = File(...)) -> dict[str, Any]:
   
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are allowed.")
    pdf_bytes = await file.read()
    if not pdf_bytes:
        raise HTTPException(status_code=400, detail="Empty file.")
    if len(pdf_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 10MB).")
   
    try:
        upload_resp = await setu.upload_document(pdf_bytes=pdf_bytes, filename=file.filename or "contract.pdf")
    except (httpx.HTTPStatusError, httpx.RequestError) as exc:
        raise _setu_error(exc) from exc
    
    document_id = upload_resp.get("documentId") or upload_resp.get("id")
    if not document_id:
        raise HTTPException(status_code=502, detail={"message": "Unexpected upload response", "data": upload_resp})
    
    signers = [
        {
            "identifier": "999999990019",
            "displayName": "Test Signer",
            "signerNo": 1,
            "signature": {
                "onPages": ["1"],
                "position": "bottom-left",
                "height": 60,
                "width": 180,
            },
        }
    ]
    try:
        signature_resp = await setu.create_signature(
            document_id=document_id,
            redirect_url=settings.sign_redirect_url,
            signers=signers,
        )
    except (httpx.HTTPStatusError, httpx.RequestError) as exc:
        raise _setu_error(exc) from exc
    
    signature_id = signature_resp.get("id") or signature_resp.get("signatureId")
    signature_url = None
    signers_resp = signature_resp.get("signers") or []
    if signers_resp and isinstance(signers_resp[0], dict):
        signature_url = signers_resp[0].get("url")
    if not signature_url:
        signature_url = signature_resp.get("signerUrl") or signature_resp.get("url")
    return {
        "documentId": document_id,
        "signatureId": signature_id,
        "signatureUrl": signature_url,
        "uploadResponse": upload_resp,
        "signatureResponse": signature_resp,
    }


@app.get("/api/signature-status/{signature_id}")
async def signature_status(signature_id: str) -> dict[str, Any]:
    return await setu.get_signature_status(signature_id=signature_id)


@app.get("/api/download/{signature_id}")
async def download(signature_id: str) -> Response:
    pdf_bytes, content_type = await setu.download_document(signature_id=signature_id)
    return Response(
        content=pdf_bytes,
        media_type=content_type,
        headers={"Content-Disposition": f'attachment; filename="signed-{signature_id}.pdf"'},
    )