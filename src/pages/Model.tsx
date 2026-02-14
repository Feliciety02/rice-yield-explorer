import { Navbar } from "@/components/layout/Navbar";
import SimulationModel from "@/components/SimulationModel";

const Model = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold font-serif text-foreground">
            Simulation Model
          </h1>
          <p className="text-muted-foreground mt-1">
            Arena-style flowchart of the rice yield simulation logic.
          </p>
        </div>

        <SimulationModel />
      </main>
    </div>
  );
};

export default Model;
