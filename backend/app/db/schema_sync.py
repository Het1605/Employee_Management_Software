from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine


def sync_structure_component_schema(engine: Engine) -> None:
    if engine.dialect.name.lower() != "postgresql":
        return

    with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as conn:
        conn.execute(text("ALTER TYPE calculationtype ADD VALUE IF NOT EXISTS 'FORMULA'"))

    with engine.begin() as conn:
        inspector = inspect(conn)

        if not inspector.has_table("structure_components"):
            return

        columns = {column["name"] for column in inspector.get_columns("structure_components")}
        if "formula" not in columns:
            conn.execute(text("ALTER TABLE structure_components ADD COLUMN formula VARCHAR"))

        conn.execute(text("ALTER TABLE structure_components ALTER COLUMN value DROP NOT NULL"))
        conn.execute(text("ALTER TABLE structure_components ALTER COLUMN based_on DROP NOT NULL"))
