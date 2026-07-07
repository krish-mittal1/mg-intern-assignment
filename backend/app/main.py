from __future__ import annotations
from contextlib import asynccontextmanager
from typing import Any
import httpx
from fastapi import Depends, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from .config import settings
from .db import get_session, init_db
from .models import Contract
from .setu_client import SetuClient


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app=FastAPI(title="MG Intern Assignment Backend", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
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
async def upload_contract(
    file: UploadFile = File(...),
    session: AsyncSession = Depends(get_session),
) -> dict[str, Any]:

    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are allowed.")
    pdf_bytes = await file.read()
    if not pdf_bytes:
        raise HTTPException(status_code=400, detail="Empty file.")
    if len(pdf_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 10MB).")

    filename = file.filename or "contract.pdf"

    try:
        upload_resp = await setu.upload_document(pdf_bytes=pdf_bytes, filename=filename)
    except (httpx.HTTPStatusError, httpx.RequestError) as exc:
        raise _setu_error(exc) from exc

    document_id = upload_resp.get("documentId") or upload_resp.get("id")
    if not document_id:
        raise HTTPException(status_code=502, detail={"message": "Unexpected upload response", "data": upload_resp})

    signers = [
        {
            "identifier": "2810806979",
            "displayName": "Shivshankar Choudhury",
            "birthYear": "1968",
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

    status_value = signature_resp.get("status") or "sign_initiated"

    if signature_id:
        record = Contract(
            document_id=document_id,
            signature_id=signature_id,
            signer_url=signature_url,
            filename=filename,
            status=status_value,
        )
        session.add(record)
        await session.commit()

    return {
        "documentId": document_id,
        "signatureId": signature_id,
        "signatureUrl": signature_url,
        "status": status_value,
    }


@app.get("/api/contracts")
async def list_contracts(session: AsyncSession = Depends(get_session)) -> list[dict[str, Any]]:
    result = await session.execute(select(Contract).order_by(Contract.created_at.desc()))
    return [c.to_dict() for c in result.scalars().all()]


@app.get("/api/signature-status/{signature_id}")
async def signature_status(
    signature_id: str,
    session: AsyncSession = Depends(get_session),
) -> dict[str, Any]:
    try:
        data = await setu.get_signature_status(signature_id=signature_id)
    except (httpx.HTTPStatusError, httpx.RequestError) as exc:
        raise _setu_error(exc) from exc

    new_status = data.get("status")
    if new_status:
        result = await session.execute(
            select(Contract).where(Contract.signature_id == signature_id)
        )
        record = result.scalar_one_or_none()
        if record and record.status != new_status:
            record.status = new_status
            await session.commit()

    return data


@app.get("/api/download/{signature_id}")
async def download(signature_id: str) -> Response:
    try:
        pdf_bytes, content_type = await setu.download_document(signature_id=signature_id)
    except (httpx.HTTPStatusError, httpx.RequestError) as exc:
        raise _setu_error(exc) from exc
    return Response(
        content=pdf_bytes,
        media_type=content_type,
        headers={"Content-Disposition": f'attachment; filename="signed-{signature_id}.pdf"'},
    )
