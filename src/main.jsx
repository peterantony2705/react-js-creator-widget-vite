
// import React from 'react'
// import ReactDOM from 'react-dom/client'
// import App from './App.jsx'
// import { ChakraProvider } from '@chakra-ui/react'
// import { zohoService } from './services/zoho'

// async function initApp() {
//   const initialized = await zohoService.init();
//   if (!initialized) {
//     console.warn("Zoho Service failed to initialize, but continuing with app render.");
//   }

//   ReactDOM.createRoot(document.getElementById('root')).render(
//     <React.StrictMode>
//       <ChakraProvider>
//         <App />
//       </ChakraProvider>
//     </React.StrictMode>,
//   )
// }

// initApp();

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { ChakraProvider } from "@chakra-ui/react";
import { zohoService } from "./services/zoho";

async function initApp() {
  try {
    if (window?.ZOHO?.CREATOR) {
      await zohoService.init();
    } else {
      console.warn("Zoho SDK not available (local dev)");
    }
  } catch (error) {
    console.error("Zoho init error:", error);
  }

  ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <ChakraProvider>
        <App />
      </ChakraProvider>
    </React.StrictMode>
  );
}

initApp();