"""
Security Unit Tests for Multi-Tenant RBAC Permissions.
"""

import pytest
from fastapi import HTTPException
from backend.security.auth import verify_rbac_permission


def test_admin_role_permission_granted():
    role = verify_rbac_permission(required_role="Operator", x_user_role="Admin")
    assert role == "Admin"


def test_auditor_role_permission_denied():
    with pytest.raises(HTTPException) as exc:
        verify_rbac_permission(required_role="Operator", x_user_role="Auditor")
    assert exc.value.status_code == 403
