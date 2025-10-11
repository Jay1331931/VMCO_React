const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
export const getOptionsFromBasicsMaster = async (fieldName, token) => {
  const params = new URLSearchParams({
    filters: JSON.stringify({ master_name: fieldName }), // Properly stringify the filter
  });

  try {
    const response = await fetch(
      `${API_BASE_URL}/basics-masters?${params.toString()}`,
      {
        method: "GET",
        headers: { 
          "Content-Type": "application/json",
          ...(token && { "Authorization": `Bearer ${token}` })
        },
        
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json(); // Don't forget 'await' here

    console.log("Response from basics-masters:", result); 

    const options = result.data.map((item) => {
  return { value: item.value, valueLc: item.valueLc, description: item.description, descriptionLc: item.descriptionLc };
});
    // const options = result.data.map((item) => item.value );
    return options;
  } catch (err) {
    console.error("Error fetching options:", err);
    return []; // Return empty array on error
  }
};
export const fetchCurrentDataOfCustomer = async (customerId, token) => {
  console.log("Fetching current data for customer ID:~~~~~~", customerId);
  let customerData = {};
  let contactsData = {};
  let paymentMethodsData = {};
  try {
    const response = await fetch(
      `${API_BASE_URL}/customers/id/${customerId}`,
      {
        method: "GET",
        headers: { 
          "Content-Type": "application/json",
          ...(token && { "Authorization": `Bearer ${token}` })
        },
        
      }
    );
    const customerDataJson = await response.json();
    console.log("Customer Data JSON~~~~~~~~~~~~~", customerDataJson);
    return customerDataJson.data;
    // if (customerDataJson.status === 'Ok') {
    //   customerData = customerDataJson.data;
    //   console.log('Current customer data:', customerDataJson.data);
    // }
    // const responseContacts = await fetch(`${API_BASE_URL}/customer-contacts/${customerId}`, {
    //   method: 'GET',
    //   headers: { 'Content-Type': 'application/json' },
    //   
    // });
    // const contactsDataJson = await responseContacts.json();
    // if (contactsDataJson.status === 'Ok') {
    //   contactsData = contactsDataJson.data;
    //   console.log('Current customer contacts data:', contactsDataJson.data);
    //   return { customer: customerData.data, contacts: contactsData.data };
    // } else {
    //   throw new Error(contactsData.data?.message || 'Failed to fetch customer contacts');
    // }
    // const responsePaymentMethods = await fetch(`${API_BASE_URL}/payment-method/id/${customerId}`, {
    //   method: 'GET',
    //   headers: { 'Content-Type': 'application/json' },
    //   
    // });
    // const paymentMethodsDataJson = await responsePaymentMethods.json();
    // if (paymentMethodsDataJson.status === 'Ok') {
    //   paymentMethodsData = paymentMethodsDataJson.data;
    //   console.log('Current customer payment methods data:', paymentMethodsDataJson.data);
    //   return { customer: customerData.data, contacts: contactsData.data, paymentMethods: paymentMethodsData.data };
    // } else {
    //   throw new Error(paymentMethodsData.data?.message || 'Failed to fetch customer payment methods');
    // }
    // setFormData(prev => ({
    //   ...prev,
    //   ...customerData,
    //   ...contactsData,
    //   paymentMethods: paymentMethodsData
    // }));
    // console.log('Form data after fetching current data:', formData);
  } catch (error) {
    console.error("Error fetching current customer data:", error);
    throw error;
  }
};
export const fetchDropdownFromBasicsMaster = async (dropdownFields,token) => {
  const options = {};
  console.log("Dropdown Fields", dropdownFields);
  for (const field of dropdownFields) {
    try {
      let data = await getOptionsFromBasicsMaster(field,token);
      console.log("Data for field", field, data);
      options[field] = data.map((opt) =>
        typeof opt === "string" ? opt.charAt(0) + opt.slice(1) : opt
      );
    } catch (err) {
      console.error(`Failed to fetch options for ${field}:`, err);
      options[field] = [];
    }
  }
  return options;
};

export const getOptionsFromEmployees = async (token) => {
  const params = new URLSearchParams({
    filters: { designation: "sales executive" }, // Properly stringify the filter
  });
  const supportStaffDesignation = ["sales executive","area sales manager"];
   try {
    const allResults = [];

    for (const designation of supportStaffDesignation) {
      const filters = encodeURIComponent(JSON.stringify({ designation }));

      const response = await fetch(
        `${API_BASE_URL}/employees/pagination?filters=${filters}`,
        {
          method: "GET",
          headers: { 
            "Content-Type": "application/json",
            ...(token && { "Authorization": `Bearer ${token}` })
          },
        }
      );

      if (!response.ok) {
        console.error(`Failed to fetch ${designation}: ${response.status}`);
        continue;
      }

      const result = await response.json();
      const options = result.data.data.map((item) => ({
        name: item.name,
        employeeId: item.employeeId,
      }));

      allResults.push(...options); // Add to the combined array
    }

    return allResults;
  } catch (err) {
    console.error("Error fetching employee options:", err);
    return [];
  }
};

export const getOptionsFromEmployeesWithManager = async (region, token) => {
  try {
    console.log("getOptionsFromEmployeesWithManager #############");

    const response = await fetch(
      `${API_BASE_URL}/employees/manager-and-employees`,
      {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token && { "Authorization": `Bearer ${token}` })
        },
        
        body: JSON.stringify({ region: region }),
      }
    );
    if (!response.ok) {
      console.error(
        `~~~~~~~~~~~~~~Failed to fetch options for :`,
        response.statusText
      );
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    const options = result.data.map((item) => {
      return { name: item.name, employeeId: item.employeeId };
    });
    console.log("________________$$$$$$$ ", options);
    return options;
  } catch (err) {
    console.error("Error fetching employee options:", err);
    return [];
  }
};


