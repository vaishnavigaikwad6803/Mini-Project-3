import os
import sys
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models.user import User, UserRole
from app.models.auth_tokens import EmailVerification, PasswordReset, RefreshToken, LoginAttempt
from app.services.email_service import get_dev_email_inbox, clear_dev_email_inbox

client = TestClient(app)

def run_tests():
    print("=" * 70)
    print("🧪 RoadGuard AI - Email Authentication & Verification Test Suite")
    print("=" * 70)

    clear_dev_email_inbox()
    db = SessionLocal()

    test_email = "test.citizen.verification@roadguard.ai"

    # Cleanup any prior run test data
    prior_user = db.query(User).filter(User.email == test_email).first()
    if prior_user:
        db.delete(prior_user)
        db.commit()
    db.query(LoginAttempt).filter(LoginAttempt.email == test_email).delete()
    db.commit()

    # -------------------------------------------------------------------------
    # 1. Validation Tests: Weak password & invalid email rejected
    # -------------------------------------------------------------------------
    print("\n--- 1. Testing Validation on Registration ---")
    weak_pwd_res = client.post("/api/auth/register", json={
        "full_name": "Test User",
        "email": test_email,
        "password": "weak",
        "confirm_password": "weak"
    })
    assert weak_pwd_res.status_code == 422 or weak_pwd_res.status_code == 400, f"Weak password should be rejected: {weak_pwd_res.text}"
    print("✓ Weak password properly rejected by validation.")

    mismatch_pwd_res = client.post("/api/auth/register", json={
        "full_name": "Test User",
        "email": test_email,
        "password": "Password123!",
        "confirm_password": "DifferentPassword123!"
    })
    assert mismatch_pwd_res.status_code == 422 or mismatch_pwd_res.status_code == 400, "Password mismatch should be rejected."
    print("✓ Password mismatch rejected by validation.")

    # -------------------------------------------------------------------------
    # 2. Registration with Valid Data
    # -------------------------------------------------------------------------
    print("\n--- 2. Testing Valid User Registration ---")
    reg_res = client.post("/api/auth/register", json={
        "full_name": "Rohit Sharma",
        "email": test_email,
        "phone": "+91 9876543210",
        "password": "StrongPassword123!",
        "confirm_password": "StrongPassword123!",
        "district": "Pune",
        "state": "Maharashtra"
    })
    assert reg_res.status_code == 200, f"Registration failed: {reg_res.text}"
    reg_data = reg_res.json()
    assert reg_data["is_verified"] is False, "New user must have is_verified=False"
    print(f"✓ Registered new user: {reg_data['email']}, requires verification: {reg_data['requires_email_verification']}")

    # Verify email was dispatched to inbox
    inbox = get_dev_email_inbox()
    assert len(inbox) >= 1, "Verification email should have been sent to dev inbox"
    last_email = inbox[-1]
    assert last_email["to"] == test_email
    print(f"✓ Verification email sent: '{last_email['subject']}' to {last_email['to']}")

    # -------------------------------------------------------------------------
    # 3. Duplicate Email Registration Prevention
    # -------------------------------------------------------------------------
    print("\n--- 3. Testing Duplicate Email Registration Prevention ---")
    dup_res = client.post("/api/auth/register", json={
        "full_name": "Duplicate Rohit",
        "email": test_email.upper(), # test normalization
        "password": "StrongPassword123!",
        "confirm_password": "StrongPassword123!"
    })
    assert dup_res.status_code == 400, f"Duplicate registration must fail: {dup_res.text}"
    print(f"✓ Duplicate normalized email rejected: {dup_res.json()['detail']}")

    # -------------------------------------------------------------------------
    # 4. Unverified Account Login Prevention
    # -------------------------------------------------------------------------
    print("\n--- 4. Testing Unverified User Login Restriction ---")
    login_unverified_res = client.post("/api/auth/login", json={
        "email": test_email,
        "password": "StrongPassword123!"
    })
    assert login_unverified_res.status_code == 403, f"Unverified login should be blocked with 403: {login_unverified_res.text}"
    print(f"✓ Unverified user blocked from logging in: {login_unverified_res.text}")

    # -------------------------------------------------------------------------
    # 5. OTP Verification Testing (Invalid OTP then Valid OTP)
    # -------------------------------------------------------------------------
    print("\n--- 5. Testing OTP Verification ---")
    wrong_otp_res = client.post("/api/auth/verify-email", json={
        "email": test_email,
        "otp": "000000"
    })
    assert wrong_otp_res.status_code == 400, "Wrong OTP should be rejected"
    print(f"✓ Wrong OTP properly rejected: {wrong_otp_res.json()['detail']}")

    # Retrieve valid OTP from database hash check or email text
    import re
    otp_match = re.search(r"\b\d{6}\b", last_email["text"])
    assert otp_match, "OTP code not found in email body text"
    real_otp = otp_match.group(0)
    print(f"✓ Extracted OTP from generated verification email: {real_otp}")

    # Verify with correct OTP
    verify_res = client.post("/api/auth/verify-email", json={
        "email": test_email,
        "otp": real_otp
    })
    assert verify_res.status_code == 200, f"Valid OTP verification failed: {verify_res.text}"
    token_bundle = verify_res.json()
    assert "access_token" in token_bundle, "Access token missing from verification response"
    assert "refresh_token" in token_bundle, "Refresh token missing from verification response"
    assert token_bundle["is_verified"] is True, "User should now be verified"
    print(f"✓ Account verified successfully! Received JWT access & refresh tokens.")

    # -------------------------------------------------------------------------
    # 6. Login with Verified Credentials
    # -------------------------------------------------------------------------
    print("\n--- 6. Testing Login with Verified User ---")
    login_res = client.post("/api/auth/login", json={
        "email": test_email,
        "password": "StrongPassword123!"
    })
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    login_data = login_res.json()
    access_token = login_data["access_token"]
    refresh_token = login_data["refresh_token"]
    print(f"✓ Logged in successfully as {login_data['email']} (User ID: {login_data['user_id']})")

    # -------------------------------------------------------------------------
    # 7. Protected Route Access with Verified Token
    # -------------------------------------------------------------------------
    print("\n--- 7. Testing Protected /auth/me Endpoint ---")
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {access_token}"})
    assert me_res.status_code == 200, f"Access to /auth/me failed: {me_res.text}"
    me_data = me_res.json()
    assert me_data["email"] == test_email
    assert me_data["is_verified"] is True
    print(f"✓ Successfully accessed protected /auth/me: {me_data['full_name']} (Verified: {me_data['is_verified']})")

    # -------------------------------------------------------------------------
    # 8. Token Refresh Testing
    # -------------------------------------------------------------------------
    print("\n--- 8. Testing Refresh Token Rotation ---")
    refresh_res = client.post("/api/auth/refresh", json={"refresh_token": refresh_token})
    assert refresh_res.status_code == 200, f"Refresh failed: {refresh_res.text}"
    new_token_bundle = refresh_res.json()
    assert new_token_bundle["access_token"] != access_token, "New access token should be generated"
    assert new_token_bundle["refresh_token"] != refresh_token, "Refresh token should be rotated"
    print("✓ Refresh token rotated successfully.")

    # -------------------------------------------------------------------------
    # 9. Password Reset Flow (Forgot Password -> Reset Password -> Login)
    # -------------------------------------------------------------------------
    print("\n--- 9. Testing Password Reset Flow ---")
    forgot_res = client.post("/api/auth/forgot-password", json={"email": test_email})
    assert forgot_res.status_code == 200, f"Forgot password failed: {forgot_res.text}"
    print(f"✓ Forgot password requested: {forgot_res.json()['message']}")

    # Check reset email
    inbox = get_dev_email_inbox()
    reset_email = [m for m in inbox if "Reset" in m["subject"]][-1]
    assert test_email in reset_email["to"]
    print(f"✓ Password reset email sent: '{reset_email['subject']}'")

    # Extract 6-digit code and token
    code_match = re.search(r"Manual 6-digit Code: (\d{6})", reset_email["text"])
    assert code_match, "Reset code not found in reset email"
    reset_code = code_match.group(1)
    print(f"✓ Extracted 6-digit reset code: {reset_code}")

    # Complete reset
    reset_res = client.post("/api/auth/reset-password", json={
        "email": test_email,
        "otp": reset_code,
        "new_password": "NewBrandStrongPassword123!",
        "confirm_password": "NewBrandStrongPassword123!"
    })
    assert reset_res.status_code == 200, f"Password reset failed: {reset_res.text}"
    print(f"✓ Password successfully reset: {reset_res.json()['message']}")

    # Verify old password is rejected
    old_login_res = client.post("/api/auth/login", json={
        "email": test_email,
        "password": "StrongPassword123!"
    })
    assert old_login_res.status_code == 401, "Old password must be rejected"
    print("✓ Old password properly rejected.")

    # Verify new password is accepted
    new_login_res = client.post("/api/auth/login", json={
        "email": test_email,
        "password": "NewBrandStrongPassword123!"
    })
    assert new_login_res.status_code == 200, f"Login with new password failed: {new_login_res.text}"
    print("✓ Login with new password succeeded!")

    # -------------------------------------------------------------------------
    # 10. Logout & Session Invalidation
    # -------------------------------------------------------------------------
    print("\n--- 10. Testing Logout ---")
    active_refresh = new_login_res.json()["refresh_token"]
    logout_res = client.post("/api/auth/logout", json={"refresh_token": active_refresh})
    assert logout_res.status_code == 200, f"Logout failed: {logout_res.text}"
    print(f"✓ Logout endpoint succeeded: {logout_res.json()['message']}")

    # Ensure invalidated refresh token cannot be reused
    reuse_res = client.post("/api/auth/refresh", json={"refresh_token": active_refresh})
    assert reuse_res.status_code == 401, "Revoked refresh token must be rejected"
    print("✓ Revoked refresh token rejected on reuse.")

    print("\n" + "=" * 70)
    print("🎉 ALL 10 AUTHENTICATION & VERIFICATION TESTS PASSED SUCCESSFULLY!")
    print("=" * 70)

if __name__ == "__main__":
    run_tests()
