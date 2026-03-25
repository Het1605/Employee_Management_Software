from fastapi import Depends, HTTPException, status
from typing import List
from app.api.dependencies.auth import get_current_user
from app.db.models import User

def role_required(allowed_roles: List[str]):
    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role.upper() not in [role.upper() for role in allowed_roles]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action"
            )
        return current_user
    return role_checker
