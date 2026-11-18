import React, { useEffect, useMemo, useState } from "react";
import NewPlantForm from "./NewPlantForm";
import PlantList from "./PlantList";
import Search from "./Search";

const PLANTS_URL = "http://localhost:6001/plants";

function PlantPage() {
  const [plants, setPlants] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    // Load the collection once when the plant page mounts.
    let isMounted = true;

    async function loadPlants() {
      try {
        const response = await fetch(PLANTS_URL);
        if (!response.ok) {
          throw new Error("Unable to load plants.");
        }

        const loadedPlants = await response.json();
        if (isMounted) {
          setPlants(loadedPlants);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message);
        }
      }
    }

    loadPlants();
    return () => {
      isMounted = false;
    };
  }, []);

  // Keep the source list intact so clearing the query restores every plant.
  const filteredPlants = useMemo(
    () =>
      plants.filter((plant) =>
        plant.name.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [plants, searchTerm],
  );

  async function handleAddPlant(plant) {
    setError("");

    try {
      const response = await fetch(PLANTS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(plant),
      });
      if (!response.ok) {
        throw new Error("Unable to add plant.");
      }

      const savedPlant = await response.json();
      setPlants((currentPlants) => [...currentPlants, savedPlant]);
      return savedPlant;
    } catch (addError) {
      setError(addError.message);
      return null;
    }
  }

  async function handleMarkSoldOut(plantId) {
    setError("");

    try {
      const response = await fetch(`${PLANTS_URL}/${plantId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ soldOut: true }),
      });
      if (!response.ok) {
        throw new Error("Unable to update plant stock.");
      }

      // Update the UI only after the backend confirms the stock change.
      setPlants((currentPlants) =>
        currentPlants.map((plant) =>
          plant.id === plantId ? { ...plant, soldOut: true } : plant,
        ),
      );
    } catch (updateError) {
      setError(updateError.message);
    }
  }

  return (
    <main>
      <NewPlantForm onAddPlant={handleAddPlant} />
      <Search searchTerm={searchTerm} onSearch={setSearchTerm} />
      {error && <p role="alert">{error}</p>}
      <PlantList plants={filteredPlants} onMarkSoldOut={handleMarkSoldOut} />
    </main>
  );
}

export default PlantPage;
