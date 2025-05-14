import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const HomecareRouteOptimizer = () => {
    const [addresses, setAddresses] = useState(['']);
    const [routes, setRoutes] = useState([]);
    const [appointmentTimes, setAppointmentTimes] = useState(['']);
    const [totalDistance, setTotalDistance] = useState(0);
    const [totalDuration, setTotalDuration] = useState(0);
    const [trafficImpact, setTrafficImpact] = useState(1.0);
    const startingPoint = "555 Sheppard Ave W";

    useEffect(() => {
        const currentHour = new Date().getHours();
        if (currentHour >= 7 && currentHour <= 9 || currentHour >= 16 && currentHour <= 19) {
            setTrafficImpact(1.3);  // Tráfego pesado (30% mais tempo)
        } else if (currentHour >= 10 && currentHour <= 15) {
            setTrafficImpact(1.1);  // Tráfego moderado (10% mais tempo)
        } else {
            setTrafficImpact(1.0);  // Tráfego leve
        }
    }, []);

    const handleAddAddress = () => {
        setAddresses([...addresses, '']);
        setAppointmentTimes([...appointmentTimes, '']);
    };

    const handleAddressChange = (index, value) => {
        const newAddresses = [...addresses];
        newAddresses[index] = value;
        setAddresses(newAddresses);
    };

    const handleTimeChange = (index, value) => {
        const newTimes = [...appointmentTimes];
        newTimes[index] = value;
        setAppointmentTimes(newTimes);
    };

    const handleGeocode = async (address) => {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`);
        const data = await response.json();
        if (data.length > 0) {
            const { lat, lon } = data[0];
            return [parseFloat(lon), parseFloat(lat)];
        }
        return null;
    };

    const handleOptimizeRoutes = async () => {
        try {
            const coordinates = [];
            const startCoord = await handleGeocode(startingPoint);
            if (startCoord) coordinates.push(startCoord);
            for (const address of addresses) {
                const coord = await handleGeocode(address);
                if (coord) coordinates.push(coord);
            }

            const apiKey = process.env.NEXT_PUBLIC_ORS_API_KEY;
            const baseUrl = 'https://api.openrouteservice.org/v2/directions/driving-car';
            const response = await fetch(baseUrl, {
                method: 'POST',
                headers: {
                    'Authorization': apiKey,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    coordinates,
                    instructions: true
                })
            });
            const data = await response.json();
            const optimizedCoords = data.features[0].geometry.coordinates;
            const totalDist = data.features[0].properties.segments[0].distance / 1000; // Km
            const totalDur = (data.features[0].properties.segments[0].duration / 60) * trafficImpact; // Minutos com ajuste de tráfego
            setRoutes(optimizedCoords);
            setTotalDistance(totalDist.toFixed(2));
            setTotalDuration(totalDur.toFixed(2));
        } catch (error) {
            console.error('Erro ao otimizar as rotas:', error);
        }
    };

    return (
        <div className="p-6 space-y-4">
            <h1 className="text-2xl font-bold">Homecare Route Optimizer</h1>
            {addresses.map((address, index) => (
                <div key={index} className="mb-4">
                    <input
                        value={address}
                        placeholder={`Endereço ${index + 1}`}
                        onChange={(e) => handleAddressChange(index, e.target.value)}
                        className="w-full mb-2 p-2 border border-gray-300 rounded"
                    />
                    <input
                        value={appointmentTimes[index]}
                        placeholder="Horário de Atendimento (HH:MM)"
                        onChange={(e) => handleTimeChange(index, e.target.value)}
                        className="w-full mb-2 p-2 border border-gray-300 rounded"
                    />
                </div>
            ))}
            <button onClick={handleAddAddress} className="bg-blue-500 text-white px-4 py-2 rounded mr-2">Adicionar Endereço</button>
            <button onClick={handleOptimizeRoutes} className="bg-green-500 text-white px-4 py-2 rounded">Otimizar Rotas</button>

            {routes.length > 0 && (
                <div className="mt-6 p-4 border rounded bg-gray-100">
                    <h2 className="text-xl font-semibold">Resumo do Percurso</h2>
                    <p>Distância Total: {totalDistance} km</p>
                    <p>Tempo Estimado (com tráfego): {totalDuration} minutos</p>
                </div>
            )}

            <MapContainer center={[43.7536, -79.4393]} zoom={12} style={{ height: '400px', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {routes.map((coord, index) => (
                    <Marker key={index} position={[coord[1], coord[0]]}>
                        <Popup>
                            <strong>Atendimento {index + 1}</strong><br />
                            {index === 0 ? startingPoint : addresses[index - 1]}<br />
                            {index === 0 ? 'Ponto de Partida' : `Horário: ${appointmentTimes[index - 1]}`}
                        </Popup>
                    </Marker>
                ))}
                <Polyline positions={routes.map(coord => [coord[1], coord[0]])} color="blue" />
            </MapContainer>
        </div>
    );
};

export default HomecareRouteOptimizer;
