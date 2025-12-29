import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Load theme preference
const savedTheme = localStorage.getItem('liftmate_theme');
if (savedTheme === 'light') {
  document.documentElement.classList.remove('dark');
} else {
  // Default to dark theme
  document.documentElement.classList.add('dark');
}

createRoot(document.getElementById("root")!).render(<App />);
