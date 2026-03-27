import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n";

// Lock to dark theme
document.documentElement.classList.add('dark');

createRoot(document.getElementById("root")!).render(<App />);
