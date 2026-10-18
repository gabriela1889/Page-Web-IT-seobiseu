from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.security import get_current_user, require_roles
from app.database.connection import get_connection
from app.schemas.common import (
    ClientCreate, ClientResponse, InventoryCreate, InventoryResponse,
    OrderCreate, OrderResponse, TicketCreate, TicketResponse,
)

router = APIRouter(tags=["resources"])


@router.get("/clientes", response_model=list[ClientResponse])
def list_clients(search: str | None = None, connection=Depends(get_connection), _=Depends(get_current_user)):
    term = f"%{search.strip()}%" if search else "%"
    rows = connection.execute(
        "SELECT id, razon_social, identificacion_fiscal, correo_contacto, telefono, estado "
        "FROM clientes WHERE razon_social LIKE ? OR identificacion_fiscal LIKE ? ORDER BY razon_social",
        (term, term),
    ).fetchall()
    return [dict(row) for row in rows]


@router.post("/clientes", response_model=ClientResponse, status_code=status.HTTP_201_CREATED)
def create_client(
    payload: ClientCreate,
    connection=Depends(get_connection),
    _=Depends(require_roles("ADMINISTRADOR", "SUPERVISOR")),
):
    try:
        cursor = connection.execute(
            "INSERT INTO clientes (razon_social, identificacion_fiscal, correo_contacto, telefono, estado) "
            "VALUES (?, ?, ?, ?, ?)",
            tuple(payload.model_dump().values()),
        )
        connection.commit()
    except Exception as error:
        connection.rollback()
        raise HTTPException(status_code=409, detail="El cliente ya existe o contiene datos inválidos.") from error
    return {"id": cursor.lastrowid, **payload.model_dump()}


@router.get("/tickets", response_model=list[TicketResponse])
def list_tickets(estado: str | None = None, prioridad: str | None = None, connection=Depends(get_connection), _=Depends(get_current_user)):
    clauses, values = [], []
    if estado:
        clauses.append("estado = ?")
        values.append(estado)
    if prioridad:
        clauses.append("prioridad = ?")
        values.append(prioridad)
    where = f"WHERE {' AND '.join(clauses)}" if clauses else ""
    rows = connection.execute(f"SELECT * FROM tickets {where} ORDER BY id DESC", values).fetchall()
    return [dict(row) for row in rows]


@router.post("/tickets", response_model=TicketResponse, status_code=status.HTTP_201_CREATED)
def create_ticket(payload: TicketCreate, connection=Depends(get_connection), user=Depends(get_current_user)):
    if connection.execute("SELECT 1 FROM clientes WHERE id = ?", (payload.cliente_id,)).fetchone() is None:
        raise HTTPException(status_code=404, detail="Cliente no encontrado.")
    cursor = connection.execute(
        "INSERT INTO tickets (cliente_id, creado_por, tipo_requerimiento, prioridad, asunto, descripcion) "
        "VALUES (?, ?, ?, ?, ?, ?)",
        (payload.cliente_id, user["id"], payload.tipo_requerimiento, payload.prioridad, payload.asunto, payload.descripcion),
    )
    connection.commit()
    return {"id": cursor.lastrowid, "creado_por": user["id"], "estado": "ABIERTO", **payload.model_dump()}


@router.get("/inventario", response_model=list[InventoryResponse])
def list_inventory(
    connection=Depends(get_connection),
    _=Depends(require_roles("ADMINISTRADOR", "SUPERVISOR", "TECNICO")),
):
    return [dict(row) for row in connection.execute("SELECT * FROM inventario WHERE activo = TRUE ORDER BY nombre").fetchall()]


@router.post("/inventario", response_model=InventoryResponse, status_code=status.HTTP_201_CREATED)
def create_inventory(
    payload: InventoryCreate,
    connection=Depends(get_connection),
    _=Depends(require_roles("ADMINISTRADOR", "SUPERVISOR")),
):
    cursor = connection.execute(
        "INSERT INTO inventario (sku, nombre, categoria, stock, stock_minimo, precio_unitario, ubicacion) "
        "VALUES (?, ?, ?, ?, ?, ?, ?)",
        tuple(payload.model_dump().values()),
    )
    connection.commit()
    return {"id": cursor.lastrowid, "activo": True, **payload.model_dump()}


@router.get("/ordenes", response_model=list[OrderResponse])
def list_orders(
    connection=Depends(get_connection),
    _=Depends(require_roles("ADMINISTRADOR", "SUPERVISOR", "TECNICO")),
):
    return [dict(row) for row in connection.execute("SELECT * FROM ordenes_trabajo ORDER BY id DESC").fetchall()]


@router.post("/ordenes", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(
    payload: OrderCreate,
    connection=Depends(get_connection),
    _=Depends(require_roles("ADMINISTRADOR", "SUPERVISOR", "TECNICO")),
):
    cursor = connection.execute(
        "INSERT INTO ordenes_trabajo (cliente_id, ticket_id, equipo, prioridad, diagnostico) VALUES (?, ?, ?, ?, ?)",
        (payload.cliente_id, payload.ticket_id, payload.equipo, payload.prioridad, payload.diagnostico),
    )
    connection.commit()
    return {"id": cursor.lastrowid, "estado": "PENDIENTE", **payload.model_dump()}


@router.get("/telemetria/resumen")
def dashboard(
    connection=Depends(get_connection),
    _=Depends(require_roles("ADMINISTRADOR", "SUPERVISOR")),
):
    queries = {
        "tickets_abiertos": "SELECT COUNT(*) FROM tickets WHERE estado NOT IN ('CERRADO', 'RESUELTO')",
        "ordenes_activas": "SELECT COUNT(*) FROM ordenes_trabajo WHERE estado NOT IN ('COMPLETADA', 'CANCELADA')",
        "stock_critico": "SELECT COUNT(*) FROM inventario WHERE activo = TRUE AND stock <= stock_minimo",
        "clientes_activos": "SELECT COUNT(*) FROM clientes WHERE estado = 'ACTIVO'",
    }
    return {key: connection.execute(query).fetchone()[0] for key, query in queries.items()}
