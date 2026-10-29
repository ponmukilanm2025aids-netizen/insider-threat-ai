from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from backend.app.core.config import settings, PROJECT_ROOT

db_url = settings.DATABASE_URL
if db_url.startswith("sqlite"):
    if db_url.startswith("sqlite:///") and not (":" in db_url[11:] or db_url.startswith("sqlite:////")):
        clean_rel = db_url.replace("sqlite:///", "").lstrip("./")
        abs_db_path = (PROJECT_ROOT / clean_rel).resolve().as_posix()
        db_url = f"sqlite:///{abs_db_path}"

    engine = create_engine(
        db_url,
        connect_args={"check_same_thread": False}
    )
elif db_url.startswith(("postgresql://", "postgresql+psycopg2://")):
    engine = create_engine(
        db_url,
        pool_pre_ping=True
    )
else:
    raise ValueError("DATABASE_URL must use PostgreSQL or SQLite")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
