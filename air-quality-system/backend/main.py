from typing import Optional, List
from datetime import datetime, date, time, timedelta
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
import random
from sqlalchemy import func
from sqlalchemy.orm import Session
from data_collectors.air_quality_collector import OpenMeteoCollector, get_fallback_data
import models
from database import get_db, engine
from repositories.crud import (
    AirQualityRepository,
    TrafficRepository,
    QuadrantStatsRepository,
    PredictionRepository
)

# Crear la aplicación FastAPI
app = FastAPI()

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Crear las tablas de la base de datos
models.Base.metadata.create_all(bind=engine)

# Inicializar el colector
openmeteo_collector = OpenMeteoCollector()

@app.get("/api/test-db")
async def test_database(db: Session = Depends(get_db)):
    try:
        # Intentar crear un registro de prueba
        test_reading = models.AirQualityReading(
            latitude=19.5438,
            longitude=-96.9102,
            pm25=25.0,
            pm10=50.0,
            no2=30.0,
            o3=40.0,
            co=1.0,
            source="test"
        )
        db.add(test_reading)
        db.commit()
        
        # Leer el registro
        latest = db.query(models.AirQualityReading)\
            .order_by(models.AirQualityReading.timestamp.desc())\
            .first()
        
        return {
            "message": "Database test successful", 
            "data": latest.to_dict() if latest else None
        }
    except Exception as e:
        return {"error": f"Database test failed: {str(e)}"}

