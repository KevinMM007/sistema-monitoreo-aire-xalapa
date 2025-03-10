import React, { useState, useEffect, useRef } from 'react';
import { LineChart, XAxis, YAxis, Tooltip, Legend, Line, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';
import html2pdf from 'html2pdf.js';
import { Tab } from '@headlessui/react';
import classNames from 'classnames';

// Constantes para información de contaminantes
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

// Umbrales para niveles de contaminación
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

// Áreas principales de Xalapa
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

// Componente de Leyenda del Mapa
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

// Componente de Condiciones Meteorológicas
const WeatherConditions = ({ weatherData }) => {
    if (!weatherData) return null;

    return (
        <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Condiciones Meteorológicas</h2>
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-gray-600 mb-1">Temperatura</div>
                    <div className="text-2xl font-semibold flex items-center">
                        <span className="text-red-500 mr-1">🌡️</span>
                        {weatherData.temperature}°C
                    </div>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-gray-600 mb-1">Humedad</div>
                    <div className="text-2xl font-semibold flex items-center">
                        <span className="text-blue-500 mr-1">💧</span>
                        {weatherData.humidity}%
                    </div>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-gray-600 mb-1">Viento</div>
                    <div className="text-2xl font-semibold flex items-center">
                        <span className="text-gray-500 mr-1">💨</span>
                        {weatherData.wind_speed} km/h
                    </div>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-gray-600 mb-1">Nubosidad</div>
                    <div className="text-2xl font-semibold flex items-center">
                        <span className="text-gray-500 mr-1">☁️</span>
                        {weatherData.cloud_cover}%
                    </div>
                </div>
            </div>
        </div>
    );
};

// Componente de Estadísticas Actuales
const CurrentStats = ({ airQualityData }) => {
    if (!airQualityData || airQualityData.length === 0) return null;
    
    const latestData = airQualityData[airQualityData.length - 1];
    
    return (
        <div className="space-y-3">
            {Object.entries(POLLUTANT_INFO).map(([key, info]) => {
                const currentValue = latestData[key];
                const color = getPollutantColor(key, currentValue);
                return (
                    <div 
                        key={key} 
                        className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                    >
                        <div className="flex items-center">
                            <div 
                                className="w-3 h-3 rounded-full mr-2" 
                                style={{ backgroundColor: color }}
                            ></div>
                            <span>{info.name}</span>
                        </div>
                        <div className="font-semibold">{info.format(currentValue)}</div>
                    </div>
                );
            })}
        </div>
    );
};

// Componente principal
const AirQualityDashboard = () => {
    // Estados
    const [activeTab, setActiveTab] = useState('general');
    const [airQualityData, setAirQualityData] = useState(null);
    const [error, setError] = useState(null);
    const [dataSource, setDataSource] = useState('loading');
    const [weatherData, setWeatherData] = useState(null);
    const [trafficData, setTrafficData] = useState(null);
    const [isUsingTrafficData, setIsUsingTrafficData] = useState(false);
    const [showTrafficImpact, setShowTrafficImpact] = useState(true);
    const [timeFilter, setTimeFilter] = useState('24h');
    const [selectedPollutant, setSelectedPollutant] = useState('pm25');
    const [selectedZone, setSelectedZone] = useState('Todas');
    const [isMapInitialized, setIsMapInitialized] = useState(false);
    const currentOpenInfoWindow = useRef(null);

    // Referencias
    const mapRef = useRef(null);
    const googleMapRef = useRef(null);
    const heatmapRef = useRef(null);
    const quadrantsRef = useRef([]);

    // Estilos CSS para el toggle switch
    useEffect(() => {
        const styleSheet = document.createElement('style');
        styleSheet.innerText = `
        .toggle-checkbox:checked {
          right: 0;
          border-color: #68D391;
        }
        .toggle-checkbox:checked + .toggle-label {
          background-color: #68D391;
        }
        .toggle-label {
          transition: background-color 0.3s ease;
        }
        `;
        document.head.appendChild(styleSheet);
        
        return () => {
            document.head.removeChild(styleSheet);
        };
    }, []);

    // Efecto para cargar datos de tráfico
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

    // Función para inicializar el mapa
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
            
            setIsMapInitialized(true);
            updateVisualization();

        } catch (error) {
            console.error('Error initializing map:', error);
            setError('Error al inicializar el mapa');
        }
    };

    // Efecto para inicializar Google Maps
    useEffect(() => {
        const loadGoogleMapsScript = () => {
            if (window.google && typeof window.google.maps !== 'undefined') {
                initializeMap();
                return;
            }

            // Si ya existe un script, no añadir otro
            if (document.querySelector('script[src*="maps.googleapis.com"]')) {
                return;
            }

            const script = document.createElement('script');
            const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyC9Z_dL6OfvW6ORXz6lupP5-8Jc_Sl67z8';
            script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=visualization&callback=initMap`;
            script.async = true;
            script.defer = true;

            window.initMap = () => {
                console.log('Google Maps initialized');
                initializeMap();
            };

            document.head.appendChild(script);
        };

        loadGoogleMapsScript();
    }, []);

    // Efecto para reinicializar el mapa cuando la pestaña cambia a general
    useEffect(() => {
        if (activeTab === 'general' && window.google && typeof window.google.maps !== 'undefined') {
            // Pequeño retraso para asegurar que el DOM está listo
            const timer = setTimeout(() => {
                if (mapRef.current) {
                    // Si el mapa ya está inicializado, actualizamos la visualización
                    if (googleMapRef.current) {
                        updateVisualization();
                    } else {
                        // Si no está inicializado, lo inicializamos
                        initializeMap();
                    }
                }
            }, 100);
            
            return () => clearTimeout(timer);
        }
    }, [activeTab]);

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

    // Efecto para actualizar la visualización del mapa cuando cambian los datos
    useEffect(() => {
        if (activeTab === 'general' && googleMapRef.current && airQualityData) {
            updateVisualization();
        }
    }, [airQualityData, trafficData, showTrafficImpact, activeTab]);

    // Función para actualizar visualización del mapa
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

    const generateReport = () => {
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

    // Obtener nivel global de calidad del aire basado en PM2.5
    const getOverallAirQuality = () => {
        if (!airQualityData || airQualityData.length === 0) return null;
        
        const latestData = airQualityData[airQualityData.length - 1];
        const pm25Level = latestData.pm25;
        
        return {
            level: getPollutantLevel('pm25', pm25Level),
            color: getPollutantColor('pm25', pm25Level),
            conclusion: getAirQualityConclusion(pm25Level),
            value: pm25Level
        };
    };

    // Renderizar el componente
    return (
        <div className="bg-gray-100 min-h-screen p-4">
            {/* Encabezado con navegación por pestañas */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-4">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-bold text-gray-800">Sistema de Monitoreo de Calidad del Aire - Xalapa</h1>
                    <button 
                        onClick={generateReport}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    >
                        DESCARGAR REPORTE
                    </button>
                </div>
                
                {/* Panel de estado actual destacado */}
                {airQualityData && airQualityData.length > 0 && (
                    <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4">
                        <div className="flex items-center">
                            <div className="bg-green-100 p-3 rounded-full mr-4">
                                <span className="text-green-500 text-xl">✓</span>
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold">
                                    Calidad del aire actual: <span className="text-green-600">
                                        {getOverallAirQuality()?.level}
                                    </span>
                                </h2>
                                <p className="text-gray-700">{getOverallAirQuality()?.conclusion}</p>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Pestañas de navegación */}
                <div className="border-b border-gray-200">
                    <nav className="flex -mb-px">
                        <button 
                            onClick={() => setActiveTab('general')}
                            className={`mr-8 py-4 px-1 ${
                                activeTab === 'general' 
                                    ? 'border-b-2 border-blue-500 text-blue-600 font-medium' 
                                    : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            Vista General
                        </button>
                        <button 
                            onClick={() => setActiveTab('zones')}
                            className={`mr-8 py-4 px-1 ${
                                activeTab === 'zones' 
                                    ? 'border-b-2 border-blue-500 text-blue-600 font-medium' 
                                    : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            Datos por Zonas
                        </button>
                        <button 
                            onClick={() => setActiveTab('trends')}
                            className={`py-4 px-1 ${
                                activeTab === 'trends' 
                                    ? 'border-b-2 border-blue-500 text-blue-600 font-medium' 
                                    : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            Tendencias Históricas
                        </button>
                    </nav>
                </div>
            </div>
            
            {/* Contenido principal basado en la pestaña activa */}
            {activeTab === 'general' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Primera fila con los dos paneles principales */}
                    <div className="md:col-span-2">
                        {/* Mapa */}
                        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-semibold text-gray-800">Mapa de Calidad del Aire</h2>
                                <div className="flex items-center space-x-2">
                                    <span className="text-sm text-gray-600">Impacto vehicular</span>
                                    <div className="relative inline-block w-10 mr-2 align-middle select-none">
                                        <input 
                                            type="checkbox" 
                                            id="toggle" 
                                            checked={showTrafficImpact}
                                            onChange={() => setShowTrafficImpact(!showTrafficImpact)}
                                            className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                                        />
                                        <label 
                                            htmlFor="toggle" 
                                            className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"
                                        ></label>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Contenedor del mapa con mayor altura */}
                            <div className="relative h-[500px]">
                                <div 
                                    ref={mapRef} 
                                    className="w-full h-full rounded-lg"
                                ></div>
                                <MapLegend />
                            </div>
                        </div>
                    </div>

                    {/* Estadísticas actuales */}
                    <div className="h-[588px]"> {/* Altura ajustada para igualar la altura del mapa + encabezado */}
                        <div className="bg-white rounded-lg shadow-md p-4 h-full">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">Estadísticas Actuales</h2>
                            {airQualityData && <CurrentStats airQualityData={airQualityData} />}
                        </div>
                    </div>

                    {/* Segunda fila */}
                    <div className="md:col-span-2">
                        {/* Niveles de contaminantes */}
                        <div className="bg-white rounded-lg shadow-md p-4 mt-4">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">Niveles de Contaminantes</h2>
                            {error ? (
                                <div className="bg-red-50 p-4 rounded-lg text-red-600 mb-4">
                                    Error: {error}
                                </div>
                            ) : !airQualityData ? (
                                <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
                                    <p className="text-gray-500">Cargando datos...</p>
                                </div>
                            ) : (
                                <>
                                    {/* Gráfico */}
                                    <div className="bg-gray-50 p-2 rounded-lg mb-4">
                                        <ResponsiveContainer width="100%" height={300}>
                                            <LineChart data={airQualityData}>
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
                                        </ResponsiveContainer>
                                    </div>
                                    
                                    {/* Selector de tiempo */}
                                    <div className="flex justify-center space-x-4 mb-4">
                                        <button 
                                            className={`px-4 py-2 rounded-md ${timeFilter === '24h' 
                                                ? 'bg-blue-100 text-blue-800' 
                                                : 'bg-gray-100 text-gray-600'}`}
                                            onClick={() => setTimeFilter('24h')}
                                        >
                                            24h
                                        </button>
                                        <button 
                                            className={`px-4 py-2 rounded-md ${timeFilter === '7d' 
                                                ? 'bg-blue-100 text-blue-800' 
                                                : 'bg-gray-100 text-gray-600'}`}
                                            onClick={() => setTimeFilter('7d')}
                                        >
                                            7 días
                                        </button>
                                        <button 
                                            className={`px-4 py-2 rounded-md ${timeFilter === '30d' 
                                                ? 'bg-blue-100 text-blue-800' 
                                                : 'bg-gray-100 text-gray-600'}`}
                                            onClick={() => setTimeFilter('30d')}
                                        >
                                            30 días
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                    
                    {/* Condiciones meteorológicas */}
                    <div className="mt-4">
                        <WeatherConditions weatherData={weatherData} />
                    </div>
                </div>
            )}
            
            {activeTab === 'zones' && (
                <div className="bg-white rounded-lg shadow-md p-4">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Análisis por Zonas</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {XALAPA_MAIN_AREAS.map(zone => {
                            // Obtener datos de tráfico para esta zona
                            const zoneTraffic = trafficData?.find(t => t.area_name === zone.name);
                            
                            // Calcular calidad del aire para esta zona
                            const zoneQuality = airQualityData ? calculateQuadrantAirQuality(zone, airQualityData) : null;
                            
                            return (
                                <div key={zone.name} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                                    <h3 className="text-lg font-medium text-gray-800 mb-2">{zone.name}</h3>
                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                        <div>
                                            <div className="text-sm text-gray-500">PM2.5</div>
                                            <div className="font-medium">
                                                {zoneQuality ? zoneQuality.averages.pm25.toFixed(2) : 'N/A'} µg/m³
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-gray-500">PM10</div>
                                            <div className="font-medium">
                                                {zoneQuality ? zoneQuality.averages.pm10.toFixed(2) : 'N/A'} µg/m³
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mb-3">
                                        <div className="text-sm text-gray-500">Congestión vehicular</div>
                                        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                                            <div 
                                                className="bg-blue-600 h-2.5 rounded-full" 
                                                style={{ width: `${zoneTraffic?.congestion_level || 0}%` }}
                                            ></div>
                                        </div>
                                        <div className="text-xs text-right mt-1 text-gray-500">
                                            {zoneTraffic?.congestion_level?.toFixed(1) || 0}%
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-500">Impacto en PM2.5</div>
                                        <div className="text-green-600 font-medium">
                                            +{((zoneTraffic?.congestion_level || 0) * 0.35 / 100 * 100).toFixed(1)}%
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
            
            {activeTab === 'trends' && (
                <div className="bg-white rounded-lg shadow-md p-4">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Tendencias Históricas</h2>
                    
                    {!airQualityData ? (
                        <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg mb-4">
                            <p className="text-gray-500">Cargando datos...</p>
                        </div>
                    ) : (
                        <div className="bg-gray-50 p-3 rounded-lg mb-4">
                            <ResponsiveContainer width="100%" height={400}>
                                {selectedPollutant === 'all' ? (
                                    <LineChart data={airQualityData}>
                                        <XAxis 
                                            dataKey="timestamp" 
                                            tickFormatter={(timestamp) => {
                                                const date = new Date(timestamp);
                                                return date.toLocaleDateString();
                                            }} 
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
                                ) : (
                                    <AreaChart data={airQualityData}>
                                        <XAxis 
                                            dataKey="timestamp" 
                                            tickFormatter={(timestamp) => {
                                                const date = new Date(timestamp);
                                                return date.toLocaleDateString();
                                            }} 
                                        />
                                        <YAxis />
                                        <Tooltip
                                            formatter={(value) => {
                                                const info = POLLUTANT_INFO[selectedPollutant];
                                                return [info.format(value), info.name];
                                            }}
                                            labelFormatter={(timestamp) => new Date(timestamp).toLocaleString()}
                                        />
                                        <Area 
                                            type="monotone" 
                                            dataKey={selectedPollutant} 
                                            stroke={
                                                selectedPollutant === 'pm25' ? '#8884d8' :
                                                selectedPollutant === 'pm10' ? '#82ca9d' :
                                                selectedPollutant === 'no2' ? '#ffc658' :
                                                selectedPollutant === 'o3' ? '#ff7300' :
                                                '#ff0000'
                                            }
                                            fill={
                                                selectedPollutant === 'pm25' ? '#8884d820' :
                                                selectedPollutant === 'pm10' ? '#82ca9d20' :
                                                selectedPollutant === 'no2' ? '#ffc65820' :
                                                selectedPollutant === 'o3' ? '#ff730020' :
                                                '#ff000020'
                                            }
                                        />
                                    </AreaChart>
                                )}
                            </ResponsiveContainer>
                        </div>
                    )}
                    
                    <div className="flex justify-between">
                        <div>
                            <div className="text-sm text-gray-500 mb-1">Período</div>
                            <select className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg p-2.5">
                                <option>Últimos 7 días</option>
                                <option>Últimos 30 días</option>
                                <option>Último trimestre</option>
                            </select>
                        </div>
                        <div>
                            <div className="text-sm text-gray-500 mb-1">Contaminante</div>
                            <select 
                                className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg p-2.5"
                                value={selectedPollutant}
                                onChange={(e) => setSelectedPollutant(e.target.value)}
                            >
                                <option value="all">Todos</option>
                                <option value="pm25">PM2.5</option>
                                <option value="pm10">PM10</option>
                                <option value="no2">NO₂</option>
                                <option value="o3">O₃</option>
                                <option value="co">CO</option>
                            </select>
                        </div>
                        <div>
                            <div className="text-sm text-gray-500 mb-1">Zona</div>
                            <select 
                                className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg p-2.5"
                                value={selectedZone}
                                onChange={(e) => setSelectedZone(e.target.value)}
                            >
                                <option value="Todas">Todas</option>
                                {XALAPA_MAIN_AREAS.map(area => (
                                    <option key={area.name} value={area.name}>{area.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Footer con metadatos */}
            <div className="mt-6 bg-white rounded-lg shadow-md p-4">
                <div className="flex justify-between text-sm text-gray-500">
                    <div>Última actualización: {new Date().toLocaleString()}</div>
                    <div>Fuente de datos: API Open Meteo + TomTom Traffic</div>
                </div>
            </div>
        </div>
    );
};

export default AirQualityDashboard;