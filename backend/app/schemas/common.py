from pydantic import BaseModel, ConfigDict, Field


class LoginRequest(BaseModel):
    email: str = Field(min_length=5, max_length=160)
    password: str = Field(min_length=8, max_length=128)


class UserResponse(BaseModel):
    id: int
    nombre: str
    correo: str
    rol: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class ClientBase(BaseModel):
    razon_social: str = Field(min_length=2, max_length=180)
    identificacion_fiscal: str = Field(min_length=3, max_length=30)
    correo_contacto: str | None = None
    telefono: str | None = None
    estado: str = "ACTIVO"


class ClientCreate(ClientBase):
    pass


class ClientResponse(ClientBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


class TicketCreate(BaseModel):
    cliente_id: int
    tipo_requerimiento: str = Field(min_length=2, max_length=50)
    prioridad: str = "P3"
    asunto: str = Field(min_length=3, max_length=180)
    descripcion: str = Field(min_length=5, max_length=2000)


class TicketResponse(TicketCreate):
    id: int
    creado_por: int
    estado: str


class InventoryCreate(BaseModel):
    sku: str = Field(min_length=2, max_length=60)
    nombre: str = Field(min_length=2, max_length=180)
    categoria: str = Field(min_length=2, max_length=80)
    stock: int = Field(ge=0)
    stock_minimo: int = Field(ge=0)
    precio_unitario: float = Field(ge=0)
    ubicacion: str | None = None


class InventoryResponse(InventoryCreate):
    id: int
    activo: int


class OrderCreate(BaseModel):
    cliente_id: int
    ticket_id: int | None = None
    equipo: str | None = None
    prioridad: str = "P3"
    diagnostico: str | None = None


class OrderResponse(OrderCreate):
    id: int
    estado: str
