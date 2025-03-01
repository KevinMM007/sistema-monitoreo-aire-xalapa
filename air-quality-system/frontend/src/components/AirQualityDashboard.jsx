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
const XALAPA_QUADRANTS = [
    // Noroeste
    {
      name: 'Noroeste-1',
      bounds: {
        north: 19.5800,
        south: 19.5619,
        east: -96.9601,
        west: -97.0000
      }
    },
    {
      name: 'Noroeste-2',
      bounds: {
        north: 19.5800,
        south: 19.5619,
        east: -96.9102,
        west: -96.9601
      }
    },
    {
      name: 'Noroeste-3',
      bounds: {
        north: 19.5619,
        south: 19.5438,
        east: -96.9601,
        west: -97.0000
      }
    },
    {
      name: 'Noroeste-4',
      bounds: {
        north: 19.5619,
        south: 19.5438,
        east: -96.9102,
        west: -96.9601
      }
    },
    // Noreste
    {
      name: 'Noreste-1',
      bounds: {
        north: 19.5800,
        south: 19.5619,
        east: -96.8551,
        west: -96.9102
      }
    },
    {
      name: 'Noreste-2',
      bounds: {
        north: 19.5800,
        south: 19.5619,
        east: -96.8000,
        west: -96.8551
      }
    },
    {
      name: 'Noreste-3',
      bounds: {
        north: 19.5619,
        south: 19.5438,
        east: -96.8551,
        west: -96.9102
      }
    },
    {
      name: 'Noreste-4',
      bounds: {
        north: 19.5619,
        south: 19.5438,
        east: -96.8000,
        west: -96.8551
      }
    },
    // Suroeste
    {
      name: 'Suroeste-1',
      bounds: {
        north: 19.5438,
        south: 19.5219,
        east: -96.9601,
        west: -97.0000
      }
    },
    {
      name: 'Suroeste-2',
      bounds: {
        north: 19.5438,
        south: 19.5219,
        east: -96.9102,
        west: -96.9601
      }
    },
    {
      name: 'Suroeste-3',
      bounds: {
        north: 19.5219,
        south: 19.5000,
        east: -96.9601,
        west: -97.0000
      }
    },
    {
      name: 'Suroeste-4',
      bounds: {
        north: 19.5219,
        south: 19.5000,
        east: -96.9102,
        west: -96.9601
      }
    },
    // Sureste
    {
      name: 'Sureste-1',
      bounds: {
        north: 19.5438,
        south: 19.5219,
        east: -96.8551,
        west: -96.9102
      }
    },
    {
      name: 'Sureste-2',
      bounds: {
        north: 19.5438,
        south: 19.5219,
        east: -96.8000,
        west: -96.8551
      }
    },
    {
      name: 'Sureste-3',
      bounds: {
        north: 19.5219,
        south: 19.5000,
        east: -96.8551,
        west: -96.9102
      }
    },
    {
      name: 'Sureste-4',
      bounds: {
        north: 19.5219,
        south: 19.5000,
        east: -96.8000,
        west: -96.8551
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
                    <td style="padding: 8px; border: 1px solid #e2e8f0;">${airQualityData[0]?.pm25} μg/m³</td>
                    <td style="padding: 8px; border: 1px solid #e2e8f0;">${getPollutantLevel('pm25', airQualityData[0]?.pm25)}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border: 1px solid #e2e8f0;">PM10</td>
                    <td style="padding: 8px; border: 1px solid #e2e8f0;">${airQualityData[0]?.pm10} μg/m³</td>
                    <td style="padding: 8px; border: 1px solid #e2e8f0;">${getPollutantLevel('pm10', airQualityData[0]?.pm10)}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border: 1px solid #e2e8f0;">NO₂</td>
                    <td style="padding: 8px; border: 1px solid #e2e8f0;">${airQualityData[0]?.no2} μg/m³</td>
                    <td style="padding: 8px; border: 1px solid #e2e8f0;">${getPollutantLevel('no2', airQualityData[0]?.no2)}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border: 1px solid #e2e8f0;">O₃</td>
                    <td style="padding: 8px; border: 1px solid #e2e8f0;">${airQualityData[0]?.o3} μg/m³</td>
                    <td style="padding: 8px; border: 1px solid #e2e8f0;">${getPollutantLevel('o3', airQualityData[0]?.o3)}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border: 1px solid #e2e8f0;">CO</td>
                    <td style="padding: 8px; border: 1px solid #e2e8f0;">${airQualityData[0]?.co} mg/m³</td>
                    <td style="padding: 8px; border: 1px solid #e2e8f0;">${getPollutantLevel('co', airQualityData[0]?.co)}</td>
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
            <strong>${getPollutantLevel('pm25', airQualityData[0]?.pm25)}</strong>. 
            ${getAirQualityConclusion(airQualityData[0]?.pm25)}</p>
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

    // Referencias
    const mapRef = useRef(null);
    const googleMapRef = useRef(null);
    const heatmapRef = useRef(null);
    const quadrantsRef = useRef([]);

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

            if (viewMode === 'heatmap') {
                const heatmapData = airQualityData.map(point => ({
                    location: new window.google.maps.LatLng(point.latitude, point.longitude),
                    weight: point.pm25 / Math.max(...airQualityData.map(d => d.pm25))
                }));

                heatmapRef.current = new window.google.maps.visualization.HeatmapLayer({
                    data: heatmapData,
                    map: googleMapRef.current,
                    radius: 50,
                    opacity: 0.8,
                    gradient: [
                        'rgba(0, 255, 0, 0)',
                        'rgba(0, 255, 0, 1)',
                        'rgba(255, 255, 0, 1)',
                        'rgba(255, 126, 0, 1)',
                        'rgba(255, 0, 0, 1)',
                        'rgba(153, 0, 76, 1)'
                    ]
                });
            } else {
                XALAPA_QUADRANTS.forEach(quadrant => {
                    const quality = calculateQuadrantAirQuality(quadrant, airQualityData);
                    if (!quality) return;

                    const rectangle = new window.google.maps.Rectangle({
                        bounds: {
                            north: quadrant.bounds.north,
                            south: quadrant.bounds.south,
                            east: quadrant.bounds.east,
                            west: quadrant.bounds.west
                        },
                        fillColor: quality.color,
                        fillOpacity: 0.35,
                        strokeColor: quality.color,
                        strokeWeight: 2,
                        map: googleMapRef.current
                    });

                    const infoWindow = new window.google.maps.InfoWindow({
                        content: `
                            <div style="padding: 12px; min-width: 200px;">
                                <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 8px; color: #1f2937;">
                                    ${quadrant.name}
                                </h3>
                                <div style="display: grid; gap: 4px;">
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
                                    <div style="display: flex; justify-content: space-between;">
                                        <span>O₃:</span>
                                        <span>${quality.averages.o3.toFixed(2)} µg/m³</span>
                                    </div>
                                    <div style="display: flex; justify-content: space-between;">
                                        <span>CO:</span>
                                        <span>${quality.averages.co.toFixed(2)} mg/m³</span>
                                    </div>
                                </div>
                            </div>
                        `
                    });

                    rectangle.addListener('mouseover', () => {
                        infoWindow.setPosition({
                            lat: (quadrant.bounds.north + quadrant.bounds.south) / 2,
                            lng: (quadrant.bounds.east + quadrant.bounds.west) / 2
                        });
                        infoWindow.open(googleMapRef.current);
                    });

                    rectangle.addListener('mouseout', () => {
                        infoWindow.close();
                    });

                    quadrantsRef.current.push(rectangle);
                });
            }
        };

        updateVisualization();
    }, [viewMode, airQualityData]);

    const calculateQuadrantAirQuality = (quadrant, data) => {
        // Obtener solo la última lectura de datos
        const latestData = data[data.length - 1];
        if (!latestData) return null;

        // Usar los valores más recientes en lugar de promedios
        const currentReadings = {
            pm25: latestData.pm25,
            pm10: latestData.pm10,
            no2: latestData.no2,
            o3: latestData.o3,
            co: latestData.co
        };

        return {
            color: getPollutantColor('pm25', currentReadings.pm25),
            averages: currentReadings
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
                        ? 'Datos reales de CAMS'
                        : dataSource === 'fallback'
                            ? 'Datos de ejemplo'
                            : 'Cargando...'
                }
            </div>

            {/* Botón de descarga */}
            {airQualityData && weatherData && (
                <button
                    onClick={() => generateReport(airQualityData, weatherData)}
                    className="absolute top-4 right-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded z-10"
                >
                    DESCARGAR REPORTE
                </button>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 auto-rows-fr">
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
                                onClick={() => setViewMode(viewMode === 'heatmap' ? 'quadrants' : 'heatmap')}
                                className="bg-white px-4 py-2 rounded shadow hover:bg-gray-100 transition-colors"
                            >
                                {viewMode === 'heatmap' ? 'Ver Cuadrantes' : 'Ver Heatmap'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Panel de Niveles de Contaminantes */}
                <div className="space-y-4">
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
            </div>

            {/* Componente de Condiciones Meteorológicas */}
            <div className="mt-4">
                <WeatherConditions weatherData={weatherData} />
            </div>
        </div>
    );
};

export default AirQualityDashboard;