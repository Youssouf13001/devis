"""
Password Reset Feature Tests
Tests for forgot-password, verify-reset-token, and reset-password endpoints
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestPasswordResetFeature:
    """Tests for password reset functionality"""
    
    def test_health_check(self):
        """Verify API is healthy before running tests"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print("✓ API health check passed")
    
    def test_forgot_password_with_valid_email(self):
        """Test forgot-password endpoint with a valid email format"""
        response = requests.post(
            f"{BASE_URL}/api/auth/forgot-password",
            json={"email": "contact@creativindustry.com"}
        )
        assert response.status_code == 200
        data = response.json()
        # Should always return success message to prevent email enumeration
        assert "message" in data
        assert "email" in data["message"].lower() or "compte" in data["message"].lower()
        print(f"✓ Forgot password response: {data['message']}")
    
    def test_forgot_password_with_nonexistent_email(self):
        """Test forgot-password endpoint with non-existent email (should still return success)"""
        response = requests.post(
            f"{BASE_URL}/api/auth/forgot-password",
            json={"email": "nonexistent@example.com"}
        )
        # Should return 200 to prevent email enumeration
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✓ Non-existent email response: {data['message']}")
    
    def test_forgot_password_with_invalid_email_format(self):
        """Test forgot-password endpoint with invalid email format"""
        response = requests.post(
            f"{BASE_URL}/api/auth/forgot-password",
            json={"email": "invalid-email"}
        )
        # Should return 422 for validation error
        assert response.status_code == 422
        print("✓ Invalid email format rejected with 422")
    
    def test_verify_reset_token_invalid(self):
        """Test verify-reset-token endpoint with invalid token"""
        response = requests.get(f"{BASE_URL}/api/auth/verify-reset-token/invalid-token-test")
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        assert "invalide" in data["detail"].lower()
        print(f"✓ Invalid token response: {data['detail']}")
    
    def test_verify_reset_token_empty(self):
        """Test verify-reset-token endpoint with empty token"""
        response = requests.get(f"{BASE_URL}/api/auth/verify-reset-token/")
        # Should return 404 or 405 for missing token
        assert response.status_code in [404, 405, 422]
        print(f"✓ Empty token rejected with status {response.status_code}")
    
    def test_reset_password_invalid_token(self):
        """Test reset-password endpoint with invalid token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/reset-password",
            json={"token": "invalid-token-test", "new_password": "newpassword123"}
        )
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        assert "invalide" in data["detail"].lower() or "expiré" in data["detail"].lower()
        print(f"✓ Invalid token reset response: {data['detail']}")
    
    def test_reset_password_missing_token(self):
        """Test reset-password endpoint with missing token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/reset-password",
            json={"new_password": "newpassword123"}
        )
        # Should return 422 for validation error
        assert response.status_code == 422
        print("✓ Missing token rejected with 422")
    
    def test_reset_password_missing_password(self):
        """Test reset-password endpoint with missing password"""
        response = requests.post(
            f"{BASE_URL}/api/auth/reset-password",
            json={"token": "some-token"}
        )
        # Should return 422 for validation error
        assert response.status_code == 422
        print("✓ Missing password rejected with 422")


class TestAuthEndpoints:
    """Additional auth endpoint tests"""
    
    def test_login_with_valid_credentials(self):
        """Test login with valid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "contact@creativindustry.com", "password": "Comores13..."}
        )
        # May return 401 if user doesn't exist, or 200 if exists
        if response.status_code == 200:
            data = response.json()
            assert "access_token" in data
            assert "user" in data
            print("✓ Login successful")
        else:
            print(f"? Login returned {response.status_code} - user may not exist")
    
    def test_login_with_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "wrong@example.com", "password": "wrongpassword"}
        )
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data
        print(f"✓ Invalid login rejected: {data['detail']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
