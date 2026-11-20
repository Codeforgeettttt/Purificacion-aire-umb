"""Motor de simulación didáctico. No representa un equipo real certificado."""
from __future__ import annotations
from math import exp
import random

UNITS = {"pm25": "µg/m³", "pm10": "µg/m³", "co2": "ppm", "co": "ppm", "voc": "ppm (equiv. simulado)"}
LABELS = {"pm25": "PM2.5", "pm10": "PM10", "co2": "CO₂", "co": "CO", "voc": "COV"}
FILTERS = {
    "HEPA": {"pm25": 0.95, "pm10": 0.97, "co2": 0.0, "co": 0.0, "voc": 0.0},
    "Carbón activado": {"pm25": 0.0, "pm10": 0.0, "co2": 0.0, "co": 0.0, "voc": 0.75},
    "HEPA + carbón activado": {"pm25": 0.95, "pm10": 0.97, "co2": 0.0, "co": 0.0, "voc": 0.75},
}
# Umbrales didácticos editables. NO son categorías AQI ni certifican salubridad.
THRESHOLDS = {
    "pm25": (15.0, 35.0), "pm10": (45.0, 100.0),
    "co2": (1000.0, 1500.0), "co": (9.0, 25.0), "voc": (0.5, 1.0),
}
PRESETS = {
    "Urbano moderado": {"pm25": 46, "pm10": 82, "co2": 1050, "co": 3.4, "voc": 0.8},
    "Tráfico intenso": {"pm25": 115, "pm10": 190, "co2": 1450, "co": 14, "voc": 1.8},
    "Interior cargado": {"pm25": 24, "pm10": 42, "co2": 2100, "co": 1.8, "voc": 1.5},
    "Aire relativamente limpio": {"pm25": 8, "pm10": 17, "co2": 650, "co": 0.7, "voc": 0.2},
}


def classify(values: dict[str, float]) -> tuple[str, list[str]]:
    """La peor medición determina la clasificación didáctica global."""
    severity = 0
    alerts: list[str] = []
    for pollutant, (moderate, high) in THRESHOLDS.items():
        value = float(values.get(pollutant, 0))
        if value >= high:
            severity = max(severity, 2)
            alerts.append(f"ALTA: {LABELS[pollutant]} = {value:.2f} {UNITS[pollutant]}")
        elif value >= moderate:
            severity = max(severity, 1)
            alerts.append(f"PRECAUCIÓN: {LABELS[pollutant]} = {value:.2f} {UNITS[pollutant]}")
    return ("Alta", "Moderada", "Baja")[2-severity], alerts


def measure(preset: str, seed: int | None = None) -> dict[str, float]:
    """Genera una lectura sintética alrededor de un escenario."""
    if preset not in PRESETS:
        raise ValueError("Escenario desconocido")
    rng = random.Random(seed)
    return {k: round(max(0.0, v * rng.uniform(0.88, 1.12)), 2) for k, v in PRESETS[preset].items()}


def reduction(before: float, after: float) -> float:
    if before <= 0:
        return 0.0
    return round(100 * (before - after) / before, 2)


def simulate(initial: dict[str, float], filter_name: str, minutes: int, steps: int = 6) -> list[dict]:
    """Desciende exponencialmente hasta eficiencia límite al cabo de los minutos.

    Modelo simplificado: fracción eliminada = eficiencia_max * (1-exp(-t/15)).
    Para evitar llamar 'purificación' a una eliminación de gases inexistente,
    CO y CO2 permanecen constantes con estos filtros.
    """
    if filter_name not in FILTERS:
        raise ValueError("Filtro desconocido")
    if not 1 <= minutes <= 120:
        raise ValueError("El tiempo debe estar entre 1 y 120 minutos")
    if steps < 2:
        raise ValueError("Se requieren al menos dos mediciones")
    if set(initial) != set(UNITS) or any(not 0 <= float(v) < 1e9 for v in initial.values()):
        raise ValueError("Mediciones inválidas")
    trajectory = []
    for i in range(steps):
        elapsed = round(minutes * i / (steps - 1), 2)
        progress = 1 - exp(-elapsed / 15.0)
        data = {k: round(float(v) * (1 - FILTERS[filter_name][k] * progress), 2)
                for k, v in initial.items()}
        trajectory.append({"minute": elapsed, **data})
    return trajectory


def recommendations(initial: dict[str, float]) -> list[str]:
    notes = []
    if initial["pm25"] >= THRESHOLDS["pm25"][0] or initial["pm10"] >= THRESHOLDS["pm10"][0]:
        notes.append("El filtro HEPA se utiliza para reducir material particulado en esta simulación.")
    if initial["voc"] >= THRESHOLDS["voc"][0]:
        notes.append("Carbón activado para determinados COV; la eficacia real depende del gas, capacidad y saturación.")
    if initial["co2"] >= THRESHOLDS["co2"][0]:
        notes.append("CO₂ elevado: se requiere evaluar ventilación con aire exterior adecuado; HEPA y carbón no lo reducen aquí.")
    if initial["co"] >= THRESHOLDS["co"][0]:
        notes.append("CO elevado: revisar fuentes y seguridad. La filtración simulada no elimina CO; ante sospecha real, seguir protocolos de emergencia.")
    if not notes:
        notes.append("No hay alertas según los umbrales educativos configurados.")
    return notes
