// filepath: c:\Users\Admin\Documents\VMCO_React\VMCO_React\src\context\CustomerContext.js
import { createContext, useContext } from "react";

// Create the context with a default value
const CustomerContext = createContext({
  refreshCustomerData: () =>
    console.warn("refreshCustomerData not implemented"),
});

export const CustomerProvider = CustomerContext.Provider;
export const useCustomer = () => useContext(CustomerContext);
