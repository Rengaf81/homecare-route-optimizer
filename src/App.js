import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function RouteOptimizer() {
    const [addresses, setAddresses] = useState([""]);
    const [optimizedRoute, setOptimizedRoute] = useState([]);

    const handleAddAddress = () => {
        setAddresses([...addresses, ""]);
    };

    const handleAddressChange = (index, value) => {
        const newAddresses = [...addresses];
        newAddresses[index] = value;
        setAddresses(newAddresses);
    };

    const handleOptimizeRoutes = async () => {
        if (addresses.some(addr => addr.trim() === "")) {
            alert("Por favor, preencha todos os endereços.");
            return;
        }

        try {
            // Convertendo os endereços para coordenadas usando OpenCage Geocoding (gratuito)
            const apiKey = "SUA_API_KEY_OPENCAGE";
            const coordinates = await Promise.all(addresses.map(async (address) => {
                const geoResponse = await fetch(`https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(address)}&key=${apiKey}`);
                const geoData = await geoResponse.json();
                if (geoData.results && geoData.results.length > 0) {
                    const { lat, lng } = geoData.results[0].geometry;
                    return [lng, lat];
                } else {
                    alert(`Endereço não encontrado: ${address}`);
                    throw new Error(`Endereço não encontrado: ${address}`);
                }
            }));

            // Otimizando a rota usando OpenRouteService
            const orsApiKey = "SUA_API_KEY_OPENROUTESERVICE";
            const routeResponse = await fetch("https://api.openrouteservice.org/v2/matrix/driving-car", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": orsApiKey
                },
                body: JSON.stringify({
                    locations: coordinates,
                    metrics: ["distance"],
                    units: "km"
                })
            });
            const routeData = await routeResponse.json();

            if (routeData.durations) {
                const orderedAddresses = addresses.slice();
                setOptimizedRoute(orderedAddresses);
            } else {
                alert("Erro ao otimizar rotas: " + routeData.error);
            }
        } catch (error) {
            alert("Erro ao conectar à API: " + error.message);
        }
    };

    return (
        <div className="p-8">
            <Card className="mb-4">
                <CardContent>
                    <h2 className="text-2xl font-bold mb-4">Homecare Route Optimizer</h2>
                    {addresses.map((address, index) => (
                        <div key={index} className="mb-2">
                            <Input
                                placeholder="Digite o endereço"
                                value={address}
                                onChange={(e) => handleAddressChange(index, e.target.value)}
                            />
                        </div>
                    ))}
                    <Button onClick={handleAddAddress} className="mb-4">Adicionar Endereço</Button>
                    <Button onClick={handleOptimizeRoutes}>Otimizar Rotas</Button>
                </CardContent>
            </Card>
            {optimizedRoute.length > 0 && (
                <Card>
                    <CardContent>
                        <h3 className="text-xl font-bold mb-2">Rota Otimizada:</h3>
                        <ul>
                            {optimizedRoute.map((address, index) => (
                                <li key={index}>{address}</li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
