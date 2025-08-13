const Constants = {
    ROLES:{
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
    ENTITY:{
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
        DAR: 'DAR Company'
    },
    FAVORITES: 'Favorites',
    CATEGORY:{
        VMCO_MACHINES: 'VMCO Machines',
        VMCO_CONSUMABLES: 'VMCO Consumables'
    },
    MAINTENANCE_REGIONAL_CITY:{
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
    }
};

export default Constants;