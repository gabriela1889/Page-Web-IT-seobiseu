from fastapi import APIRouter, Depends, HTTPException, status
from pwdlib import PasswordHash

from app.core.security import create_access_token, get_current_user
from app.database.connection import get_connection
from app.schemas.common import LoginRequest, TokenResponse, UserResponse

router = APIRouter(prefix="/auth", tags=["auth"])
password_hash = PasswordHash.recommended()


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, connection=Depends(get_connection)):
    row = connection.execute(
        """
        SELECT u.id, u.nombre, u.correo, u.password_hash, r.nombre AS rol
        FROM usuarios u JOIN roles r ON r.id = u.rol_id
        WHERE lower(u.correo) = lower(?) AND u.activo = TRUE
        """,
        (payload.email,),
    ).fetchone()
    if row is None or not password_hash.verify(payload.password, row["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Correo o contraseña incorrectos.")
    user = UserResponse(id=row["id"], nombre=row["nombre"], correo=row["correo"], rol=row["rol"])
    return TokenResponse(access_token=create_access_token(user.id, user.rol), user=user)


@router.get("/me", response_model=UserResponse)
def me(user=Depends(get_current_user)):
    return user
