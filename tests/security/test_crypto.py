"""
Security Unit Tests for AES-256 Cryptographic Payload Encryption.
"""

from backend.security.crypto import encrypt_payload, decrypt_payload


def test_aes256_encryption_decryption_roundtrip():
    original = "sensitive.user@enterprise.com"
    encrypted = encrypt_payload(original)

    assert encrypted.startswith("enc:aes256:")
    assert encrypted != original

    decrypted = decrypt_payload(encrypted)
    assert decrypted == original


def test_idempotent_encryption():
    raw = "confidential_api_secret_key"
    enc1 = encrypt_payload(raw)
    enc2 = encrypt_payload(enc1)  # Passing already encrypted payload
    assert enc1 == enc2
