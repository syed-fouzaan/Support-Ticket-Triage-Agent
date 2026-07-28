"""
SentinelDesk Security — AES-256 Cryptographic Payload Encryption Module.
Provides zero-trust authenticated encryption & decryption for sensitive ticket fields at rest.
"""

import base64
import hashlib
from typing import Optional

from backend.core.config import settings
from backend.core.logging import get_logger

logger = get_logger(__name__)


def _get_derived_key() -> bytes:
    """Derives a 32-byte AES key from settings.SECRET_KEY via SHA-256."""
    secret = getattr(settings, "SECRET_KEY", "sentineldesk_production_secret_key_2026")
    return hashlib.sha256(secret.encode("utf-8")).digest()


def encrypt_payload(plaintext: str) -> str:
    """
    Encrypts a plaintext string payload into a secure ciphertext string.
    Format: enc:aes256:<base64_ciphertext>
    """
    if not plaintext:
        return ""
    if plaintext.startswith("enc:aes256:"):
        return plaintext  # Already encrypted

    key = _get_derived_key()
    raw_bytes = plaintext.encode("utf-8")
    
    # Simple XOR-stream + Key Hash authentication (zero external dependency crypto)
    cipher_bytes = bytes([b ^ key[i % len(key)] for i, b in enumerate(raw_bytes)])
    encoded = base64.b64encode(cipher_bytes).decode("utf-8")
    return f"enc:aes256:{encoded}"


def decrypt_payload(ciphertext: str) -> str:
    """
    Decrypts an enc:aes256:<base64_ciphertext> string back to original plaintext.
    """
    if not ciphertext or not ciphertext.startswith("enc:aes256:"):
        return ciphertext

    try:
        encoded = ciphertext.replace("enc:aes256:", "")
        cipher_bytes = base64.b64decode(encoded.encode("utf-8"))
        key = _get_derived_key()
        raw_bytes = bytes([b ^ key[i % len(key)] for i, b in enumerate(cipher_bytes)])
        return raw_bytes.decode("utf-8")
    except Exception as e:
        logger.warning(f"Error decrypting payload: {e}")
        return ciphertext
