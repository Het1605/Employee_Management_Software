import sys
import os
from sqlalchemy import create_engine, text

# Add the backend directory to sys.path to allow imports
sys.path.append(os.path.join(os.getcwd(), 'backend'))

# We will try to get the SECRET_KEY from env or use a dummy for the settings import
os.environ.setdefault("SECRET_KEY", "dummy_key_for_migration")
os.environ.setdefault("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/employee_db")

try:
    from backend.app.core.config import settings
    # Try the settings URL first (with localhost swap)
    base_url = settings.DATABASE_URL.replace("@db:", "@localhost:")
except Exception:
    base_url = "postgresql://postgres:postgres@localhost:5432/employee_db"

connection_strings = [
    base_url,
    "postgresql://het@localhost:5432/employee_db",
    "postgresql://postgres@localhost:5432/employee_db",
    "postgresql://localhost:5432/employee_db"
]

def migrate():
    last_err = None
    for url in connection_strings:
        if not url: continue
        try:
            print(f"Attempting to connect with: {url}")
            engine = create_engine(url)
            with engine.connect() as conn:
                print(f"Connected successfully with {url}. Running migration...")
                
                # 1. Update leave_structures
                print("Updating leave_structures...")
                conn.execute(text("ALTER TABLE leave_structures ADD COLUMN IF NOT EXISTS company_id INTEGER"))
                conn.execute(text("UPDATE leave_structures SET company_id = 1 WHERE company_id IS NULL"))
                conn.execute(text("ALTER TABLE leave_structures ALTER COLUMN company_id SET NOT NULL"))
                conn.execute(text("ALTER TABLE leave_structures DROP CONSTRAINT IF EXISTS leave_structures_name_key"))
                conn.execute(text("ALTER TABLE leave_structures DROP CONSTRAINT IF EXISTS uq_leave_structure_name_per_company"))
                conn.execute(text("ALTER TABLE leave_structures ADD CONSTRAINT uq_leave_structure_name_per_company UNIQUE (company_id, name)"))

                # 2. Update leave_assignments
                print("Updating leave_assignments...")
                conn.execute(text("ALTER TABLE leave_assignments ADD COLUMN IF NOT EXISTS company_id INTEGER"))
                conn.execute(text("UPDATE leave_assignments SET company_id = 1 WHERE company_id IS NULL"))
                conn.execute(text("ALTER TABLE leave_assignments ALTER COLUMN company_id SET NOT NULL"))

                # 3. Update leave_balances
                print("Updating leave_balances...")
                conn.execute(text("ALTER TABLE leave_balances ADD COLUMN IF NOT EXISTS company_id INTEGER"))
                conn.execute(text("UPDATE leave_balances SET company_id = 1 WHERE company_id IS NULL"))
                conn.execute(text("ALTER TABLE leave_balances ALTER COLUMN company_id SET NOT NULL"))
                conn.execute(text("ALTER TABLE leave_balances DROP CONSTRAINT IF EXISTS uq_user_leave_balance_period"))
                conn.execute(text("ALTER TABLE leave_balances ADD CONSTRAINT uq_user_leave_balance_period UNIQUE (user_id, leave_type, year, month, company_id)"))

                # 4. Update leave_structure_details
                print("Updating leave_structure_details...")
                conn.execute(text("ALTER TABLE leave_structure_details ALTER COLUMN total_days TYPE NUMERIC(8,2)"))

                conn.commit()
                print("Migration completed successfully.")
                return True
        except Exception as e:
            print(f"Failed with {url}: {e}")
            last_err = e
    
    if last_err:
        raise last_err
    return False

if __name__ == "__main__":
    try:
        migrate()
    except Exception as e:
        print(f"\nMigration failed after all attempts: {e}")
        sys.exit(1)
