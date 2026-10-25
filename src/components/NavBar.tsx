import { NavLink } from "react-router-dom";
import { Compass, Heart, MapPinned, Home, PlusCircle } from "lucide-react";

const links = [
  { to: "/", label: "Home", icon: Home },
  { to: "/discover", label: "Discover", icon: Compass },
  { to: "/saved", label: "Saved", icon: Heart },
  { to: "/itinerary", label: "Itinerary", icon: MapPinned },
  { to: "/tambah", label: "Tambah", icon: PlusCircle },
];

export default function NavBar() {
  return (
    <>
      <header className="sticky top-0 z-40 hidden border-b border-slate-200 bg-white/80 backdrop-blur md:block">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <NavLink to="/" className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <span className="text-2xl">🧭</span> PergiMain
          </NavLink>
          <nav className="flex items-center gap-1">
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                    isActive
                      ? "bg-orange-500 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100"
                  }`
                }
              >
                <Icon size={16} />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-between border-t border-slate-200 bg-white/95 px-2 py-2 backdrop-blur md:hidden">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 rounded-xl py-2 text-xs font-medium transition ${
                isActive ? "text-orange-500" : "text-slate-500"
              }`
            }
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
      </nav>
    </>
  );
}
