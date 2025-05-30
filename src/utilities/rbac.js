import { str } from "ajv";

// RBAC Manager class
class RbacManager {
  constructor(role, form,inWF,isOwner) {
    this.currentRole = role;
    this.currentForm = form;
    this.itemInWF = null;
    this.isUserOwner = null;
  }
  
  // Static roles definition
  static roleformfieldmap = {
    admin: {
      orderList: {
        fields: {
          orderNumber: { visible: true, editable: true },
          customer: { visible: false, editable: true },
          date: { visible: true, editable: false },
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
          btnAdd: { visible: false, editable: false },
        }
      },
      supDetailAdd: {
        fields: {
          customerName: { visible: true, editable: false },
          branch: { visible: true, editable:false },
          issueType: { visible: true, editable: true },
          issueName: { visible: true, editable: true },
          issueDetails: { visible: true, editable: false },
          images: { visible: true, editable: true },
          issueStatus: { visible: true, editable: true },
          assignedTo: { visible: true, editable: true },
          btnSave: { visible: true, editable: true }
        }
      },
      supDetailEdit: {
        fields: {
          customerName: { visible: true, editable: false },
          branch: { visible: true, editable:false },
          issueType: { visible: true, editable: true },
          issueName: { visible: true, editable: false },
          issueDetails: { visible: true, editable: false },
          images: { visible: true, editable: true },
          issueStatus: { visible: true, editable: true },
          assignedTo: { visible: true, editable: true },
          btnSave: { visible: true, editable: true }
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
      },
      custDetailsAdd: {
        fields: {
          companyNameEn: { visible: true, editable: true },
          companyNameLc: { visible: true, editable: true },
          crNumber: { visible: true, editable: true },
          vatRegistrationNumber: { visible: true, editable: true },
          baladeahLicense: { visible: true, editable: true },
          companyType: { visible: true, editable: true },
          businessType: { visible: true, editable: true },
          businessTypeOther: { visible: true, editable: true },
          interCompany: { visible: true, editable: true },
          entity: { visible: true, editable: true },
          deliveryLocations: { visible: true, editable: true },
          brandName: { visible: true, editable: true },
          brandNameArabic: { visible: true, editable: true },
          company_logo: { visible: true, editable: true },
          brand_logo: { visible: true, editable: true },
          primaryContactName: { visible: true, editable: true },
          primaryContactDesignation: { visible: true, editable: true },
          primaryContactEmail: { visible: true, editable: true },
          primaryContactPhone: { visible: true, editable: true },
          businessHeadSameAsPrimary: { visible: true, editable: true },
          businessHeadName: { visible: true, editable: true },
          businessHeadDesignation: { visible: true, editable: true },
          businessHeadEmail: { visible: true, editable: true },
          businessHeadPhone: { visible: true, editable: true },
          financeHeadName: { visible: true, editable: true },
          financeHeadDesignation: { visible: true, editable: true },
          financeHeadEmail: { visible: true, editable: true },
          financeHeadPhone: { visible: true, editable: true },
          purchasingHeadName: { visible: true, editable: true },
          purchasingHeadDesignation: { visible: true, editable: true },
          purchasingHeadEmail: { visible: true, editable: true },
          purchasingHeadPhone: { visible: true, editable: true },
          buildingName: { visible: true, editable: true },
          street: { visible: true, editable: true },
          district: { visible: true, editable: true },
          city: { visible: true, editable: true },
          region: { visible: true, editable: true },
          zone: { visible: true, editable: true },
          geolocation: { visible: true, editable: true },
          pincode: { visible: true, editable: true },
          dulySigned: { visible: true, editable: true },
          crCertificate: { visible: true, editable: true },
          vatCertificate: { visible: true, editable: true },
          nationalID: { visible: true, editable: true },
          bankLetter: { visible: true, editable: true },
          nonTradingDocuments: { visible: true, editable: true },
          bankName: { visible: true, editable: true },
          accountNumber: { visible: true, editable: true },
          ibanNumber: { visible: true, editable: true },
          prePayment: { visible: true, editable: true },
          partialPayment: { visible: true, editable: true },
          advancePayment: { visible: true, editable: true },
          COD: { visible: true, editable: true },
          credit: { visible: true, editable: true },
          creditLimit: { visible: true, editable: true },
          creditPeriod: { visible: true, editable: true },
          btnSave: { visible: true, editable: true }
        }
      },
      custDetailsEdit: {
        fields: {
          companyNameEn: { visible: true, editable: false },
          companyNameLc: { visible: true, editable: true },
          crNumber: { visible: true, editable: true },
          vatRegistrationNumber: { visible: true, editable: true },
          baladeahLicense: { visible: true, editable: true },
          companyType: { visible: true, editable: true },
          businessType: { visible: true, editable: true },
          businessTypeOther: { visible: true, editable: true },
          interCompany: { visible: true, editable: true },
          entity: { visible: true, editable: true },
          deliveryLocations: { visible: true, editable: true },
          brandName: { visible: true, editable: true },
          brandNameArabic: { visible: true, editable: true },
          company_logo: { visible: true, editable: true },
          brand_logo: { visible: true, editable: true },
          primaryContactName: { visible: true, editable: true },
          primaryContactDesignation: { visible: true, editable: true },
          primaryContactEmail: { visible: true, editable: true },
          primaryContactPhone: { visible: true, editable: true },
          businessHeadSameAsPrimary: { visible: true, editable: true },
          businessHeadName: { visible: true, editable: true },
          businessHeadDesignation: { visible: true, editable: true },
          businessHeadEmail: { visible: true, editable: true },
          businessHeadPhone: { visible: true, editable: true },
          financeHeadName: { visible: true, editable: true },
          financeHeadDesignation: { visible: true, editable: true },
          financeHeadEmail: { visible: true, editable: true },
          financeHeadPhone: { visible: true, editable: true },
          purchasingHeadName: { visible: true, editable: true },
          purchasingHeadDesignation: { visible: true, editable: true },
          purchasingHeadEmail: { visible: true, editable: true },
          purchasingHeadPhone: { visible: true, editable: true },
          buildingName: { visible: true, editable: true },
          street: { visible: true, editable: true },
          district: { visible: true, editable: true },
          city: { visible: true, editable: true },
          region: { visible: true, editable: true },
          zone: { visible: true, editable: true },
          geolocation: { visible: true, editable: true },
          pincode: { visible: true, editable: true },
          dulySigned: { visible: true, editable: true },
          crCertificate: { visible: true, editable: true },
          vatCertificate: { visible: true, editable: true },
          nationalID: { visible: true, editable: true },
          bankLetter: { visible: true, editable: true },
          nonTradingDocuments: { visible: true, editable: true },
          bankName: { visible: true, editable: true },
          accountNumber: { visible: true, editable: true },
          ibanNumber: { visible: true, editable: true },
          prePayment: { visible: true, editable: true },
          partialPayment: { visible: true, editable: true },
          advancePayment: { visible: true, editable: true },
          COD: { visible: true, editable: true },
          credit: { visible: true, editable: true },
          creditLimit: { visible: true, editable: true },
          creditPeriod: { visible: true, editable: true },
        }
      },
    },
   
    branch_primary: {
      // Define branch_primary permissions for all forms
    },
    customer_primary: {

      supList: {
        fields: {
          btnAdd: { visible: true, editable: false },
        }
      },
      supDetailAdd: {
        fields: {
          customerName: { visible: true, editable: false },
          branch: { visible: true, editable:true },
          issueType: { visible: true, editable: true },
          issueName: { visible: true, editable: true },
          issueDetails: { visible: true, editable: true },
          images: { visible: true, editable: true },
          issueStatus: { visible: true, editable: true },
          assignedTo: { visible: false, editable: true },
          btnSave: { visible: true, editable: true }
        }
      },
      supDetailEdit: {
        fields: {
          customerName: { visible: true, editable: false },
          branch: { visible: true, editable:true },
          issueType: { visible: true, editable: true },
          issueName: { visible: true, editable: false },
          issueDetails: { visible: true, editable: false },
          images: { visible: true, editable: true },
          issueStatus: { visible: true, editable: false },
          assignedTo: { visible: false, editable: true },
          btnSave: { visible: true, editable: true }
        }
      },
      // Define customer_primary permissions for all forms
      custDetailsAdd: {
        fields: {
          companyNameEn: { visible: true, editable: false },
          companyNameLc: { visible: true, editable: true },
          crNumber: { visible: true, editable: true },
          vatRegistrationNumber: { visible: true, editable: true },
          baladeahLicense: { visible: true, editable: true },
          companyType: { visible: true, editable: true },
          businessType: { visible: true, editable: true },
          businessTypeOther: { visible: true, editable: true },
          assignedTo: { visible: false, editable: true },
          assignedToEntityWise: { visible: false, editable: true },
          interCompany: { visible: false, editable: false },
          entity: { visible: false, editable: true },
          deliveryLocations: { visible: true, editable: true },
          brandName: { visible: true, editable: true },
          brandNameArabic: { visible: true, editable: true },
          company_logo: { visible: true, editable: true },
          brand_logo: { visible: true, editable: true },
          primaryContactName: { visible: true, editable: true },
          primaryContactDesignation: { visible: true, editable: true },
          primaryContactEmail: { visible: true, editable: true },
          primaryContactPhone: { visible: true, editable: true },
          businessHeadSameAsPrimary: { visible: true, editable: true },
          businessHeadName: { visible: true, editable: true },
          businessHeadDesignation: { visible: true, editable: true },
          businessHeadEmail: { visible: true, editable: true },
          businessHeadPhone: { visible: true, editable: true },
          financeHeadName: { visible: true, editable: true },
          financeHeadDesignation: { visible: true, editable: true },
          financeHeadEmail: { visible: true, editable: true },
          financeHeadPhone: { visible: true, editable: true },
          purchasingHeadName: { visible: true, editable: true },
          purchasingHeadDesignation: { visible: true, editable: true },
          purchasingHeadEmail: { visible: true, editable: true },
          purchasingHeadPhone: { visible: true, editable: true },
          buildingName: { visible: true, editable: true },
          street: { visible: true, editable: true },
          district: { visible: true, editable: true },
          city: { visible: true, editable: true },
          region: { visible: true, editable: true },
          zone: { visible: true, editable: true },
          geolocation: { visible: true, editable: true },
          pincode: { visible: true, editable: true },
          dulySigned: { visible: true, editable: true },
          crCertificate: { visible: true, editable: true },
          vatCertificate: { visible: true, editable: true },
          nationalID: { visible: true, editable: true },
          bankLetter: { visible: true, editable: true },
          nonTradingDocuments: { visible: true, editable: true },
          bankName: { visible: true, editable: true },
          accountNumber: { visible: true, editable: true },
          ibanNumber: { visible: true, editable: true },
          prePayment: { visible: true, editable: true },
          partialPayment: { visible: true, editable: true },
          advancePayment: { visible: true, editable: true },
          COD: { visible: true, editable: true },
          credit: { visible: true, editable: true },
          creditLimit: { visible: true, editable: true },
          creditPeriod: { visible: true, editable: true },
          btnSave: { visible: true, editable: true }
        }
      },
      custDetailsEdit: {
        fields: {
          companyNameEn: { visible: true, editable: false },
          companyNameLc: { visible: true, editable: true },
          crNumber: { visible: true, editable: true },
          vatRegistrationNumber: { visible: true, editable: true },
          baladeahLicense: { visible: true, editable: true },
          companyType: { visible: true, editable: true },
          businessType: { visible: true, editable: true },
          businessTypeOther: { visible: true, editable: true },
          interCompany: { visible: false, editable: true },
          entity: { visible: false, editable: true },
          deliveryLocations: { visible: true, editable: true },
          brandName: { visible: true, editable: true },
          brandNameArabic: { visible: true, editable: true },
          company_logo: { visible: true, editable: true },
          brand_logo: { visible: true, editable: true },
          primaryContactName: { visible: true, editable: true },
          primaryContactDesignation: { visible: true, editable: true },
          primaryContactEmail: { visible: true, editable: true },
          primaryContactPhone: { visible: true, editable: true },
          businessHeadSameAsPrimary: { visible: true, editable: true },
          businessHeadName: { visible: true, editable: true },
          businessHeadDesignation: { visible: true, editable: true },
          businessHeadEmail: { visible: true, editable: true },
          businessHeadPhone: { visible: true, editable: true },
          financeHeadName: { visible: true, editable: true },
          financeHeadDesignation: { visible: true, editable: true },
          financeHeadEmail: { visible: true, editable: true },
          financeHeadPhone: { visible: true, editable: true },
          purchasingHeadName: { visible: true, editable: true },
          purchasingHeadDesignation: { visible: true, editable: true },
          purchasingHeadEmail: { visible: true, editable: true },
          purchasingHeadPhone: { visible: true, editable: true },
          buildingName: { visible: true, editable: true },
          street: { visible: true, editable: true },
          district: { visible: true, editable: true },
          city: { visible: true, editable: true },
          region: { visible: true, editable: true },
          zone: { visible: true, editable: true },
          geolocation: { visible: true, editable: true },
          pincode: { visible: true, editable: true },
          dulySigned: { visible: true, editable: true },
          crCertificate: { visible: true, editable: true },
          vatCertificate: { visible: true, editable: true },
          nationalID: { visible: true, editable: true },
          bankLetter: { visible: true, editable: true },
          nonTradingDocuments: { visible: true, editable: true },
          bankName: { visible: true, editable: true },
          accountNumber: { visible: true, editable: true },
          ibanNumber: { visible: true, editable: true },
          prePayment: { visible: true, editable: true },
          partialPayment: { visible: true, editable: true },
          advancePayment: { visible: true, editable: true },
          COD: { visible: true, editable: true },
          credit: { visible: true, editable: true },
          creditLimit: { visible: true, editable: true },
          creditPeriod: { visible: true, editable: true },
          assignedTo: { visible: false, editable: true },
          assignedToEntityWise: { visible: false, editable: true },
          customerSource: { visible: false, editable: true },
        }
      },
      
    },
    opsCordinator: {
      // Define opsCordinator permissions for all forms
      custDetailsAdd: {
        fields: {
          companyNameEn: { visible: true, editable: false },
          companyNameLc: { visible: true, editable: true },
          crNumber: { visible: true, editable: true },
          vatRegistrationNumber: { visible: true, editable: true },
          baladeahLicense: { visible: true, editable: true },
          companyType: { visible: true, editable: true },
          businessType: { visible: true, editable: true },
          businessTypeOther: { visible: true, editable: true },
          interCompany: { visible: true, editable: true },
          entity: { visible: true, editable: true },
          deliveryLocations: { visible: true, editable: true },
          brandName: { visible: true, editable: true },
          brandNameArabic: { visible: true, editable: true },
          company_logo: { visible: true, editable: true },
          brand_logo: { visible: true, editable: true },
          primaryContactName: { visible: true, editable: true },
          primaryContactDesignation: { visible: true, editable: true },
          primaryContactEmail: { visible: true, editable: true },
          primaryContactPhone: { visible: true, editable: true },
          businessHeadSameAsPrimary: { visible: true, editable: true },
          businessHeadName: { visible: true, editable: true },
          businessHeadDesignation: { visible: true, editable: true },
          businessHeadEmail: { visible: true, editable: true },
          businessHeadPhone: { visible: true, editable: true },
          financeHeadName: { visible: true, editable: true },
          financeHeadDesignation: { visible: true, editable: true },
          financeHeadEmail: { visible: true, editable: true },
          financeHeadPhone: { visible: true, editable: true },
          purchasingHeadName: { visible: true, editable: true },
          purchasingHeadDesignation: { visible: true, editable: true },
          purchasingHeadEmail: { visible: true, editable: true },
          purchasingHeadPhone: { visible: true, editable: true },
          buildingName: { visible: true, editable: true },
          street: { visible: true, editable: true },
          district: { visible: true, editable: true },
          city: { visible: true, editable: true },
          region: { visible: true, editable: true },
          zone: { visible: true, editable: true },
          geolocation: { visible: true, editable: true },
          pincode: { visible: true, editable: true },
          dulySigned: { visible: true, editable: true },
          crCertificate: { visible: true, editable: true },
          vatCertificate: { visible: true, editable: true },
          nationalID: { visible: true, editable: true },
          bankLetter: { visible: true, editable: true },
          nonTradingDocuments: { visible: true, editable: true },
          bankName: { visible: true, editable: true },
          accountNumber: { visible: true, editable: true },
          ibanNumber: { visible: true, editable: true },
          prePayment: { visible: true, editable: true },
          partialPayment: { visible: true, editable: true },
          advancePayment: { visible: true, editable: true },
          COD: { visible: true, editable: true },
          credit: { visible: true, editable: true },
          creditLimit: { visible: true, editable: true },
          creditPeriod: { visible: true, editable: true },
          btnSave: { visible: true, editable: true }
        }
      },
      custDetailsEdit: {
        fields: {
          companyNameEn: { visible: true, editable: false },
          companyNameLc: { visible: true, editable: true },
          crNumber: { visible: true, editable: true },
          vatRegistrationNumber: { visible: true, editable: true },
          baladeahLicense: { visible: true, editable: true },
          companyType: { visible: true, editable: true },
          businessType: { visible: true, editable: true },
          businessTypeOther: { visible: true, editable: true },
          interCompany: { visible: true, editable: true },
          entity: { visible: true, editable: true },
          deliveryLocations: { visible: true, editable: true },
          brandName: { visible: true, editable: true },
          brandNameArabic: { visible: true, editable: true },
          company_logo: { visible: true, editable: true },
          brand_logo: { visible: true, editable: true },
          primaryContactName: { visible: true, editable: true },
          primaryContactDesignation: { visible: true, editable: true },
          primaryContactEmail: { visible: true, editable: true },
          primaryContactPhone: { visible: true, editable: true },
          businessHeadSameAsPrimary: { visible: true, editable: true },
          businessHeadName: { visible: true, editable: true },
          businessHeadDesignation: { visible: true, editable: true },
          businessHeadEmail: { visible: true, editable: true },
          businessHeadPhone: { visible: true, editable: true },
          financeHeadName: { visible: true, editable: true },
          financeHeadDesignation: { visible: true, editable: true },
          financeHeadEmail: { visible: true, editable: true },
          financeHeadPhone: { visible: true, editable: true },
          purchasingHeadName: { visible: true, editable: true },
          purchasingHeadDesignation: { visible: true, editable: true },
          purchasingHeadEmail: { visible: true, editable: true },
          purchasingHeadPhone: { visible: true, editable: true },
          buildingName: { visible: true, editable: true },
          street: { visible: true, editable: true },
          district: { visible: true, editable: true },
          city: { visible: true, editable: true },
          region: { visible: true, editable: true },
          zone: { visible: true, editable: true },
          geolocation: { visible: true, editable: true },
          pincode: { visible: true, editable: true },
          dulySigned: { visible: true, editable: true },
          crCertificate: { visible: true, editable: true },
          vatCertificate: { visible: true, editable: true },
          nationalID: { visible: true, editable: true },
          bankLetter: { visible: true, editable: true },
          nonTradingDocuments: { visible: true, editable: true },
          bankName: { visible: true, editable: true },
          accountNumber: { visible: true, editable: true },
          ibanNumber: { visible: true, editable: true },
          prePayment: { visible: true, editable: true },
          partialPayment: { visible: true, editable: true },
          advancePayment: { visible: true, editable: true },
          COD: { visible: true, editable: true },
          credit: { visible: true, editable: true },
          creditLimit: { visible: true, editable: true },
          creditPeriod: { visible: true, editable: true },
        }
      },
      
    },
    opsManager: {
      // Define opsManager permissions for all forms
      custDetailsAdd: {
        fields: {
          companyNameEn: { visible: true, editable: false },
          companyNameLc: { visible: true, editable: true },
          crNumber: { visible: true, editable: true },
          vatRegistrationNumber: { visible: true, editable: true },
          baladeahLicense: { visible: true, editable: true },
          companyType: { visible: true, editable: true },
          businessType: { visible: true, editable: true },
          businessTypeOther: { visible: true, editable: true },
          interCompany: { visible: true, editable: true },
          entity: { visible: true, editable: true },
          deliveryLocations: { visible: true, editable: true },
          brandName: { visible: true, editable: true },
          brandNameArabic: { visible: true, editable: true },
          company_logo: { visible: true, editable: true },
          brand_logo: { visible: true, editable: true },
          primaryContactName: { visible: true, editable: true },
          primaryContactDesignation: { visible: true, editable: true },
          primaryContactEmail: { visible: true, editable: true },
          primaryContactPhone: { visible: true, editable: true },
          businessHeadSameAsPrimary: { visible: true, editable: true },
          businessHeadName: { visible: true, editable: true },
          businessHeadDesignation: { visible: true, editable: true },
          businessHeadEmail: { visible: true, editable: true },
          businessHeadPhone: { visible: true, editable: true },
          financeHeadName: { visible: true, editable: true },
          financeHeadDesignation: { visible: true, editable: true },
          financeHeadEmail: { visible: true, editable: true },
          financeHeadPhone: { visible: true, editable: true },
          purchasingHeadName: { visible: true, editable: true },
          purchasingHeadDesignation: { visible: true, editable: true },
          purchasingHeadEmail: { visible: true, editable: true },
          purchasingHeadPhone: { visible: true, editable: true },
          buildingName: { visible: true, editable: true },
          street: { visible: true, editable: true },
          district: { visible: true, editable: true },
          city: { visible: true, editable: true },
          region: { visible: true, editable: true },
          zone: { visible: true, editable: true },
          geolocation: { visible: true, editable: true },
          pincode: { visible: true, editable: true },
          dulySigned: { visible: true, editable: true },
          crCertificate: { visible: true, editable: true },
          vatCertificate: { visible: true, editable: true },
          nationalID: { visible: true, editable: true },
          bankLetter: { visible: true, editable: true },
          nonTradingDocuments: { visible: true, editable: true },
          bankName: { visible: true, editable: true },
          accountNumber: { visible: true, editable: true },
          ibanNumber: { visible: true, editable: true },
          prePayment: { visible: true, editable: true },
          partialPayment: { visible: true, editable: true },
          advancePayment: { visible: true, editable: true },
          COD: { visible: true, editable: true },
          credit: { visible: true, editable: true },
          creditLimit: { visible: true, editable: true },
          creditPeriod: { visible: true, editable: true },
          btnSave: { visible: true, editable: true }
        }
      },
      custDetailsEdit: {
        fields: {
          companyNameEn: { visible: true, editable: false },
          companyNameLc: { visible: true, editable: true },
          crNumber: { visible: true, editable: true },
          vatRegistrationNumber: { visible: true, editable: true },
          baladeahLicense: { visible: true, editable: true },
          companyType: { visible: true, editable: true },
          businessType: { visible: true, editable: true },
          businessTypeOther: { visible: true, editable: true },
          interCompany: { visible: true, editable: true },
          entity: { visible: true, editable: true },
          deliveryLocations: { visible: true, editable: true },
          brandName: { visible: true, editable: true },
          brandNameArabic: { visible: true, editable: true },
          company_logo: { visible: true, editable: true },
          brand_logo: { visible: true, editable: true },
          primaryContactName: { visible: true, editable: true },
          primaryContactDesignation: { visible: true, editable: true },
          primaryContactEmail: { visible: true, editable: true },
          primaryContactPhone: { visible: true, editable: true },
          businessHeadSameAsPrimary: { visible: true, editable: true },
          businessHeadName: { visible: true, editable: true },
          businessHeadDesignation: { visible: true, editable: true },
          businessHeadEmail: { visible: true, editable: true },
          businessHeadPhone: { visible: true, editable: true },
          financeHeadName: { visible: true, editable: true },
          financeHeadDesignation: { visible: true, editable: true },
          financeHeadEmail: { visible: true, editable: true },
          financeHeadPhone: { visible: true, editable: true },
          purchasingHeadName: { visible: true, editable: true },
          purchasingHeadDesignation: { visible: true, editable: true },
          purchasingHeadEmail: { visible: true, editable: true },
          purchasingHeadPhone: { visible: true, editable: true },
          buildingName: { visible: true, editable: true },
          street: { visible: true, editable: true },
          district: { visible: true, editable: true },
          city: { visible: true, editable: true },
          region: { visible: true, editable: true },
          zone: { visible: true, editable: true },
          geolocation: { visible: true, editable: true },
          pincode: { visible: true, editable: true },
          dulySigned: { visible: true, editable: true },
          crCertificate: { visible: true, editable: true },
          vatCertificate: { visible: true, editable: true },
          nationalID: { visible: true, editable: true },
          bankLetter: { visible: true, editable: true },
          nonTradingDocuments: { visible: true, editable: true },
          bankName: { visible: true, editable: true },
          accountNumber: { visible: true, editable: true },
          ibanNumber: { visible: true, editable: true },
          prePayment: { visible: true, editable: true },
          partialPayment: { visible: true, editable: true },
          advancePayment: { visible: true, editable: true },
          COD: { visible: true, editable: true },
          credit: { visible: true, editable: true },
          creditLimit: { visible: true, editable: true },
          creditPeriod: { visible: true, editable: true },
        }
      },
      
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

  static getRoles(){
    return Object.keys(RbacManager.roleformfieldmap);
  }

  static getForms(role) {
    return Object.keys(RbacManager.roleformfieldmap?.['admin'] || {});
  }

  getFieldPermissions(role, form) {
    return RbacManager.roleformfieldmap?.[role]?.[form]?.fields || {};
  }

  /**
   * Returns the access definition object for a given field.
   * @param {string} field - The field name (e.g., 'orderNumber', 'customer')
   * @returns {object|undefined} The access definition object or undefined if not found
   */
  getFieldAccess(field) {
    return RbacManager.roleformfieldmap?.[this.currentRole]?.[this.currentForm]?.fields?.[field];
  }

  /**
   * Checks if a field is visible for the current role and form
   * @param {string} field - The field name
   * @returns {boolean} True if the field is visible, false otherwise
   */
  isV(field) {
    const access = this.getFieldAccess(field);
    return (access==null ? true : access.visible);
  }

  /**
   * Checks if a field is editable for the current role and form
   * @param {string} field - The field name
   * @returns {boolean} True if the field is editable, false otherwise
   */
  isE(field) {
    // console.log(`~~~~~~~~*********Checking access for field: ${field} in form: ${this.currentForm} for role: ${this.currentRole}`);
    const access = this.getFieldAccess(field);
    // console.log(`~~~~~~~~*********Access for field: ${field} is ${JSON.stringify(access)}`);  
    return (access==null ? true : access.editable)&&(this.itemInWF==null?true:this.isUserOwner);
  }
}

// Example usage
// const rbacMgr = new RbacManager('admin', 'orderList');
// const isV = rbacMgr.isV.bind(rbacMgr);
// const isE = rbacMgr.isE.bind(rbacMgr);
// console.log(isV('orderNumber')); // true
// console.log(isE('orderNumber')); // true
// console.log(isV('customer')); // false
// console.log(isE('customer')); // true
// console.log(isV('date')); // true
// console.log(isE('date')); // false

export default RbacManager;