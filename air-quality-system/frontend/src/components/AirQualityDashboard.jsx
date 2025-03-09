import React, { useState, useEffect, useRef } from 'react';
import { LineChart, XAxis, YAxis, Tooltip, Legend, Line } from 'recharts';
import html2pdf from 'html2pdf.js';

const POLLUTANT_INFO = {
    pm25: {
        name: 'PM2.5',
        unit: 'µg/m³',
        format: (value) => `${value.toFixed(2)} µg/m³`
    },
    pm10: {
        name: 'PM10',
        unit: 'µg/m³',
        format: (value) => `${value.toFixed(2)} µg/m³`
    },
    no2: {
        name: 'NO₂',
        unit: 'µg/m³',
        format: (value) => `${value.toFixed(2)} µg/m³`
    },
    o3: {
        name: 'O₃',
        unit: 'µg/m³',
        format: (value) => `${value.toFixed(2)} µg/m³`
    },
    co: {
        name: 'CO',
        unit: 'mg/m³',
        format: (value) => `${value.toFixed(2)} mg/m³`
    }
};

const POLLUTANT_THRESHOLDS = {
    pm25: {
        good: 12,
        moderate: 35.4,
        unhealthy: 55.4,
        veryUnhealthy: 150.4
    },
    pm10: {
        good: 54,
        moderate: 154,
        unhealthy: 254,
        veryUnhealthy: 354
    },
    no2: {
        good: 53,
        moderate: 100,
        unhealthy: 360,
        veryUnhealthy: 649
    },
    o3: {
        good: 50,
        moderate: 100,
        unhealthy: 150,
        veryUnhealthy: 200
    },
    co: {
        good: 4.4,
        moderate: 9.4,
        unhealthy: 12.4,
        veryUnhealthy: 15.4
    }
};
const XALAPA_MAIN_AREAS = [
    {
      name: 'Centro',
      bounds: {
        north: 19.5500, 
        south: 19.5200,
        east: -96.8900, 
        west: -96.9250
      }
    },
    {
      name: 'Norte',
      bounds: {
        north: 19.5900,
        south: 19.5500,
        east: -96.8550,
        west: -96.9750
      }
    },
    {
      name: 'Sur',
      bounds: {
        north: 19.5200,
        south: 19.4900,
        east: -96.8550,
        west: -96.9750
      }
    },
    {
      name: 'Este',
      bounds: {
        north: 19.5900,
        south: 19.4900,
        east: -96.7900,
        west: -96.8900
      }
    },
    {
      name: 'Oeste',
      bounds: {
        north: 19.5900,
        south: 19.4900,
        east: -96.9250,
        west: -97.0200
      }
    }
  ];



// Funciones auxiliares
const getPollutantColor = (pollutant, value) => {
    const thresholds = POLLUTANT_THRESHOLDS[pollutant];
    if (value <= thresholds.good) return '#00E400';
    if (value <= thresholds.moderate) return '#FFFF00';
    if (value <= thresholds.unhealthy) return '#FF7E00';
    if (value <= thresholds.veryUnhealthy) return '#FF0000';
    return '#7F004D';
};

const getPollutantLevel = (pollutant, value) => {
    const thresholds = POLLUTANT_THRESHOLDS[pollutant];
    if (value <= thresholds.good) return 'Bueno';
    if (value <= thresholds.moderate) return 'Moderado';
    if (value <= thresholds.unhealthy) return 'Insalubre';
    if (value <= thresholds.veryUnhealthy) return 'Muy Insalubre';
    return 'Peligroso';
};
const MapLegend = () => (
    <div className="absolute bottom-4 left-4 bg-white p-2 rounded shadow">
        <h4 className="font-semibold mb-2">Calidad del Aire</h4>
        <div className="space-y-1">
            <div className="flex items-center">
                <div className="w-4 h-4 bg-[#00E400] mr-2"></div>
                <span>Bueno</span>
            </div>
            <div className="flex items-center">
                <div className="w-4 h-4 bg-[#FFFF00] mr-2"></div>
                <span>Moderado</span>
            </div>
            <div className="flex items-center">
                <div className="w-4 h-4 bg-[#FF7E00] mr-2"></div>
                <span>Insalubre</span>
            </div>
            <div className="flex items-center">
                <div className="w-4 h-4 bg-[#FF0000] mr-2"></div>
                <span>Muy Insalubre</span>
            </div>
            <div className="flex items-center">
                <div className="w-4 h-4 bg-[#7F004D] mr-2"></div>
                <span>Peligroso</span>
            </div>
        </div>
    </div>
);

