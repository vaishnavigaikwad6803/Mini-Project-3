import secrets
import hashlib
import hmac
import re
from datetime import datetime, timedelta
from typing import Optional, Any, Union, Tuple
import bcrypt
from jose import jwt, JWTError
from app.config import settings

def get_password_hash(password: str) -> str:
    """Hashes a plaintext password using bcrypt with a generated salt."""
    pwd_bytes = password.encode('utf-8')[:72]
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plaintext password against a bcrypt hash."""
    try:
        pwd_bytes = plain_password.encode('utf-8')[:72]
        hash_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(pwd_bytes, hash_bytes)
    except Exception:
        return False

def validate_password_strength(password: str) -> Tuple[bool, Optional[str]]:
    """
    Validates password complexity:
    - Minimum 8 characters
    - At least one lowercase letter
    - At least one uppercase letter
    - At least one number
    - At least one special character
    """
    if not password:
        return False, "Password is required."
    if len(password) < 8:
        return False, "Password must be at least 8 characters long."
    if not re.search(r"[a-z]", password):
        return False, "Password must contain at least one lowercase letter."
    if not re.search(r"[A-Z]", password):
        return False, "Password must contain at least one uppercase letter."
    if not re.search(r"[0-9]", password):
        return False, "Password must contain at least one numeric digit."
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        return False, "Password must contain at least one special character (!@#$%^&* etc.)."
    return True, None

def generate_otp(length: int = 6) -> str:
    """Generates a cryptographically secure random numeric OTP."""
    # 6-digit number between 100000 and 999999
    lower = 10 ** (length - 1)
    upper = (10 ** length) - 1
    code = secrets.randbelow(upper - lower + 1) + lower
    return str(code)

def hash_token(raw_token: str) -> str:
    """Returns SHA-256 hex digest of a token/OTP for secure database storage."""
    return hashlib.sha256(raw_token.strip().encode('utf-8')).hexdigest()

def verify_token_hash(raw_token: str, token_hash: str) -> bool:
    """Constant-time comparison of a token against its stored SHA-256 hash."""
    if not raw_token or not token_hash:
        return False
    computed = hash_token(raw_token)
    return hmac.compare_digest(computed, token_hash)

def generate_secure_token(nbytes: int = 32) -> str:
    """Generates a cryptographically secure URL-safe random string for reset links / refresh tokens."""
    return secrets.token_urlsafe(nbytes)

def create_access_token(
    subject: Union[str, Any],
    expires_delta: Optional[timedelta] = None,
    extra_claims: Optional[dict] = None
) -> str:
    """Creates a signed JWT access token."""
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "iat": datetime.utcnow(),
        "jti": secrets.token_hex(8),
        "type": "access"
    }
    if extra_claims:
        to_encode.update(extra_claims)
        
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[dict]:
    """Decodes and validates a JWT token."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None
