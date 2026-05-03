// /* global ZOHO */

// const APP_NAME = import.meta.env.VITE_APP_NAME;
// const REPORT_NAME = import.meta.env.VITE_REPORT_NAME;
// const SALES_FORM = import.meta.env.VITE_SALES_FORM;
// const CUSTOMER_FORM = import.meta.env.VITE_CUSTOMER_FORM;
// const CUSTOMER_REPORT = import.meta.env.VITE_CUSTOMER_REPORT;
// const DISCOUNT_REPORT = import.meta.env.VITE_DISCOUNT_REPORT;

// let zohoInitPromise = null;

// /**
//  * Get Zoho Creator instance safely
//  */
// const getZC = () => {
//   if (typeof window === "undefined") return null;
//   return window?.ZOHO?.CREATOR || null;
// };

// /**
//  * Wait for Zoho SDK to load
//  */
// const waitForZoho = () => {
//   return new Promise((resolve) => {
//     const check = () => {
//       if (window?.ZOHO?.CREATOR) {
//         resolve(window.ZOHO.CREATOR);
//       } else {
//         setTimeout(check, 100);
//       }
//     };
//     check();
//   });
// };

// /**
//  * Zoho Creator Service Wrapper
//  */
// export const zohoService = {

//   /**
//    * Initialize Zoho SDK (only once)
//    */
//   init: async () => {

//     if (zohoInitPromise) {
//       return zohoInitPromise;
//     }

//     zohoInitPromise = new Promise(async (resolve) => {

//       try {

//         const ZC = await waitForZoho();

//         if (!ZC) {
//           console.warn("Zoho SDK not available.");
//           resolve(false);
//           return;
//         }

//         await ZC.init();

//         console.log("Zoho SDK Initialized");

//         resolve(true);

//       } catch (error) {
//         console.error("Zoho Init Error:", error);
//         resolve(false);
//       }

//     });

//     return zohoInitPromise;
//   },

//   /**
//    * Get Query Parameters
//    */
//   getQueryParams: async () => {

//     try {

//       await zohoService.init();

//       const ZC = getZC();

//       if (!ZC) return {};

//       const response = await ZC.UTIL.getQueryParams();

//       return response || {};

//     } catch (error) {

//       console.error("Error fetching query params:", error);
//       return {};

//     }

//   },

//   /**
//    * Fetch Product
//    */
//   fetchProduct: async (sku, storeEmail) => {

//     try {

//       await zohoService.init();

//       const ZC = getZC();

//       if (!ZC?.DATA) {
//         throw new Error("Zoho DATA SDK not available");
//       }

//       if (!storeEmail) {
//         const params = await zohoService.getQueryParams();
//         storeEmail = params?.store_email || "";
//       }

//       const config = {
//         app_name: APP_NAME,
//         report_name: REPORT_NAME,
//         criteria: `(Barcode == "${sku}" && Branch_Name.Email == "${storeEmail}")`
//       };

//       const response = await ZC.DATA.getRecords(config);

//       if (response.code === 3000 && response.data?.length > 0) {
//         return response.data[0];
//       }

//       return null;

//     } catch (error) {

//       console.error("Fetch Product Error:", error);
//       throw error;

//     }

//   },

//   /**
//    * Fetch Customers
//    */
//   fetchCustomers: async (query = "", storeEmail) => {

//     try {

//       await zohoService.init();

//       const ZC = getZC();

//       if (!ZC?.DATA) {
//         throw new Error("Zoho DATA SDK not available");
//       }

//       if (!storeEmail) {
//         const params = await zohoService.getQueryParams();
//         storeEmail = params?.store_email || "";
//       }

//       const criteria =
//         query.length > 2
//           ? `((Phone_Number.containsIgnoreCase("${query}") || Name_Str.containsIgnoreCase("${query}")) && Branch_Name.Email == "${storeEmail}")`
//           : `(Branch_Name.Email == "${storeEmail}")`;

//       const config = {
//         app_name: APP_NAME,
//         report_name: CUSTOMER_REPORT,
//         criteria,
//         max_records: 200
//       };

//       const response = await ZC.DATA.getRecords(config);

//       return response.code === 3000 ? response.data || [] : [];

//     } catch (error) {

//       console.error("Fetch Customers Error:", error);
//       throw error;

//     }

//   },

//   /**
//    * Create Customer
//    */
//   createCustomer: async (customerData) => {

//     try {

//       await zohoService.init();

//       const ZC = getZC();

//       if (!ZC?.DATA) {
//         throw new Error("Zoho DATA SDK not available");
//       }

