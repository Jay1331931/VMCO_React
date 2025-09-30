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


    const options = result.data.map((item) => {
  return { value: item.value, valueLc: item.valueLc, description: item.description, descriptionLc: item.descriptionLc };
});
    // const options = result.data.map((item) => item.value );
    return options;
  } catch (err) {
    return []; // Return empty array on error
  }
};
export const fetchCurrentDataOfCustomer = async (customerId, token) => {
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
    return customerDataJson.data;
    // if (customerDataJson.status === 'Ok') {
    //   customerData = customerDataJson.data;
    // const responseContacts = await fetch(`${API_BASE_URL}/customer-contacts/${customerId}`, {
    //   method: 'GET',
    //   headers: { 'Content-Type': 'application/json' },
    //   
    // });
    // const contactsDataJson = await responseContacts.json();
    // if (contactsDataJson.status === 'Ok') {
    //   contactsData = contactsDataJson.data;
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
  } catch (error) {
    throw error;
  }
};
export const fetchDropdownFromBasicsMaster = async (dropdownFields,token) => {
  const options = {};
  for (const field of dropdownFields) {
    try {
      let data = await getOptionsFromBasicsMaster(field,token);
      options[field] = data.map((opt) =>
        typeof opt === "string" ? opt.charAt(0) + opt.slice(1) : opt
      );
    } catch (err) {
      options[field] = [];
    }
  }
  return options;
};

export const getOptionsFromEmployees = async (token) => {
  const params = new URLSearchParams({
    filters: { designation: "sales executive" }, // Properly stringify the filter
  });
  const supportStaffDesignation = "sales executive";
  try {
    const response = await fetch(
      `${API_BASE_URL}/employees/pagination?filters={"designation": "${supportStaffDesignation}"}`,
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
    const result = await response.json();
    const options = result.data.data.map((item) => {
      return { name: item.name, employeeId: item.employeeId };
    });
    return options;
  } catch (err) {
    return [];
  }
};

export const getOptionsFromEmployeesWithManager = async (region, token) => {
  try {

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
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    const options = result.data.map((item) => {
      return { name: item.name, employeeId: item.employeeId };
    });
    return options;
  } catch (err) {
    return [];
  }
};