const WeatherConditions = ({ weatherData }) => {
    if (!weatherData) return null;

    return (
        <div className="bg-white rounded-lg shadow-lg p-4">
            <h2 className="text-xl font-bold mb-4">Condiciones Meteorológicas</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2">
                        <span className="text-red-500">🌡️</span>
                        <span className="text-gray-600">Temperatura</span>
                    </div>
                    <p className="text-2xl mt-2">{weatherData.temperature}°C</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2">
                        <span className="text-blue-500">💧</span>
                        <span className="text-gray-600">Humedad</span>
                    </div>
                    <p className="text-2xl mt-2">{weatherData.humidity}%</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2">
                        <span className="text-gray-500">💨</span>
                        <span className="text-gray-600">Viento</span>
                    </div>
                    <p className="text-2xl mt-2">{weatherData.wind_speed} km/h</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2">
                        <span className="text-gray-500">☁️</span>
                        <span className="text-gray-600">Nubosidad</span>
                    </div>
                    <p className="text-2xl mt-2">{weatherData.cloud_cover}%</p>
                </div>
            </div>
        </div>
    );
};

const getAirQualityConclusion = (pm25Level) => {
    if (pm25Level <= 12) {
        return "Las condiciones son seguras para realizar actividades al aire libre.";
    } else if (pm25Level <= 35.4) {
        return "Se recomienda precaución para grupos sensibles en actividades prolongadas al aire libre.";
    } else if (pm25Level <= 55.4) {
        return "Se recomienda limitar las actividades prolongadas al aire libre.";
    } else if (pm25Level <= 150.4) {
        return "Se recomienda evitar actividades al aire libre y usar protección respiratoria.";
    } else {
        return "Condiciones peligrosas. Se recomienda permanecer en interiores.";
    }
};
const generateReport = (airQualityData, weatherData) => {
    if (!airQualityData || !weatherData) {
        console.error('No hay datos disponibles para generar el reporte');
        return;
    }
    
    // Usamos el último dato disponible
    const latestData = airQualityData[airQualityData.length - 1];
    const currentDate = new Date().toLocaleDateString();
    
    const reportContent = `
        <div style="padding: 20px; font-family: Arial, sans-serif;">
            <h1 style="color: #1a365d;">Reporte de Calidad del Aire - Xalapa</h1>
            <p><strong>Fecha:</strong> ${currentDate}</p>
            <p><strong>Ubicación:</strong> Xalapa, Veracruz</p>
            
            <h2 style="color: #2c5282;">Niveles de Contaminación Actuales</h2>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <tr style="background-color: #f7fafc;">
                    <th style="padding: 8px; border: 1px solid #e2e8f0;">Contaminante</th>
                    <th style="padding: 8px; border: 1px solid #e2e8f0;">Valor</th>
                    <th style="padding: 8px; border: 1px solid #e2e8f0;">Estado</th>
                </tr>
                <tr>
                    <td style="padding: 8px; border: 1px solid #e2e8f0;">PM2.5</td>
                    <td style="padding: 8px; border: 1px solid #e2e8f0;">${latestData?.pm25} μg/m³</td>
                    <td style="padding: 8px; border: 1px solid #e2e8f0;">${getPollutantLevel('pm25', latestData?.pm25)}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border: 1px solid #e2e8f0;">PM10</td>
                    <td style="padding: 8px; border: 1px solid #e2e8f0;">${latestData?.pm10} μg/m³</td>
                    <td style="padding: 8px; border: 1px solid #e2e8f0;">${getPollutantLevel('pm10', latestData?.pm10)}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border: 1px solid #e2e8f0;">NO₂</td>
                    <td style="padding: 8px; border: 1px solid #e2e8f0;">${latestData?.no2} μg/m³</td>
                    <td style="padding: 8px; border: 1px solid #e2e8f0;">${getPollutantLevel('no2', latestData?.no2)}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border: 1px solid #e2e8f0;">O₃</td>
                    <td style="padding: 8px; border: 1px solid #e2e8f0;">${latestData?.o3} μg/m³</td>
                    <td style="padding: 8px; border: 1px solid #e2e8f0;">${getPollutantLevel('o3', latestData?.o3)}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border: 1px solid #e2e8f0;">CO</td>
                    <td style="padding: 8px; border: 1px solid #e2e8f0;">${latestData?.co} mg/m³</td>
                    <td style="padding: 8px; border: 1px solid #e2e8f0;">${getPollutantLevel('co', latestData?.co)}</td>
                </tr>
            </table>

            <h2 style="color: #2c5282;">Condiciones Meteorológicas</h2>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <tr>
                    <td style="padding: 8px; border: 1px solid #e2e8f0;">Temperatura</td>
                    <td style="padding: 8px; border: 1px solid #e2e8f0;">${weatherData.temperature}°C</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border: 1px solid #e2e8f0;">Humedad</td>
                    <td style="padding: 8px; border: 1px solid #e2e8f0;">${weatherData.humidity}%</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border: 1px solid #e2e8f0;">Velocidad del Viento</td>
                    <td style="padding: 8px; border: 1px solid #e2e8f0;">${weatherData.wind_speed} km/h</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border: 1px solid #e2e8f0;">Nubosidad</td>
                    <td style="padding: 8px; border: 1px solid #e2e8f0;">${weatherData.cloud_cover}%</td>
                </tr>
            </table>

            <h2 style="color: #2c5282;">Conclusión</h2>
            <p>Según los niveles establecidos por organizaciones ambientales, la calidad del aire en Xalapa se encuentra actualmente en un nivel 
            <strong>${getPollutantLevel('pm25', latestData?.pm25)}</strong>. 
            ${getAirQualityConclusion(latestData?.pm25)}</p>
        </div>
    `;
    


    const opt = {
        margin: 1,
        filename: `reporte-calidad-aire-${currentDate}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    const element = document.createElement('div');
    element.innerHTML = reportContent;
    html2pdf().set(opt).from(element).save();
};

const AirQualityDashboard = () => {
    // Estados
    const [airQualityData, setAirQualityData] = useState(null);
    const [error, setError] = useState(null);
    const [dataSource, setDataSource] = useState('loading');
    const [viewMode, setViewMode] = useState('heatmap');
    const [weatherData, setWeatherData] = useState(null);
    const [trafficData, setTrafficData] = useState(null);
    const [isUsingTrafficData, setIsUsingTrafficData] = useState(false);
    const [showTrafficImpact, setShowTrafficImpact] = useState(true);
    const currentOpenInfoWindow = useRef(null);

    // Referencias
    const mapRef = useRef(null);
    const googleMapRef = useRef(null);
    const heatmapRef = useRef(null);
    const quadrantsRef = useRef([]);

// Añadir un nuevo efecto para cargar datos de tráfico
useEffect(() => {
    const fetchTrafficData = async () => {
        try {
            const response = await fetch('/api/traffic');
            if (response.ok) {
                const data = await response.json();
                setTrafficData(data);
                // Activar la bandera si tenemos datos reales
                if (data && data.length > 0 && data[0].raw_data) {
                    setIsUsingTrafficData(true);
                }
            }
        } catch (error) {
            console.error('Error fetching traffic data:', error);
        }
    };

    fetchTrafficData();
    const interval = setInterval(fetchTrafficData, 300000); // Cada 5 minutos
    return () => clearInterval(interval);
}, []);

    // Efecto para inicializar Google Maps
    useEffect(() => {
        const loadGoogleMapsScript = () => {
            if (window.google || document.querySelector('script[src*="maps.googleapis.com"]')) {
                initializeMap();
                return;
            }

            const script = document.createElement('script');
            const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
            script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=visualization&callback=initMap`;
            script.async = true;
            script.defer = true;

            window.initMap = () => {
                console.log('Google Maps initialized');
                initializeMap();
            };

            document.head.appendChild(script);
        };

        const initializeMap = () => {
            try {
                if (!mapRef.current || !window.google) return;

                const xalapa = { lat: 19.5438, lng: -96.9102 };
                const mapOptions = {
                    center: xalapa,
                    zoom: 13,
                    mapTypeId: 'roadmap',
                    styles: [
                        {
                            featureType: "poi",
                            elementType: "labels",
                            stylers: [{ visibility: "off" }]
                        }
                    ]
                };

                const map = new window.google.maps.Map(mapRef.current, mapOptions);
                googleMapRef.current = map;

                // Añadir capa de tráfico
                const trafficLayer = new window.google.maps.TrafficLayer();
                trafficLayer.setMap(map);

            } catch (error) {
                console.error('Error initializing map:', error);
                setError('Error al inicializar el mapa');
            }
        };

        loadGoogleMapsScript();

        return () => {
            if (googleMapRef.current) {
                googleMapRef.current = null;
            }
        };
    }, []);

    // Efecto para cargar datos de calidad del aire
    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('/api/air-quality');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                setAirQualityData(data);
                setDataSource('real');
            } catch (err) {
                console.error('Error fetching data:', err);
                setError(err.message);
                setDataSource('error');
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 300000); // Cada 5 minutos
        return () => clearInterval(interval);
    }, []);

    // Efecto para cargar datos meteorológicos
    useEffect(() => {
        const fetchWeatherData = async () => {
            try {
                const response = await fetch('/api/weather');
                if (response.ok) {
                    const data = await response.json();
                    setWeatherData(data);
                }
            } catch (error) {
                console.error('Error fetching weather data:', error);
            }
        };

        fetchWeatherData();
        const interval = setInterval(fetchWeatherData, 300000); // Actualizar cada 5 minutos
        return () => clearInterval(interval);
    }, []);

    // Efecto para actualizar la visualización del mapa
    // En el efecto que actualiza la visualización del mapa