//       const config = {
//         app_name: APP_NAME,
//         form_name: CUSTOMER_FORM,
//         payload: {
//           ...customerData,
//           Children_Details: customerData.children || []
//         }
//       };

//       const response = await ZC.DATA.addRecords(config);

//       if (response.code === 3000) {
//         return response;
//       }

//       throw new Error("Customer creation failed");

//     } catch (error) {

//       console.error("Create Customer Error:", error);
//       throw error;

//     }

//   },

//   /**
//    * Get Discounts
//    */
//   getDiscounts: async () => {

//     try {

//       await zohoService.init();

//       const ZC = getZC();

//       if (!ZC?.DATA) {
//         throw new Error("Zoho DATA SDK not available");
//       }

//       const today = new Date().toISOString().split("T")[0];

//       const config = {
//         app_name: APP_NAME,
//         report_name: DISCOUNT_REPORT,
//         criteria: `(Start_Date <= "${today}" && End_Date >= "${today}")`,
//         max_records: 200
//       };

//       const response = await ZC.DATA.getRecords(config);

//       return response.code === 3000 ? response.data || [] : [];

//     } catch (error) {

//       console.error("Fetch Discounts Error:", error);
//       throw error;

//     }

//   },

//   /**
//    * Create Sales Order
//    */
//   createSalesOrder: async (orderData) => {

//     try {

//       await zohoService.init();

//       const ZC = getZC();

//       if (!ZC?.DATA) {
//         throw new Error("Zoho DATA SDK not available");
//       }

//       const config = {
//         app_name: APP_NAME,
//         form_name: SALES_FORM,
//         payload: orderData
//       };

//       const response = await ZC.DATA.addRecords(config);

//       if (response.code === 3000) {
//         return response;
//       }

//       throw new Error("Sales order creation failed");

//     } catch (error) {

//       console.error("Create Sales Order Error:", error);
//       throw error;

//     }

//   },

//   /**
//    * Update Record
//    */
//   updateRecord: async (reportName, id, data) => {

//     try {

//       await zohoService.init();

//       const ZC = getZC();

//       if (!ZC?.DATA) {
//         throw new Error("Zoho DATA SDK not available");
//       }

//       const config = {
//         app_name: APP_NAME,
//         report_name: reportName,
//         id,
//         payload: data
//       };

//       const response = await ZC.DATA.updateRecord(config);

//       return response;

//     } catch (error) {

//       console.error("Update Record Error:", error);
//       throw error;

//     }

//   }

// };

/* global ZOHO */

const APP_NAME = import.meta.env.VITE_APP_NAME;
const REPORT_NAME = import.meta.env.VITE_REPORT_NAME;
const SALES_FORM = import.meta.env.VITE_SALES_FORM;
const CUSTOMER_FORM = import.meta.env.VITE_CUSTOMER_FORM;
const CUSTOMER_REPORT = import.meta.env.VITE_CUSTOMER_REPORT;
const DISCOUNT_REPORT = import.meta.env.VITE_DISCOUNT_REPORT;

let zohoInitPromise = null;
let sdkReady = false;

/**
 * Get Zoho Creator instance safely
 * FIXED: Check both ZOHO.CREATOR and window.ZOHO.CREATOR
 */
const getZC = () => {
  if (typeof window === "undefined") return null;
  
  // Try multiple paths
  if (window?.ZOHO?.CREATOR) {
    return window.ZOHO.CREATOR;
  }
  if (typeof ZOHO !== "undefined" && ZOHO.CREATOR) {
    return ZOHO.CREATOR;
  }
  return null;
};

/**
 * Wait for Zoho SDK to load
 * FIXED: Added timeout and better error handling
 */
const waitForZoho = (timeout = 15000) => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const check = () => {
      try {
        // Check multiple possible locations
        if (window?.ZOHO?.CREATOR) {
          console.log("✅ Zoho CREATOR SDK found");
          resolve(window.ZOHO.CREATOR);
          return;
        }
        
        if (typeof ZOHO !== "undefined" && ZOHO.CREATOR) {
          console.log("✅ Zoho CREATOR SDK found (global)");
          resolve(ZOHO.CREATOR);
          return;
        }

        // Check if timeout exceeded
        if (Date.now() - startTime > timeout) {
          console.error("❌ Zoho SDK timeout - SDK not loaded after " + timeout + "ms");
          reject(new Error("Zoho SDK timeout"));
          return;
        }

        // Keep checking every 100ms
        setTimeout(check, 100);
        
      } catch (error) {
        reject(error);
      }
    };
    
    check();
  });
};

