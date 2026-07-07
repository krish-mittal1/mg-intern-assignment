from __future__ import annotations

from typing import Any

import httpx

from .config import settings


def _auth_headers() -> dict[str, str]:
    return {
        "x-client-id": settings.x_client_id,
        "x-client-secret": settings.x_client_secret,
        "x-product-instance-id": settings.x_product_instance_id,
    }


class SetuClient:
    def __init__(self) -> None:
        self.base_url = settings.setu_base_url.rstrip("/")

    async def upload_document(self, *, pdf_bytes: bytes, filename: str) -> dict[str, Any]:
        url = f"{self.base_url}/api/documents"
        files = {"document": (filename, pdf_bytes, "application/pdf")}
        data = {"name": filename}
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(url, headers=_auth_headers(), files=files, data=data)
            resp.raise_for_status()
            return resp.json()

    async def create_signature(
        self,
        *,
        document_id: str,
        redirect_url: str | None,
        signers: list[dict[str, Any]],
    ) -> dict[str, Any]:
        url = f"{self.base_url}/api/signature"
        payload: dict[str, Any] = {
            "documentId": document_id,
            "signers": signers,
        }
        if redirect_url:
            payload["redirectUrl"] = redirect_url

        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(url, headers=_auth_headers(), json=payload)
            resp.raise_for_status()
            return resp.json()

    async def get_signature_status(self, *, signature_id: str) -> dict[str, Any]:
        url = f"{self.base_url}/api/signature/{signature_id}"
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.get(url, headers=_auth_headers())
            resp.raise_for_status()
            return resp.json()

    async def download_document(self, *, signature_id: str) -> tuple[bytes, str]:
        url = f"{self.base_url}/api/signature/{signature_id}/download/"
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.get(url, headers=_auth_headers())
            resp.raise_for_status()
            data = resp.json()
            download_url = data.get("downloadUrl")
            if not download_url:
                raise ValueError("No downloadUrl in Setu response")
            pdf_resp = await client.get(download_url)
            pdf_resp.raise_for_status()
            content_type = pdf_resp.headers.get("content-type", "application/pdf")
            return pdf_resp.content, content_type
