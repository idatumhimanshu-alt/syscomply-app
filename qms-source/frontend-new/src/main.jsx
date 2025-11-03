import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import "react-toastify/dist/ReactToastify.css";
// Material Dashboard 2 React Context Provider
import { MaterialUIControllerProvider } from "../src/context";

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MaterialUIControllerProvider>
      <App />
    </MaterialUIControllerProvider>

  </StrictMode>,
)
