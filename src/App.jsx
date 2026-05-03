
// import React, { useState } from 'react';
// import { Box, ChakraProvider, extendTheme } from '@chakra-ui/react';
// import Step1Scanner from './components/Step1Scanner';
// import Step2Billing from './components/Step2Billing';

// function App() {
//   const [step, setStep] = useState(1);
//   const [cart, setCart] = useState([]);

//   const handleNext = () => setStep(2);
//   const handleBack = () => setStep(1);
//   const handleComplete = () => {
//     setCart([]);
//     setStep(1);
//   };

//   return (
//     <Box minH="100vh" bg="gray.100">
//       {step === 1 ? (
//         <Step1Scanner cart={cart} setCart={setCart} onNext={handleNext} />
//       ) : (
//         <Step2Billing
//           cart={cart}
//           setCart={setCart}
//           onBack={handleBack}
//           onComplete={handleComplete}
//         />
//       )}
//     </Box>
//   );
// }

// export default App;
import React, { useState, useEffect } from "react";
import { Box } from "@chakra-ui/react";
import Step1Scanner from "./components/Step1Scanner";
import Step2Billing from "./components/Step2Billing";
import { zohoService } from "./services/zoho";
function App() {
  const [step, setStep] = useState(1);
  const [cart, setCart] = useState([]);
  useEffect(() => {
    zohoService.init();
  }, []);

  return (
    <Box minH="100vh" bg="gray.100">
      {step === 1 ? (
        <Step1Scanner
          cart={cart}
          setCart={setCart}
          onNext={() => setStep(2)}
        />
      ) : (
        <Step2Billing
          cart={cart}
          setCart={setCart}
          onBack={() => setStep(1)}
          onComplete={() => {
            setCart([]);
            setStep(1);
          }}
        />
      )}
    </Box>
  );
}

export default App;