@app.get("/api/health")
async def health_check():
    return {
        "status": "ok",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/air-quality/latest")
async def get_latest_readings(db: Session = Depends(get_db)):
    """Endpoint para obtener las últimas lecturas"""
    try:
        readings = AirQualityRepository.get_latest_readings(db, limit=10)
        return [reading.to_dict() for reading in readings]
    except Exception as e:
        print(f"Error obteniendo últimas lecturas: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={"error": "Error al obtener últimas lecturas"}
        )

@app.get("/api/air-quality/history")
async def get_air_quality_history(
    start_time: datetime,
    end_time: datetime,
    db: Session = Depends(get_db)
):
    """Endpoint para obtener datos históricos de calidad del aire"""
    try:
        readings = AirQualityRepository.get_readings_in_timeframe(
            db, start_time, end_time
        )
        return [reading.to_dict() for reading in readings]
    except Exception as e:
        print(f"Error en get_air_quality_history: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={"error": "Error al obtener datos históricos"}
        )

@app.get("/api/traffic")
async def get_traffic_data(db: Session = Depends(get_db)):
    """Endpoint para obtener datos de tráfico"""
    try:
        traffic_data = TrafficRepository.get_latest_traffic_data(db)
        return [data.to_dict() for data in traffic_data]
    except Exception as e:
        print(f"Error en get_traffic_data: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={"error": "Error al obtener datos de tráfico"}
        )

@app.get("/api/quadrants/{quadrant_name}/stats")
async def get_quadrant_stats(
    quadrant_name: str,
    db: Session = Depends(get_db)
):
    """Endpoint para obtener estadísticas por cuadrante"""
    try:
        stats = QuadrantStatsRepository.get_latest_stats_by_quadrant(
            db, quadrant_name
        )
        return stats.to_dict() if stats else None
    except Exception as e:
        print(f"Error en get_quadrant_stats: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={"error": "Error al obtener estadísticas del cuadrante"}
        )

@app.get("/api/predictions")
async def get_predictions(
    quadrant_name: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Endpoint para obtener predicciones de calidad del aire"""
    try:
        predictions = PredictionRepository.get_latest_predictions(
            db, quadrant_name
        )
        return [pred.to_dict() for pred in predictions]
    except Exception as e:
        print(f"Error en get_predictions: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={"error": "Error al obtener predicciones"}
        )

@app.get("/api/quadrants/update-stats")
async def update_quadrant_stats(db: Session = Depends(get_db)):
    """Endpoint para actualizar estadísticas de todos los cuadrantes"""
    try:
        # Obtener los últimos datos de calidad del aire
        latest_readings = AirQualityRepository.get_latest_readings(db, limit=100)
        
        # Actualizar estadísticas para cada cuadrante
        for quadrant in ["Noroeste", "Noreste", "Suroeste", "Sureste"]:
            QuadrantStatsRepository.calculate_quadrant_stats(
                db, quadrant, latest_readings
            )
        
        return {"message": "Estadísticas actualizadas correctamente"}
    except Exception as e:
        print(f"Error en update_quadrant_stats: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={"error": "Error al actualizar estadísticas"}
        )
@app.get("/api/weather")
async def get_weather(db: Session = Depends(get_db)):
    """Endpoint para obtener datos meteorológicos"""
    try:
        weather_data = await openmeteo_collector.get_weather_data()
        if weather_data:
            return weather_data
        raise HTTPException(
            status_code=500,
            detail={"error": "No se pudieron obtener datos meteorológicos"}
        )
    except Exception as e:
        print(f"Error en get_weather: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={"error": "Error al obtener datos meteorológicos"}
        )

@app.get("/api/air-quality")
async def get_air_quality(
    db: Session = Depends(get_db),
    source: Optional[str] = None,
    start_time: Optional[datetime] = None,
    end_time: Optional[datetime] = None,
    limit: int = 10,
    offset: int = 0
):
    """Endpoint para obtener datos de calidad del aire"""
    try:
        # Si se solicitan datos históricos
        if start_time and end_time:
            readings = AirQualityRepository.get_readings_in_timeframe(
                db, start_time, end_time, limit, offset
            )
            if readings:
                return [reading.to_dict() for reading in readings]

        # Obtener nuevos datos de Open Meteo
        openmeteo_data = await openmeteo_collector.get_air_quality_data()
        
        if openmeteo_data:
            # Guardar los datos en la base de datos
            try:
                success = AirQualityRepository.store_batch_readings(
                    db,
                    [{
                        "latitude": reading["latitude"],
                        "longitude": reading["longitude"],
                        "pm25": reading["pm25"],
                        "pm10": reading["pm10"],
                        "no2": reading["no2"],
                        "o3": reading["o3"],
                        "co": reading["co"],
                        "source": "openmeteo",
                        "raw_data": reading,
                        "timestamp": datetime.now()
                    } for reading in openmeteo_data]
                )
                print(f"Datos almacenados en la base de datos: {success}")
            except Exception as e:
                print(f"Error guardando datos en la base de datos: {str(e)}")
            
            return openmeteo_data
        
        # Si no hay datos nuevos, obtener los últimos datos almacenados
        latest_readings = AirQualityRepository.get_latest_readings_by_source(
            db, source or "openmeteo", limit
        )
        
        if latest_readings:
            return [reading.to_dict() for reading in latest_readings]
            
        # Si no hay datos en absoluto, usar datos de ejemplo
        return get_fallback_data()
        
    except Exception as e:
        print(f"Error en get_air_quality: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={"error": "Error al obtener datos de calidad del aire"}
        )

@app.get("/api/air-quality/history/daily")
async def get_daily_history(
    date: date,
    limit: Optional[int] = 100,
    offset: Optional[int] = 0,
    db: Session = Depends(get_db)
):
    """Obtiene el historial de un día específico"""
    try:
        start_time = datetime.combine(date, time.min)
        end_time = datetime.combine(date, time.max)
        
        # Obtener el total de registros para este día
        total_count = AirQualityRepository.get_readings_count_in_timeframe(
            db, start_time, end_time
        )
        
        # Obtener los registros con paginación
        readings = AirQualityRepository.get_readings_in_timeframe(
            db, start_time, end_time, limit, offset
        )
        
        return {
            "total": total_count,
            "limit": limit,
            "offset": offset,
            "data": [reading.to_dict() for reading in readings]
        }
    except Exception as e:
        print(f"Error getting daily history: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={"error": "Error al obtener historial diario"}
        )
