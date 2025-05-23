// RBAC JSON definition
const RBAC = {
  admin: {
    orderList: {
      fields: {
        orderNumber: { visible: true, editable: true },
        customer: { visible: true, editable: true },
        date: { visible: true, editable: true },
        status: { visible: true, editable: true },
        total: { visible: true, editable: true }
      }
    },
    orderDetailAdd: {
      fields: {
        orderNumber: { visible: true, editable: true },
        customer: { visible: true, editable: true },
        products: { visible: true, editable: true },
        discount: { visible: true, editable: true },
        deliveryDate: { visible: true, editable: true }
      }
    },
    orderDetailEdit: {
      fields: {
        orderNumber: { visible: true, editable: true },
        customer: { visible: true, editable: true },
        products: { visible: true, editable: true },
        discount: { visible: true, editable: true },
        deliveryDate: { visible: true, editable: true }
      }
    },
    customersList: {
      fields: {
        name: { visible: true, editable: true },
        contact: { visible: true, editable: true },
        email: { visible: true, editable: true },
        status: { visible: true, editable: true },
        location: { visible: true, editable: true }
      }
    },
    invitesList: {
      fields: {
        name: { visible: true, editable: true },
        email: { visible: true, editable: true },
        date: { visible: true, editable: true },
        status: { visible: true, editable: true },
        actions: { visible: true, editable: true }
      }
    },
    custBusDetailAdd: {
      fields: {
        companyName: { visible: true, editable: true },
        businessType: { visible: true, editable: true },
        address: { visible: true, editable: true },
        contact: { visible: true, editable: true },
        registrationNumber: { visible: true, editable: true }
      }
    },
    custBusDetailEdit: {
      fields: {
        companyName: { visible: true, editable: true },
        businessType: { visible: true, editable: true },
        address: { visible: true, editable: true },
        contact: { visible: true, editable: true },
        registrationNumber: { visible: true, editable: true }
      }
    },
    custFinInfoAdd: {
      fields: {
        bankName: { visible: true, editable: true },
        accountNumber: { visible: true, editable: true },
        creditLimit: { visible: true, editable: true },
        paymentTerms: { visible: true, editable: true },
        taxInfo: { visible: true, editable: true }
      }
    },
    custFinInfoEdit: {
      fields: {
        bankName: { visible: true, editable: true },
        accountNumber: { visible: true, editable: true },
        creditLimit: { visible: true, editable: true },
        paymentTerms: { visible: true, editable: true },
        taxInfo: { visible: true, editable: true }
      }
    },
    custDocsAdd: {
      fields: {
        documentType: { visible: true, editable: true },
        documentName: { visible: true, editable: true },
        uploadDate: { visible: true, editable: true },
        expiryDate: { visible: true, editable: true },
        status: { visible: true, editable: true }
      }
    },
    custDocsEdit: {
      fields: {
        documentType: { visible: true, editable: true },
        documentName: { visible: true, editable: true },
        uploadDate: { visible: true, editable: true },
        expiryDate: { visible: true, editable: true },
        status: { visible: true, editable: true }
      }
    },
    branchesAdd: {
      fields: {
        branchName: { visible: true, editable: true },
        location: { visible: true, editable: true },
        manager: { visible: true, editable: true },
        contact: { visible: true, editable: true },
        status: { visible: true, editable: true }
      }
    },
    branchesEdit: {
      fields: {
        branchName: { visible: true, editable: true },
        location: { visible: true, editable: true },
        manager: { visible: true, editable: true },
        contact: { visible: true, editable: true },
        status: { visible: true, editable: true }
      }
    },
    prodMoQAdd: {
      fields: {
        productName: { visible: true, editable: true },
        minQuantity: { visible: true, editable: true },
        priceBreaks: { visible: true, editable: true },
        effectiveDate: { visible: true, editable: true },
        notes: { visible: true, editable: true }
      }
    },
    prodMoQEdit: {
      fields: {
        productName: { visible: true, editable: true },
        minQuantity: { visible: true, editable: true },
        priceBreaks: { visible: true, editable: true },
        effectiveDate: { visible: true, editable: true },
        notes: { visible: true, editable: true }
      }
    },
    supList: {
      fields: {
        name: { visible: true, editable: true },
        contact: { visible: true, editable: true },
        products: { visible: true, editable: true },
        status: { visible: true, editable: true },
        rating: { visible: true, editable: true }
      }
    },
    supDetailAdd: {
      fields: {
        name: { visible: true, editable: true },
        contact: { visible: true, editable: true },
        address: { visible: true, editable: true },
        paymentTerms: { visible: true, editable: true },
        productCategories: { visible: true, editable: true }
      }
    },
    supDetailEdit: {
      fields: {
        name: { visible: true, editable: true },
        contact: { visible: true, editable: true },
        address: { visible: true, editable: true },
        paymentTerms: { visible: true, editable: true },
        productCategories: { visible: true, editable: true }
      }
    },
    maintList: {
      fields: {
        equipmentId: { visible: true, editable: true },
        lastService: { visible: true, editable: true },
        nextService: { visible: true, editable: true },
        status: { visible: true, editable: true },
        assignedTo: { visible: true, editable: true }
      }
    },
    maintDetailAdd: {
      fields: {
        equipmentId: { visible: true, editable: true },
        serviceType: { visible: true, editable: true },
        scheduleDate: { visible: true, editable: true },
        assignTo: { visible: true, editable: true },
        notes: { visible: true, editable: true }
      }
    },
    maintDetailEdit: {
      fields: {
        equipmentId: { visible: true, editable: true },
        serviceType: { visible: true, editable: true },
        scheduleDate: { visible: true, editable: true },
        assignTo: { visible: true, editable: true },
        notes: { visible: true, editable: true }
      }
    },
    catelog: {
      fields: {
        categories: { visible: true, editable: true },
        products: { visible: true, editable: true },
        filters: { visible: true, editable: true },
        sort: { visible: true, editable: true },
        search: { visible: true, editable: true }
      }
    },
    prodDetail: {
      fields: {
        name: { visible: true, editable: true },
        description: { visible: true, editable: true },
        price: { visible: true, editable: true },
        stock: { visible: true, editable: true },
        specifications: { visible: true, editable: true }
      }
    },
    orderListing: {
      fields: {
        orderNumber: { visible: true, editable: true },
        status: { visible: true, editable: true },
        customer: { visible: true, editable: true },
        date: { visible: true, editable: true },
        amount: { visible: true, editable: true }
      }
    },
    checkoutPage: {
      fields: {
        customer: { visible: true, editable: true },
        shippingAddress: { visible: true, editable: true },
        paymentMethod: { visible: true, editable: true },
        items: { visible: true, editable: true },
        discounts: { visible: true, editable: true }
      }
    },
    sidemenu: {
      fields: {
        orders: { visible: true, editable: true },
        customers: { visible: true, editable: true },
        products: { visible: true, editable: true },
        suppliers: { visible: true, editable: true },
        maintenance: { visible: true, editable: true },
        reports: { visible: true, editable: true },
        settings: { visible: true, editable: true }
      }
    }
  },
 
  employee: {
    // Define employee permissions for all forms
  },
  branch_primary: {
    // Define branch_primary permissions for all forms
  },
  customer_primary: {
    // Define customer_primary permissions for all forms
  },
  opsCordinator: {
    // Define opsCordinator permissions for all forms
  },
  opsManager: {
    // Define opsManager permissions for all forms
  },
  salesExecutive: {
    // Define salesExecutive permissions for all forms
  },
  areaSalesManager: {
    // Define areaSalesManager permissions for all forms
  },
  fieldEngineer: {
    // Define fieldEngineer permissions for all forms
  },
  maintenanceTechnician: {
    // Define maintenanceTechnician permissions for all forms
  },
  driver: {
    // Define driver permissions for all forms
  }
};

/**
 * Returns the access definition object for a given role, form, and field.
 * @param {string} role - The user role (e.g., 'admin', 'viewer')
 * @param {string} form - The form name (e.g., 'orderList')
 * @param {string} field - The field name (e.g., 'orderNumber', 'customer')
 * @returns {object|undefined} The access definition object or undefined if not found
 */
export function getFieldAccess(role, form, field) {
  return RBAC?.[role]?.[form]?.fields?.[field];
}

/**
 * Checks if a field is visible for a given role and form
 * @param {string} role - The user role
 * @param {string} form - The form name
 * @param {string} field - The field name
 * @returns {boolean} True if the field is visible, false otherwise
 */
export function isV(role, form, field) {
  const access = getFieldAccess(role, form, field);
  return access ? access.visible : false;
}

/**
 * Checks if a field is editable for a given role and form
 * @param {string} role - The user role
 * @param {string} form - The form name
 * @param {string} field - The field name
 * @returns {boolean} True if the field is editable, false otherwise
 */
export function isE(role, form, field) {
  const access = getFieldAccess(role, form, field);
  return access ? access.editable : false;
}

export default RBAC;