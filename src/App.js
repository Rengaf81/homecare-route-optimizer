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
            const response = await fetch("https://api.mapbox.com/optimized-trips/v1/mapbox/driving/" + 
                addresses.map(encodeURIComponent).join(";") + "?access_token=SEU_TOKEN_MAPBOX");
            const data = await response.json();

            if (data.code === "Ok") {
                const orderedAddresses = data.waypoints.sort((a, b) => a.waypoint_index - b.waypoint_index).map(wp => addresses[wp.waypoint_index]);
                setOptimizedRoute(orderedAddresses);
            } else {
                alert("Erro ao otimizar rotas: " + data.message);
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
