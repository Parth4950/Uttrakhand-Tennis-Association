import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Users, Calendar, MapPin, Clock, Award } from "lucide-react";
import AdminLogin from "@/components/AdminLogin";
import UserLogin from "@/components/UserLogin";
import Registration from "@/components/Registration";

const Index = () => {
  const [currentView, setCurrentView] = useState("home");

  const tournamentDetails = [
    { icon: Calendar, title: "Tournament Date", value: "June 15-17, 2025" },
    { icon: MapPin, title: "Venue", value: "UTA Tennis Complex, Dehradun" },
    { icon: Users, title: "Categories", value: "5 Different Categories Available" },
    { icon: Trophy, title: "Format", value: "Doubles Tournament" },
    { icon: Clock, title: "Registration Deadline", value: "June 13, 2025" },
    { icon: Award, title: "Participation", value: "2 Categories per Player" },
  ];

  const features = [
    "Professional doubles tournament format",
    "Multiple category participation (up to 2 per player)",
    "Expert tournament organization by UTA",
    "Competitive ranking system",
    "Premium venue facilities",
    "Official tournament certification",
    "Live scoring and updates",
    "Professional referee services",
    "Awards and prizes for winners",
    "Networking opportunities with players",
    "Standard tournament equipment provided",
    "Medical support on-site",
    "Photography and coverage",
    "Post-tournament analysis",
    "Player statistics tracking",
    "Tournament memorabilia",
    "Refreshments and meals",
    "Parking facilities available",
    "Live streaming of finals",
    "Social media coverage",
    "Player feedback system",
    "Future tournament invitations"
  ];

  if (currentView === "admin") {
    return <AdminLogin onBack={() => setCurrentView("home")} />;
  }

  if (currentView === "user") {
    return <UserLogin onBack={() => setCurrentView("home")} />;
  }

  if (currentView === "register") {
    return <Registration onBack={() => setCurrentView("home")} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Trophy className="h-8 w-8 text-green-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Uttaranchal Tennis Association</h1>
                <p className="text-sm text-gray-600">Annual Doubles Tournament 2025</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 bg-gradient-to-r from-green-600 to-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-6xl font-bold mb-4">
            UTA Doubles Championship 2025
          </h2>
          <p className="text-xl md:text-2xl mb-8 opacity-90">
            Join the most prestigious tennis tournament in Uttarakhand
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              variant="secondary"
              onClick={() => setCurrentView("register")}
              className="text-lg px-8 py-3"
            >
              Register Now
            </Button>
            <Button
              size="lg"
              variant="secondary"
              onClick={() => setCurrentView("user")}
              className="text-lg px-8 py-3"
            >
              Player Login
            </Button>
            <Button
              size="lg"
              variant="secondary"
              onClick={() => setCurrentView("admin")}
              className="text-lg px-8 py-3"
            >
              Admin Login
            </Button>
          </div>
        </div>
      </section>

      {/* Tournament Info */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-8 text-gray-900">Tournament Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {tournamentDetails.map((detail, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <detail.icon className="h-12 w-12 text-green-600 mx-auto mb-2" />
                  <CardTitle className="text-lg">{detail.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{detail.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-8 text-gray-900">Tournament Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center space-x-3 p-4 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="w-2 h-2 bg-green-600 rounded-full flex-shrink-0"></div>
                <p className="text-gray-700">{feature}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Trophy className="h-6 w-6" />
            <span className="text-lg font-semibold">Uttaranchal Tennis Association</span>
          </div>
          <p className="text-gray-400 mb-2">Promoting tennis excellence in Uttarakhand</p>
          <p className="text-sm text-gray-500">© 2025 UTA. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