/**
 * Zoho Creator Service Wrapper
 * FIXED: Better error handling, retry logic, and proper initialization
 */
export const zohoService = {

  /**
   * Initialize Zoho SDK (only once)
   * FIXED: Added better error handling and logging
   */
  init: async () => {

    if (sdkReady) {
      console.log("✅ Zoho SDK already initialized");
      return true;
    }

    if (zohoInitPromise) {
      return zohoInitPromise;
    }

    zohoInitPromise = new Promise(async (resolve) => {

      try {

        console.log("🔄 Initializing Zoho SDK...");

        const ZC = await waitForZoho();

        if (!ZC) {
          console.error("❌ Zoho CREATOR SDK not available");
          resolve(false);
          return;
        }

        console.log("✅ Zoho CREATOR found, calling init()...");

        // FIXED: ZC.init() sometimes doesn't exist in newer versions
        if (typeof ZC.init === "function") {
          await ZC.init();
          console.log("✅ Zoho SDK init() completed");
        } else {
          console.log("⚠️ ZC.init() not available, SDK might auto-initialize");
        }

        sdkReady = true;
        console.log("✅ Zoho SDK ready!");
        resolve(true);

      } catch (error) {
        console.error("❌ Zoho Init Error:", error.message || error);
        sdkReady = false;
        resolve(false);
      }

    });

    return zohoInitPromise;
  },

  /**
   * Get Query Parameters
   * FIXED: Better error handling
   */
  getQueryParams: async () => {

    try {

      await zohoService.init();

      const ZC = getZC();

      if (!ZC) {
        console.warn("⚠️ Zoho SDK not available for query params");
        return {};
      }

      // FIXED: Check if UTIL exists
      if (!ZC.UTIL || typeof ZC.UTIL.getQueryParams !== "function") {
        console.warn("⚠️ Zoho UTIL.getQueryParams not available");
        return {};
      }

      const response = await ZC.UTIL.getQueryParams();

      return response || {};

    } catch (error) {

      console.error("❌ Error fetching query params:", error.message || error);
      return {};

    }

  },

  /**
   * Fetch Product
   * FIXED: Better error messages and validation
   */
  fetchProduct: async (sku, storeEmail) => {

    try {

      if (!sku) {
        throw new Error("SKU is required");
      }

      await zohoService.init();

      const ZC = getZC();

      if (!ZC) {
        throw new Error("Zoho SDK not initialized");
      }

      // FIXED: Check if DATA exists
      if (!ZC.DATA || typeof ZC.DATA.getRecords !== "function") {
        throw new Error("Zoho DATA SDK not available - check if app is LIVE and API is enabled");
      }

      if (!storeEmail) {
        const params = await zohoService.getQueryParams();
        storeEmail = params?.store_email || "";
      }

      console.log(`🔍 Fetching product with SKU: ${sku}`);

      const config = {
        app_name: APP_NAME,
        report_name: REPORT_NAME,
        criteria: `(Barcode == "${sku}" && Branch_Name.Email == "${storeEmail}")`
      };

      console.log("📤 Zoho API Request:", config);

      const response = await ZC.DATA.getRecords(config);

      console.log("📥 Zoho API Response:", response);

      if (response.code === 3000 && response.data?.length > 0) {
        console.log("✅ Product found");
        return response.data[0];
      }

      console.warn("⚠️ Product not found");
      return null;

    } catch (error) {

      console.error("❌ Fetch Product Error:", error.message || error);
      throw error;

    }

  },

  /**
   * Fetch Customers
   * FIXED: Better validation and error handling
   */
  fetchCustomers: async (query = "", storeEmail) => {

    try {

      await zohoService.init();

      const ZC = getZC();

      if (!ZC) {
        throw new Error("Zoho SDK not initialized");
      }

      if (!ZC.DATA || typeof ZC.DATA.getRecords !== "function") {
        throw new Error("Zoho DATA SDK not available");
      }

      if (!storeEmail) {
        const params = await zohoService.getQueryParams();
        storeEmail = params?.store_email || "";
      }

      const criteria =
        query.length > 2
          ? `((Phone_Number.containsIgnoreCase("${query}") || Name_Str.containsIgnoreCase("${query}")) && Branch_Name.Email == "${storeEmail}")`
          : `(Branch_Name.Email == "${storeEmail}")`;

      const config = {
        app_name: APP_NAME,
        report_name: CUSTOMER_REPORT,
        criteria,
        max_records: 200
      };

      console.log("🔍 Fetching customers...");

      const response = await ZC.DATA.getRecords(config);

      return response.code === 3000 ? response.data || [] : [];

    } catch (error) {

      console.error("❌ Fetch Customers Error:", error.message || error);
      throw error;

    }

  },

  /**
   * Create Customer
   * FIXED: Better error handling
   */
  createCustomer: async (customerData) => {

    try {

      if (!customerData) {
        throw new Error("Customer data is required");
      }

      await zohoService.init();

      const ZC = getZC();

      if (!ZC) {
        throw new Error("Zoho SDK not initialized");
      }

      if (!ZC.DATA || typeof ZC.DATA.addRecords !== "function") {
        throw new Error("Zoho DATA SDK not available");
      }

      const config = {
        app_name: APP_NAME,
        form_name: CUSTOMER_FORM,
        payload: {
          ...customerData,
          Children_Details: customerData.children || []
        }
      };

      console.log("📝 Creating customer...");

      const response = await ZC.DATA.addRecords(config);

      if (response.code === 3000) {
        console.log("✅ Customer created successfully");
        return response;
      }

      throw new Error(`Customer creation failed: ${response.message || "Unknown error"}`);

    } catch (error) {

      console.error("❌ Create Customer Error:", error.message || error);
      throw error;

    }

  },

  /**
   * Get Discounts
   * FIXED: Better validation
   */
  getDiscounts: async () => {

    try {

      await zohoService.init();

      const ZC = getZC();

      if (!ZC) {
        throw new Error("Zoho SDK not initialized");
      }

      if (!ZC.DATA || typeof ZC.DATA.getRecords !== "function") {
        throw new Error("Zoho DATA SDK not available");
      }

      const today = new Date().toISOString().split("T")[0];

      const config = {
        app_name: APP_NAME,
        report_name: DISCOUNT_REPORT,
        criteria: `(Start_Date <= "${today}" && End_Date >= "${today}")`,
        max_records: 200
      };

      console.log("🔍 Fetching active discounts...");

      const response = await ZC.DATA.getRecords(config);

      return response.code === 3000 ? response.data || [] : [];

    } catch (error) {

      console.error("❌ Fetch Discounts Error:", error.message || error);
      throw error;

    }

  },

  /**
   * Create Sales Order
   * FIXED: Better error handling
   */
  createSalesOrder: async (orderData) => {

    try {

      if (!orderData) {
        throw new Error("Order data is required");
      }

      await zohoService.init();

      const ZC = getZC();

      if (!ZC) {
        throw new Error("Zoho SDK not initialized");
      }

      if (!ZC.DATA || typeof ZC.DATA.addRecords !== "function") {
        throw new Error("Zoho DATA SDK not available");
      }

      const config = {
        app_name: APP_NAME,
        form_name: SALES_FORM,
        payload: orderData
      };

      console.log("📝 Creating sales order...");

      const response = await ZC.DATA.addRecords(config);

      if (response.code === 3000) {
        console.log("✅ Sales order created successfully");
        return response;
      }

      throw new Error(`Sales order creation failed: ${response.message || "Unknown error"}`);

    } catch (error) {

      console.error("❌ Create Sales Order Error:", error.message || error);
      throw error;

    }

  },

  /**
   * Update Record
   * FIXED: Better validation and error handling
   */
  updateRecord: async (reportName, id, data) => {

    try {

      if (!reportName || !id || !data) {
        throw new Error("reportName, id, and data are required");
      }

      await zohoService.init();

      const ZC = getZC();

      if (!ZC) {
        throw new Error("Zoho SDK not initialized");
      }

      if (!ZC.DATA || typeof ZC.DATA.updateRecord !== "function") {
        throw new Error("Zoho DATA SDK not available");
      }

      const config = {
        app_name: APP_NAME,
        report_name: reportName,
        id,
        payload: data
      };

      console.log("✏️ Updating record...");

      const response = await ZC.DATA.updateRecord(config);

      if (response.code === 3000) {
        console.log("✅ Record updated successfully");
      }

      return response;

    } catch (error) {

      console.error("❌ Update Record Error:", error.message || error);
      throw error;

    }

  },

  /**
   * Check if SDK is ready (useful for debugging)
   */
  isReady: () => {
    return sdkReady;
  },

  /**
   * Get SDK status (for debugging)
   */
  getStatus: () => {
    const ZC = getZC();
    return {
      sdkReady,
      zohoCreatorAvailable: !!ZC,
      dataMethodsAvailable: !!ZC?.DATA,
      utilMethodsAvailable: !!ZC?.UTIL
    };
  }

};

export default zohoService;
