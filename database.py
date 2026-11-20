"""Persistencia SQLite de corridas y mediciones de cada fase."""
from __future__ import annotations
import json
import os
from pathlib import Path
import sqlite3
from datetime import datetime
from zoneinfo import ZoneInfo

DB_PATH = Path(os.environ.get("AIRQI_DB_PATH", str(Path(__file__).parent / "data" / "mediciones.db")))
ZONE = ZoneInfo("America/Bogota")


def connect(db_path: str | Path | None = None) -> sqlite3.Connection:
    path = Path(db_path) if db_path is not None else DB_PATH
    path.parent.mkdir(parents=True, exist_ok=True)
    con = sqlite3.connect(path, timeout=15)
    con.row_factory = sqlite3.Row
    con.execute("PRAGMA foreign_keys = ON")
    con.execute("PRAGMA busy_timeout = 15000")
    return con


def initialize(db_path: str | Path | None = None) -> None:
    with connect(db_path) as con:
        con.executescript("""
        CREATE TABLE IF NOT EXISTS runs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            created_at TEXT NOT NULL,
            scenario TEXT NOT NULL,
            filter_name TEXT NOT NULL,
            duration_min INTEGER NOT NULL CHECK(duration_min BETWEEN 1 AND 120),
            initial_quality TEXT NOT NULL,
            final_quality TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS measurements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            run_id INTEGER NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
            phase TEXT NOT NULL CHECK(phase IN ('entrada','proceso','salida')),
            minute REAL NOT NULL,
            pm25 REAL NOT NULL, pm10 REAL NOT NULL, co2 REAL NOT NULL,
            co REAL NOT NULL, voc REAL NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_measurements_run ON measurements(run_id);
        """)


def save_run(scenario: str, filter_name: str, duration: int,
             trajectory: list[dict], initial_quality: str, final_quality: str,
             db_path: str | Path | None = None) -> int:
    if len(trajectory) < 2:
        raise ValueError("Trayectoria incompleta")
    with connect(db_path) as con:
        cur = con.execute("""INSERT INTO runs
            (created_at, scenario, filter_name, duration_min, initial_quality, final_quality)
            VALUES (?, ?, ?, ?, ?, ?)""",
            (datetime.now(ZONE).isoformat(timespec="seconds"), scenario, filter_name,
             duration, initial_quality, final_quality))
        run_id = cur.lastrowid
        rows = []
        for idx, point in enumerate(trajectory):
            phase = "entrada" if idx == 0 else "salida" if idx == len(trajectory) - 1 else "proceso"
            rows.append((run_id, phase, point["minute"], *(point[k] for k in ("pm25", "pm10", "co2", "co", "voc"))))
        con.executemany("""INSERT INTO measurements
            (run_id,phase,minute,pm25,pm10,co2,co,voc) VALUES (?,?,?,?,?,?,?,?)""", rows)
    return int(run_id)


def list_runs(db_path: str | Path | None = None) -> list[dict]:
    with connect(db_path) as con:
        return [dict(row) for row in con.execute("SELECT * FROM runs ORDER BY id DESC")]


def get_measurements(run_id: int, db_path: str | Path | None = None) -> list[dict]:
    with connect(db_path) as con:
        return [dict(row) for row in con.execute(
            "SELECT phase,minute,pm25,pm10,co2,co,voc FROM measurements WHERE run_id=? ORDER BY id", (run_id,))]


def export_records(db_path: str | Path | None = None) -> list[dict]:
    with connect(db_path) as con:
        return [dict(row) for row in con.execute("""
        SELECT r.id AS run_id,r.created_at,r.scenario,r.filter_name,r.duration_min,
               r.initial_quality,r.final_quality,m.phase,m.minute,m.pm25,m.pm10,m.co2,m.co,m.voc
        FROM runs r JOIN measurements m ON m.run_id=r.id ORDER BY r.id DESC,m.id
        """)]
