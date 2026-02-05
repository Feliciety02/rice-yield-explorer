import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/layout/Navbar";
import { SCENARIOS } from "@/types/simulation";
import { 
  Sun, 
  CloudRain, 
  Cloud, 
  Shuffle, 
  Sprout,
  ArrowRight,
  Leaf
} from "lucide-react";

const scenarioIcons = [Sun, CloudRain, CloudRain, Shuffle, Sprout];
const scenarioColors = [
  "bg-amber-100 text-amber-700 border-amber-200",
  "bg-orange-100 text-orange-700 border-orange-200",
  "bg-blue-100 text-blue-700 border-blue-200",
  "bg-purple-100 text-purple-700 border-purple-200",
  "bg-primary/10 text-primary border-primary/20",
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/10" />
        <div className="container mx-auto px-4 py-16 md:py-24 relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 animate-fade-in">
              <Leaf className="w-4 h-4" />
              Academic Research Tool
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 animate-slide-up font-serif leading-tight">
              Simulation of Rice Yield Under Variable Rainfall Conditions
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 animate-slide-up leading-relaxed" style={{ animationDelay: "0.1s" }}>
              An interactive decision-support tool for exploring how different rainfall scenarios 
              affect rice crop productivity across multiple planting seasons.
            </p>
            
            <Link to="/simulator" className="inline-block animate-slide-up" style={{ animationDelay: "0.2s" }}>
              <Button size="lg" className="text-lg px-8 py-6 gap-2">
                Open Simulator
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Abstract Section */}
      <section className="py-12 md:py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="font-serif text-2xl">Abstract</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-slate">
              <p className="text-muted-foreground leading-relaxed">
                Rice production is highly sensitive to rainfall variability, making it crucial for 
                agricultural planning to understand yield responses under different weather conditions. 
                This simulation tool employs a discrete event modeling approach to analyze rice yield 
                outcomes across five distinct rainfall scenarios: normal conditions, drought stress, 
                flood conditions, variable weather patterns, and an early planting adaptation strategy.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Through stochastic simulation, users can explore how probability distributions of 
                rainfall events translate to expected yields, yield variability, and risk of crop 
                failure. The model demonstrates that while normal rainfall conditions optimize yield 
                at approximately 4.0 t/ha, strategic early planting can mitigate the negative impacts 
                of weather uncertainty by increasing the probability of favorable growing conditions.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Scenarios Section */}
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-serif mb-4">
              Rainfall Scenarios
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Explore five distinct climate scenarios to understand their impact on rice production
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {SCENARIOS.map((scenario, index) => {
              const Icon = scenarioIcons[index];
              return (
                <Card 
                  key={scenario.id} 
                  className="scenario-card group"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CardHeader className="pb-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${scenarioColors[index]} mb-3 transition-transform group-hover:scale-110`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <CardTitle className="font-serif text-xl">{scenario.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {scenario.description}
                    </p>
                    <div className="mt-4 pt-4 border-t border-border">
                      <p className="text-xs text-muted-foreground">
                        Default probabilities: Low {scenario.defaultProbabilities.low}% | 
                        Normal {scenario.defaultProbabilities.normal}% | 
                        High {scenario.defaultProbabilities.high}%
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            
            {/* CTA Card */}
            <Card className="scenario-card bg-primary text-primary-foreground border-primary flex flex-col justify-center">
              <CardContent className="text-center py-8">
                <Cloud className="w-12 h-12 mx-auto mb-4 opacity-80" />
                <h3 className="font-serif text-xl font-bold mb-3">Ready to Simulate?</h3>
                <p className="text-primary-foreground/80 text-sm mb-6">
                  Configure parameters and run your own simulations
                </p>
                <Link to="/simulator">
                  <Button variant="secondary" className="gap-2">
                    Start Now
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border bg-muted/20">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Rice Yield Simulation Tool — Academic Research Application</p>
          <p className="mt-2">
            Built for educational and decision-support purposes
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
