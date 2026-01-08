const BLOB_STORAGE_URL = process.env.REACT_APP_BLOB_STORAGE_URL;
const BLOB_CONTAINER_NAME = process.env.REACT_APP_BLOB_CONTAINER_NAME;
const Constants = {
    ROLES: {
        SUPER_ADMIN: 'admin',
        EMPLOYEE: 'employee',
        BRANCH_PRIMARY: 'branch_primary',
        CUSTOMER_PRIMARY: 'customer_primary',
    },
    DESIGNATIONS: {
        OPS_COORDINATOR: 'operations coordinator',
        OPS_MANAGER: 'operations manager',
        SALES_EXECUTIVE: "sales executive",
        AREA_SALES_MANAGER: 'area sales manager',
        PRODUCTION_MANAGER: 'production manager',
        FIELD_ENGINEER: 'field engineer',
        MAINTENANCE_TECHNICIAN: 'maintenance technician',
        MAINTENANCE_HEAD: 'maintenance head',
        MAINTENANCE_MANAGER: 'maintenance manager',
        DRIVER: 'driver',
        BRANCH_ACCOUNTANT: 'branch accountant',
    },
    ENTITY: {
        VMCO: 'VMCO',
        SHC: 'SHC',
        NAQI: 'NAQI',
        DAR: 'DAR',
        GMTC: 'GMTC'
    },
    TAB_NAMES: {
        VMCO_MACHINES: 'Machines & Accessories',
        VMCO_CONSUMABLES: 'Food Ingredients',
        SHC: 'Sandwiches, Bakery & Pastry',
        GMTC: 'Fresh Vegetables & Fruits',
        NAQI: 'Hygiene Chemicals',
        DAR: 'DAR Company',
        VMCO: 'Vending Machine Company',
        FAVORITES: 'Favorites',
    },
    TAB_IMAGES: {
        VMCO_MACHINES: `${BLOB_STORAGE_URL}/${BLOB_CONTAINER_NAME}/VmcoMachinesTabImage.jpg`,
        VMCO_CONSUMABLES: `${BLOB_STORAGE_URL}/${BLOB_CONTAINER_NAME}/VmcoConsumablesTabImage.jpg`,
        SHC: `${BLOB_STORAGE_URL}/${BLOB_CONTAINER_NAME}/ShcTabImage.webp`,
        GMTC: `${BLOB_STORAGE_URL}/${BLOB_CONTAINER_NAME}/GmtcTabImage.jpg`,
        NAQI: `${BLOB_STORAGE_URL}/${BLOB_CONTAINER_NAME}/NaqiTabImage.jpg`,
        DAR: `${BLOB_STORAGE_URL}/${BLOB_CONTAINER_NAME}/DarTabImage.jpeg`,
        SPECIAL_PRODUCTS: `${BLOB_STORAGE_URL}/${BLOB_CONTAINER_NAME}/SpecialproductsTabImage.png`,
        FAVORITES: `${BLOB_STORAGE_URL}/${BLOB_CONTAINER_NAME}/FavoritesTabImage.png`
    },

    CATEGORY: {
        VMCO_MACHINES: 'VMCO Machines',
        VMCO_CONSUMABLES: 'VMCO Consumables',
        SHC_FRESH: 'SHC - Fresh',
        SHC_FROZEN: 'SHC - Frozen'
    },
    MAINTENANCE_REGIONAL_CITY: {
        RIYADH: 'Riyadh',
        JEDDAH: 'Jeddah',
        DAMMAM: 'Dammam',
        KHOBAR: 'Khobar',
        AL_HASA: 'Al Hasa',
        AL_JUBAIL: 'Al Jubail',
        AL_QASSIM: 'Al Qassim',
        AL_JOUF: 'Al Jouf',
        TABUK: 'Tabuk',
        HAIL: 'Hail',
        ASIR: 'Asir'
    },
    EXCLUDED_REGIONAL_CITY: {
        RIYADH: 'Riyadh',
        JEDDAH: 'Jeddah'
    },
    DOCUMENTS_NAME: {
        BRANCH_APPROVAL_CHECKLIST: 'Branch_data_verification_checklist.pdf',
        BRANCH_UPLOAD_FORMAT: 'branches_upload_format.xlsx',
        CUSTOMER_APPROVAL_CHECKLIST: "Customer_data_verification_checklist.pdf",
        TERMS_AND_CONDITIONS_AR: "Terms_and_condition_ar.pdf",
        TERMS_AND_CONDITIONS_EN: "Terms_and_condition_en.pdf",
        ORDERS_UPLOAD_FORMAT: "orders_upload_format.xlsx",
        PRODUCTS_UPLOAD_FORMAT: "product_mapping_upload_format.xlsx",
        CUSTOMERS_BULK_UPLOAD_FORMAT: "customers_bulk_upload_format.xlsx",
        BRANCH_BULK_UPLOAD_FORMAT: "branches_bulk_upload_format.xlsx"
    },
    WORKFLOW_NAME: {
        ONBOARDING: 'onboarding',
        NEW_BRANCH: 'new branch',
        CUSTOMER_DETAILS: 'customer details',
        BRANCH_DETAILS: 'branch details',
        CUSTOMER_POST_APPROVAL: 'customer post approval',
        BRANCH_POST_APPROVAL: 'branch post approval',
        PAYMENT_METHODS: 'payment methods',
        PRICING_POLICY: 'pricing policy',
        CUSTOMER_BLOCK_UNBLOCK: 'customer block/unblock',
        VMCO_MACHINES: 'vmco machines',
        VMCO_MACHINES_DISCOUNT: 'vmco machines discount',
        VMCO_CONSUMABLES: 'vmco consumables',
        OTHER_ENTITIES: 'other entities'
    }

};

export default Constants;