useEffect(() => {
    const updateVisualization = () => {
        if (!googleMapRef.current || !window.google || !airQualityData) return;
      
        // Limpiar visualizaciones anteriores
        if (heatmapRef.current) {
          heatmapRef.current.setMap(null);
        }
        quadrantsRef.current.forEach(quadrant => {
          if (quadrant) quadrant.setMap(null);
        });
        quadrantsRef.current = [];
        
        // Cerrar cualquier ventana de información abierta
        if (currentOpenInfoWindow.current) {
          currentOpenInfoWindow.current.close();
          currentOpenInfoWindow.current = null;
        }
      
        // Solo mostrar cuadrantes si showTrafficImpact es true
        if (showTrafficImpact) {
          XALAPA_MAIN_AREAS.forEach(area => {
            // Buscar datos de tráfico para esta área
            const areaTraffic = trafficData?.find(t => t.area_name === area.name) || null;
            
            // Calcular calidad del aire para este cuadrante
            const quality = calculateQuadrantAirQuality(area, airQualityData);
            if (!quality) return;
      
            // Crear el polígono del cuadrante
            const rectangle = new window.google.maps.Rectangle({
              bounds: new window.google.maps.LatLngBounds(
                new window.google.maps.LatLng(area.bounds.south, area.bounds.west),
                new window.google.maps.LatLng(area.bounds.north, area.bounds.east)
              ),
              strokeColor: '#FFFFFF',
              strokeOpacity: 0.8,
              strokeWeight: 2,
              fillColor: quality.color,
              fillOpacity: 0.35,
              map: googleMapRef.current
            });
      
            // Crear contenido para la ventana de información
            const congestionLevel = areaTraffic ? `${areaTraffic.congestion_level?.toFixed(1) || 0}%` : '0.0%';
            const currentSpeed = areaTraffic ? `${areaTraffic.current_speed?.toFixed(1) || 0} km/h` : 'N/A';
            
            // Calcular impactos en PM2.5 y NO2 basados en la congestión
            const pm25Impact = areaTraffic ? `+${((areaTraffic.congestion_level || 0) * 0.35 / 100 * 100).toFixed(1)}%` : '+0.0%';
            const no2Impact = areaTraffic ? `+${((areaTraffic.congestion_level || 0) * 0.45 / 100 * 100).toFixed(1)}%` : '+0.0%';
            
            const infoContent = `
              <div style="padding: 12px; min-width: 220px;">
                <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 8px; color: #1f2937;">
                  ${area.name}
                </h3>
                <div style="display: grid; gap: 6px;">
                  <div style="background-color: #f3f4f6; padding: 6px; border-radius: 4px;">
                    <div style="font-weight: 600; margin-bottom: 4px; color: #4b5563;">Contaminantes</div>
                    <div style="display: flex; justify-content: space-between;">
                      <span>PM2.5:</span>
                      <span>${quality.averages.pm25.toFixed(2)} µg/m³</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                      <span>PM10:</span>
                      <span>${quality.averages.pm10.toFixed(2)} µg/m³</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                      <span>NO₂:</span>
                      <span>${quality.averages.no2.toFixed(2)} µg/m³</span>
                    </div>
                  </div>
                  
                  <div style="background-color: #dbeafe; padding: 6px; border-radius: 4px;">
                    <div style="font-weight: 600; margin-bottom: 4px; color: #1e40af;">Tráfico</div>
                    <div style="display: flex; justify-content: space-between;">
                      <span>Velocidad:</span>
                      <span>${currentSpeed}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                      <span>Congestión:</span>
                      <span>${congestionLevel}</span>
                    </div>
                  </div>
                  
                  <div style="background-color: #dcfce7; padding: 6px; border-radius: 4px;">
                    <div style="font-weight: 600; margin-bottom: 4px; color: #166534;">Impacto</div>
                    <div style="display: flex; justify-content: space-between;">
                      <span>En PM2.5:</span>
                      <span>${pm25Impact}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                      <span>En NO₂:</span>
                      <span>${no2Impact}</span>
                    </div>
                  </div>
                </div>
              </div>
            `;
      
            const infoWindow = new window.google.maps.InfoWindow({
              content: infoContent
            });
      
            // Añadir eventos de mouse
            rectangle.addListener('mouseover', () => {
              rectangle.setOptions({ fillOpacity: 0.7 });
            });
      
            rectangle.addListener('mouseout', () => {
              rectangle.setOptions({ fillOpacity: 0.35 });
            });
      
            rectangle.addListener('click', (e) => {
              // Cerrar ventana de información previa si existe
              if (currentOpenInfoWindow.current) {
                currentOpenInfoWindow.current.close();
              }
              
              // Abrir nueva ventana de información
              infoWindow.setPosition(e.latLng);
              infoWindow.open(googleMapRef.current);
              
              // Guardar referencia a la ventana actual
              currentOpenInfoWindow.current = infoWindow;
            });
      
            quadrantsRef.current.push(rectangle);
          });
        }
      };

    updateVisualization();
}, [viewMode, airQualityData, trafficData,showTrafficImpact]); // Añadir trafficData como dependencia

    const calculateQuadrantAirQuality = (quadrant, airData) => {
        // Obtener solo la última lectura de datos
        const latestData = airData[airData.length - 1];
        if (!latestData) return null;
    
        // Usar los valores más recientes
        let currentReadings = {
            pm25: latestData.pm25,
            pm10: latestData.pm10,
            no2: latestData.no2,
            o3: latestData.o3,
            co: latestData.co
        };
        
        // Si hay datos de tráfico, ajustar los valores
        if (trafficData && trafficData.length > 0) {
            // Filtrar datos de tráfico para este cuadrante
            const quadrantTraffic = trafficData.filter(t => (
                quadrant.bounds.north >= t.latitude && 
                t.latitude >= quadrant.bounds.south &&
                quadrant.bounds.east >= t.longitude && 
                t.longitude >= quadrant.bounds.west
            ));
            
            if (quadrantTraffic.length > 0) {
                // Calcular congestión promedio
                const avgCongestion = quadrantTraffic.reduce(
                    (sum, t) => sum + (t.congestion_level || 0), 0
                ) / quadrantTraffic.length;
                
                const congestionFactor = avgCongestion / 100;
                
                // Aplicar factores de ajuste
                currentReadings = {
                    pm25: currentReadings.pm25 * (1 + (congestionFactor * 0.35)),
                    pm10: currentReadings.pm10 * (1 + (congestionFactor * 0.25)),
                    no2: currentReadings.no2 * (1 + (congestionFactor * 0.45)),
                    o3: currentReadings.o3 * (1 - (congestionFactor * 0.15)),
                    co: currentReadings.co * (1 + (congestionFactor * 0.40))
                };
            }
        }
    
        return {
            color: getPollutantColor('pm25', currentReadings.pm25),
            averages: currentReadings,
            hasTrafficData: trafficData && trafficData.length > 0
        };
    };

    // Renderizado del componente
    return (
        <div className="p-4">
  {/* Indicador de fuente de datos */}
  <div className={`p-2 mb-4 rounded ${
    dataSource === 'real'
      ? 'bg-green-100 text-green-800'
      : dataSource === 'fallback'
        ? 'bg-yellow-100 text-yellow-800'
        : 'bg-gray-100 text-gray-800'
  }`}>
    Fuente de datos: {
      dataSource === 'real'
        ? 'Datos reales'
        : dataSource === 'fallback'
          ? 'Datos de ejemplo'
          : 'Cargando...'
    }
  </div>
  
  {isUsingTrafficData && (
    <div className="p-2 mb-4 rounded bg-blue-100 text-blue-800">
      <div className="flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <span>Usando datos de tráfico en tiempo real para mejorar precisión de estimaciones por zona</span>
      </div>
    </div>
  )}

  {/* Botón de descarga */}
  {airQualityData && weatherData && (
    <button
      onClick={() => generateReport(airQualityData, weatherData)}
      className="absolute top-4 right-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded z-10"
    >
      DESCARGAR REPORTE
    </button>
  )}

  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
    {/* Mapa */}
    <div className="bg-white rounded-lg shadow-lg p-4 flex flex-col">
  <h2 className="text-xl font-bold mb-4">Mapa de Calidad del Aire</h2>
  <div className="relative flex-grow">
    <div
      ref={mapRef}
      className="w-full h-full rounded-lg"
      style={{ minHeight: '550px' }}
    />
    <MapLegend />
    <div className="absolute top-4 right-4 z-10">
      <button
        onClick={() => setShowTrafficImpact(!showTrafficImpact)}
        className="bg-white px-4 py-2 rounded shadow hover:bg-gray-100 transition-colors"
      >
        {showTrafficImpact ? 'Ocultar Impacto Vehicular' : 'Ver Impacto Vehicular'}
      </button>
    </div>
  </div>
</div>

    {/* Panel de Niveles de Contaminantes */}
    <div className="bg-white rounded-lg shadow-lg p-4">
      <h2 className="text-xl font-bold mb-4">Niveles de Contaminantes</h2>
      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">Error: {error}</p>
        </div>
      ) : !airQualityData ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Cargando datos...</p>
        </div>
      ) : (
        <>
          {/* Gráfica */}
          <LineChart width={600} height={300} data={airQualityData}>
            <XAxis
              dataKey="timestamp"
              tickFormatter={(timestamp) => new Date(timestamp).toLocaleTimeString()}
            />
            <YAxis />
            <Tooltip
              formatter={(value, name, {dataKey}) => {
                const pollutant = POLLUTANT_INFO[dataKey];
                return [pollutant.format(value), pollutant.name];
              }}
              labelFormatter={(timestamp) => new Date(timestamp).toLocaleString()}
            />
            <Legend />
            {Object.entries(POLLUTANT_INFO).map(([key, info]) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                name={info.name}
                stroke={
                  key === 'pm25' ? '#8884d8' :
                  key === 'pm10' ? '#82ca9d' :
                  key === 'no2' ? '#ffc658' :
                  key === 'o3' ? '#ff7300' :
                  '#ff0000'
                }
                dot={false}
              />
            ))}
          </LineChart>

          {/* Estadísticas Actuales */}
          <div className="mt-4">
            <h2 className="text-xl font-bold mb-4">Estadísticas Actuales</h2>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(POLLUTANT_INFO).map(([key, info]) => {
                const currentValue = airQualityData[airQualityData.length - 1][key];
                return (
                  <div key={key} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">
                        {info.name} ({info.unit})
                      </h3>
                      <span
                        className="px-2 py-1 rounded text-sm text-white"
                        style={{ backgroundColor: getPollutantColor(key, currentValue) }}
                      >
                        {getPollutantLevel(key, currentValue)}
                      </span>
                    </div>
                    <p className="text-2xl mt-2">
                      {info.format(currentValue)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  </div>

  {/* Componente de Condiciones Meteorológicas */}
  <div className="mt-4">
    <WeatherConditions weatherData={weatherData} />
  </div>
</div>
    );
};

export default AirQualityDashboard;