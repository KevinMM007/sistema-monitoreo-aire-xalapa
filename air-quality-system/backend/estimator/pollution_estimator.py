class PollutionEstimator:
    @staticmethod
    def estimate_local_pollution(base_air_data, traffic_data, quadrant):
        """
        Estima niveles de contaminación por zona basados en datos base y tráfico
        """
        # Filtrar datos de tráfico solo para el cuadrante actual
        quadrant_traffic = [t for t in traffic_data if 
                           (quadrant['bounds']['north'] >= t['latitude'] >= quadrant['bounds']['south'] and
                            quadrant['bounds']['east'] >= t['longitude'] >= quadrant['bounds']['west'])]
        
        if not quadrant_traffic:
            return base_air_data  # Sin datos de tráfico, usar valores base
        
        # Calcular nivel de congestión promedio en el cuadrante
        avg_congestion = sum(t['congestion_level'] for t in quadrant_traffic) / len(quadrant_traffic)
        congestion_factor = avg_congestion / 100.0  # Normalizar a 0-1
        
        # Factores de influencia del tráfico sobre contaminantes
        # Basados en estudios de correlación entre tráfico y contaminación
        factors = {
            'pm25': 1 + (congestion_factor * 0.35),  # PM2.5 aumenta con tráfico
            'pm10': 1 + (congestion_factor * 0.25),  # PM10 aumenta menos
            'no2': 1 + (congestion_factor * 0.45),   # NO2 muy afectado por tráfico
            'o3': 1 - (congestion_factor * 0.15),    # O3 puede bajar en áreas congestionadas
            'co': 1 + (congestion_factor * 0.40)     # CO aumenta con tráfico
        }
        
        # Aplicar factores de ajuste
        return {
            'pm25': base_air_data['pm25'] * factors['pm25'],
            'pm10': base_air_data['pm10'] * factors['pm10'],
            'no2': base_air_data['no2'] * factors['no2'],
            'o3': base_air_data['o3'] * factors['o3'],
            'co': base_air_data['co'] * factors['co']
        }