from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database.connection import get_db
from app.database.models import UserModel
from app.auth.security import decode_access_token

security = HTTPBearer(auto_error=False)


async def get_current_user_optional(
    auth: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> Optional[UserModel]:
    if not auth or not auth.credentials:
        # Fallback to guest user if exists or return None
        result = await db.execute(select(UserModel).where(UserModel.email == "guest@patent.ai"))
        guest = result.scalar_one_or_none()
        if not guest:
            from app.auth.security import hash_password
            guest = UserModel(
                email="guest@patent.ai",
                hashed_password=hash_password("guest123"),
                full_name="Guest User"
            )
            db.add(guest)
            await db.commit()
            await db.refresh(guest)
        return guest

    payload = decode_access_token(auth.credentials)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_email = payload["sub"]
    result = await db.execute(select(UserModel).where(UserModel.email == user_email))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


async def get_current_user(
    user: Optional[UserModel] = Depends(get_current_user_optional)
) -> UserModel:
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user
