from collections.abc import Generator
import urllib.parse
from typing import Any

from fastapi import HTTPException, status
import pg8000.dbapi

from app.core.config import get_settings

settings = get_settings()
pool = None


class Row(dict):
    """Fila compatible con acceso por clave de columna row['col'] y por índice row[0]."""

    def __init__(self, cols, vals):
        super().__init__(zip(cols, vals))
        self._vals = tuple(vals)

    def __getitem__(self, key):
        if isinstance(key, int):
            return self._vals[key]
        return super().__getitem__(key)


class SupabaseCursorWrapper:
    def __init__(self, cursor):
        self._cursor = cursor
        self.lastrowid = None

    def fetchone(self) -> Row | None:
        row = self._cursor.fetchone()
        if row is None:
            return None
        cols = [desc[0] for desc in self._cursor.description]
        return Row(cols, row)

    def fetchall(self) -> list[Row]:
        if not self._cursor.description:
            return []
        cols = [desc[0] for desc in self._cursor.description]
        return [Row(cols, row) for row in self._cursor.fetchall()]


class SupabaseConnectionWrapper:
    def __init__(self, connection):
        self._conn = connection

    def execute(self, sql: str, params: tuple | list = ()):
        # Convertir marcadores '?' a '%s' para PostgreSQL / Supabase
        pg_sql = sql.replace("?", "%s")
        cursor = self._conn.cursor()

        # Si es INSERT sin cláusula RETURNING, añadir RETURNING id para capturar lastrowid
        is_insert = pg_sql.strip().upper().startswith("INSERT")
        if is_insert and "RETURNING" not in pg_sql.upper():
            pg_sql = f"{pg_sql} RETURNING id"
            cursor.execute(pg_sql, params)
            wrapper = SupabaseCursorWrapper(cursor)
            res = cursor.fetchone()
            if res:
                wrapper.lastrowid = res[0]
            return wrapper

        cursor.execute(pg_sql, params)
        return SupabaseCursorWrapper(cursor)

    def commit(self):
        self._conn.commit()

    def rollback(self):
        self._conn.rollback()

    def close(self):
        self._conn.close()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is not None:
            self.rollback()
        else:
            self.commit()



def get_supabase_connection() -> SupabaseConnectionWrapper:
    if not settings.supabase_db_url:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="SUPABASE_DB_URL no está configurado en las variables de entorno.",
        )
    url_str = settings.supabase_db_url
    for prefix in ("postgresql+pg8000://", "postgresql+psycopg2://", "postgres://"):
        if url_str.startswith(prefix):
            url_str = "postgresql://" + url_str[len(prefix):]
            break
    parsed = urllib.parse.urlparse(url_str)
    try:
        raw_conn = pg8000.dbapi.connect(
            user=parsed.username or "postgres",
            password=parsed.password or "",
            host=parsed.hostname or "localhost",
            port=parsed.port or 5432,
            database=parsed.path.lstrip("/") or "postgres",
            ssl_context=True,
        )
        return SupabaseConnectionWrapper(raw_conn)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"No se pudo conectar a la base de datos de Supabase: {str(exc)}",
        ) from exc


def get_connection() -> Generator[SupabaseConnectionWrapper, None, None]:
    connection = get_supabase_connection()
    try:
        yield connection
    finally:
        connection.close()
