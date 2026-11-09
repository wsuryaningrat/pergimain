import { Routes, Route } from "react-router-dom";
import NavBar from "./components/NavBar";
import Home from "./pages/Home";
import Discover from "./pages/Discover";
import PlaceDetail from "./pages/PlaceDetail";
import Saved from "./pages/Saved";
import Itinerary from "./pages/Itinerary";
import AddPlace from "./pages/AddPlace";
import Extension from "./pages/Extension";

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <NavBar />
      <main className="mx-auto max-w-5xl px-4 pb-24 pt-6 md:pb-10">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/discover" element={<Discover />} />
          <Route path="/place/:id" element={<PlaceDetail />} />
          <Route path="/saved" element={<Saved />} />
          <Route path="/itinerary" element={<Itinerary />} />
          <Route path="/tambah" element={<AddPlace />} />
          <Route path="/ekstensi" element={<Extension />} />
        </Routes>
      </main>
    </div>
  );
}
