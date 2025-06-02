import { str } from "ajv";

// RBAC Manager class
class RbacManager {
  constructor(role, form,inWF = null,isOwner = false) {
    this.currentRole = role;
    this.currentForm = form;
    this.itemInWF = inWF;
    this.isUserOwner = isOwner;
  }

  // Static roles definition
  static roleformfieldmap = {
    admin: {
      orderList: {
        fields: {
          orderNumber: { visible: true, editable: true },
          companyName: { visible: true, editable: true },
          branchName: { visible: true, editable: true },
          entity: { visible: true, editable: true },
          paymentMethod: { visible: true, editable: true },
          expectedDeliveryDate: { visible: true, editable: true },
          paymentStatus: { visible: true, editable: true },
          toyalAmount: { visible: true, editable: true },
          paidAmount: { visible: true, editable: true },
          status: { visible: true, editable: true },
          action: { visible: true, editable: true },
          addButton: { visible: true, editable: true },
          orderBy: { visible: true, editable: true },

        }
      },
      orderDetailAdd: {
        fields: {
          orderDetails: { visible: true, editable: false },
          customerName: { visible: true, editable: true },
          branchName: { visible: true, editable: true },
          orderBy: { visible: true, editable: true },
          erpId: { visible: true, editable: false },
          entity: { visible: true, editable: true },
          paymentMethod: { visible: true, editable: true },
          totalAmount: { visible: true, editable: true },
          paidAmount: { visible: true, editable: true },
          deliveryCharges: { visible: true, editable: true },
          expectedDeliveryDate: { visible: true, editable: true },
          createdDate: { visible: false, editable: false },
          updatedDate: { visible: false, editable: false },
          driver: { visible: true, editable: true },
          vehicleNumber: { visible: true, editable: true },
          images: { visible: true, editable: true },
          addImages: { visible: false, editable: false },
          products: { visible: true, editable: true },
          orderFooter: { visible: true, editable: true },
          btnSave: { visible: true, editable: true },
          btnCancel: { visible: true, editable: true },
          btnInvoice: { visible: true, editable: true },
          btnInventory: { visible: true, editable: true },
          actionButtons: { visible: true, editable: true },
          btnApprove: { visible: false, editable: true },
          btnReject: { visible: false, editable: true },
        }
      },
      orderDetailEdit: {
        fields: {
          orderDetails: { visible: true, editable: false },
          customerName: { visible: true, editable: true },
          branchName: { visible: true, editable: true },
          orderBy: { visible: true, editable: true },
          erpId: { visible: true, editable: true },
          entity: { visible: true, editable: true },
          paymentMethod: { visible: true, editable: true },
          totalAmount: { visible: true, editable: true },
          paidAmount: { visible: true, editable: true },
          deliveryCharges: { visible: true, editable: true },
          expectedDeliveryDate: { visible: true, editable: true },
          createdDate: { visible: true, editable: true },
          updatedDate: { visible: true, editable: true },
          driver: { visible: true, editable: true },
          vehicleNumber: { visible: true, editable: true },
          images: { visible: true, editable: true },
          addImages: { visible: true, editable: true },
          products: { visible: true, editable: true },
          orderFooter: { visible: true, editable: true },
          btnSave: { visible: true, editable: true },
          btnCancel: { visible: true, editable: true },
          btnInvoice: { visible: true, editable: true },
          btnInventory: { visible: true, editable: true },
          actionButtons: { visible: true, editable: true },
          btnApprove: { visible: true, editable: true },
          btnReject: { visible: true, editable: true },
        }
      },

      catalog: {
        fields: {
          selectBranch: { visible: true, editable: true },
          search: { visible: true, editable: true },
          products: { visible: true, editable: true },
          quantityController: { visible: true, editable: true },
          addToCart: { visible: true, editable: true },
          goToCart: { visible: true, editable: true },
          sort: { visible: true, editable: true }
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
          branch: { visible: true, editable: false },
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
          branch: { visible: true, editable: false },
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

    customer_primary: {
      orderList: {
        fields: {
          orderNumber: { visible: true, editable: true },
          companyName: { visible: false, editable: true },
          branchName: { visible: true, editable: true },
          entity: { visible: true, editable: true },
          paymentMethod: { visible: true, editable: true },
          expectedDeliveryDate: { visible: true, editable: true },
          paymentStatus: { visible: true, editable: true },
          totalAmount: { visible: true, editable: true },
          paidAmount: { visible: true, editable: true },
          status: { visible: true, editable: true },
          action: { visible: true, editable: true },
          addButton: { visible: false, editable: false },
          approvalButton: { visible: false, editable: false },
          orderBy: { visible: true, editable: true },

        }
      },
      orderDetailAdd: {
        fields: {
          orderDetails: { visible: true, editable: false },
          customerName: { visible: true, editable: false },
          branchName: { visible: true, editable: false },
          orderBy: { visible: true, editable: false },
          erpId: { visible: true, editable: false },
          entity: { visible: true, editable: false },
          paymentMethod: { visible: true, editable: false },
          totalAmount: { visible: true, editable: false },
          paidAmount: { visible: false, editable: false },
          deliveryCharges: { visible: true, editable: false },
          expectedDeliveryDate: { visible: true, editable: true },
          createdDate: { visible: false, editable: false },
          updatedDate: { visible: false, editable: false },
          driver: { visible: true, editable: false },
          vehicleNumber: { visible: true, editable: false },
          images: { visible: true, editable: false },
          addImages: { visible: false, editable: false },
          products: { visible: true, editable: false },
          orderFooter: { visible: true, editable: false },
          btnSave: { visible: true, editable: false },
          btnCancel: { visible: true, editable: false },
          btnInvoice: { visible: true, editable: false },
          btnInventory: { visible: true, editable: false },
          actionButtons: { visible: true, editable: false },
          btnApprove: { visible: false, editable: false },
          btnReject: { visible: false, editable: false },
        }
      },
      orderDetailEdit: {
        fields: {
          orderDetails: { visible: true, editable: false },
          customerName: { visible: true, editable: false },
          branchName: { visible: true, editable: false },
          orderBy: { visible: true, editable: false },
          erpId: { visible: true, editable: false },
          entity: { visible: true, editable: false },
          paymentMethod: { visible: true, editable: false },
          totalAmount: { visible: true, editable: false },
          paidAmount: { visible: true, editable: false },
          deliveryCharges: { visible: true, editable: false },
          expectedDeliveryDate: { visible: true, editable: false },
          createdDate: { visible: false, editable: false },
          updatedDate: { visible: false, editable: false },
          driver: { visible: false, editable: false },
          vehicleNumber: { visible: false, editable: false },
          images: { visible: false, editable: false },
          addImages: { visible: false, editable: false },
          products: { visible: true, editable: true },
          orderFooter: { visible: true, editable: true },
          btnSave: { visible: true, editable: true },
          btnCancel: { visible: true, editable: true },
          btnInvoice: { visible: true, editable: true },
          btnInventory: { visible: false, editable: false },
          actionButtons: { visible: false, editable: false },
          btnApprove: { visible: false, editable: false },
          btnReject: { visible: false, editable: false },
        }
      },
      catalog: {
        fields: {
          selectBranch: { visible: true, editable: true },
          search: { visible: true, editable: true },
          products: { visible: true, editable: true },
          quantityController: { visible: true, editable: true },
          addToCart: { visible: true, editable: true },
          goToCart: { visible: true, editable: true },
          sort: { visible: true, editable: true },
          search: { visible: true, editable: true }
        }
      },

      supList: {
        fields: {
          btnAdd: { visible: true, editable: false },
        }
      },
      supDetailAdd: {
        fields: {
          customerName: { visible: true, editable: false },
          branch: { visible: true, editable: true },
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
          branch: { visible: true, editable: true },
          issueType: { visible: true, editable: true },
          issueName: { visible: true, editable: false },
          issueDetails: { visible: true, editable: false },
          images: { visible: true, editable: true },
          issueStatus: { visible: true, editable: false },
          assignedTo: { visible: false, editable: true },
          btnSave: { visible: true, editable: true }
        }
      },
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
          btnSave: { visible: true, editable: true },
          btnBlock: {visible: false, editable: true}
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

    branch_primary: {
      orderList: {
        fields: {
          orderNumber: { visible: true, editable: true },
          companyName: { visible: true, editable: true },
          branchName: { visible: true, editable: true },
          entity: { visible: true, editable: true },
          paymentMethod: { visible: true, editable: true },
          expectedDeliveryDate: { visible: true, editable: true },
          paymentStatus: { visible: true, editable: true },
          toyalAmount: { visible: true, editable: true },
          paidAmount: { visible: true, editable: true },
          status: { visible: true, editable: true },
          action: { visible: true, editable: true },
          addButton: { visible: true, editable: true },
          orderBy: { visible: true, editable: true },

        }
      },
      orderDetailAdd: {
        fields: {
          orderDetails: { visible: true, editable: false },
          customerName: { visible: false, editable: false },
          branchName: { visible: true, editable: false },
          orderBy: { visible: true, editable: false },
          erpId: { visible: true, editable: false },
          entity: { visible: true, editable: false },
          paymentMethod: { visible: true, editable: false },
          totalAmount: { visible: true, editable: false },
          paidAmount: { visible: false, editable: false },
          deliveryCharges: { visible: true, editable: false },
          expectedDeliveryDate: { visible: true, editable: true },
          createdDate: { visible: false, editable: false },
          updatedDate: { visible: false, editable: false },
          driver: { visible: true, editable: false },
          vehicleNumber: { visible: true, editable: false },
          images: { visible: true, editable: false },
          addImages: { visible: false, editable: false },
          products: { visible: true, editable: false },
          orderFooter: { visible: true, editable: false },
          btnSave: { visible: true, editable: false },
          btnCancel: { visible: true, editable: false },
          btnInvoice: { visible: true, editable: false },
          btnInventory: { visible: true, editable: false },
          actionButtons: { visible: true, editable: false },
          btnApprove: { visible: false, editable: false },
          btnReject: { visible: false, editable: false },
        }
      },
      orderDetailEdit: {
        fields: {
          orderDetails: { visible: true, editable: false },
          customerName: { visible: true, editable: true },
          branchName: { visible: true, editable: true },
          orderBy: { visible: true, editable: false },
          erpId: { visible: true, editable: false },
          entity: { visible: true, editable: false },
          paymentMethod: { visible: true, editable: false },
          totalAmount: { visible: true, editable: false },
          paidAmount: { visible: true, editable: false },
          deliveryCharges: { visible: true, editable: false },
          expectedDeliveryDate: { visible: true, editable: false },
          createdDate: { visible: false, editable: false },
          updatedDate: { visible: false, editable: false },
          driver: { visible: false, editable: false },
          vehicleNumber: { visible: false, editable: false },
          images: { visible: false, editable: false },
          addImages: { visible: false, editable: false },
          products: { visible: true, editable: true },
          orderFooter: { visible: true, editable: true },
          btnSave: { visible: true, editable: true },
          btnCancel: { visible: true, editable: true },
          btnInvoice: { visible: true, editable: true },
          btnInventory: { visible: false, editable: false },
          actionButtons: { visible: false, editable: false },
          btnApprove: { visible: false, editable: false },
          btnReject: { visible: false, editable: false },
        }
      },
    },

    operations_coordinator: {
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
          btnSave: { visible: true, editable: false },
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
          btnBlock: {visible: false, editable: true},
        }
      },
      
    },
    opsManager: {
      orderList: {
        fields: {
          orderNumber: { visible: true, editable: true },
          companyName: { visible: true, editable: true },
          branchName: { visible: true, editable: true },
          entity: { visible: true, editable: true },
          paymentMethod: { visible: true, editable: true },
          expectedDeliveryDate: { visible: true, editable: true },
          paymentStatus: { visible: true, editable: true },
          toyalAmount: { visible: true, editable: true },
          paidAmount: { visible: true, editable: true },
          status: { visible: true, editable: true },
          action: { visible: true, editable: true },
          addButton: { visible: true, editable: true },
          orderBy: { visible: true, editable: true },

        }
      },
      orderDetailAdd: {
        fields: {
          orderDetails: { visible: true, editable: false },
          customerName: { visible: true, editable: true },
          branchName: { visible: true, editable: true },
          orderBy: { visible: true, editable: true },
          erpId: { visible: true, editable: false },
          entity: { visible: true, editable: true },
          paymentMethod: { visible: true, editable: true },
          totalAmount: { visible: true, editable: true },
          paidAmount: { visible: true, editable: true },
          deliveryCharges: { visible: true, editable: true },
          expectedDeliveryDate: { visible: true, editable: true },
          createdDate: { visible: false, editable: false },
          updatedDate: { visible: false, editable: false },
          driver: { visible: true, editable: true },
          vehicleNumber: { visible: true, editable: true },
          images: { visible: true, editable: true },
          addImages: { visible: false, editable: false },
          products: { visible: true, editable: true },
          orderFooter: { visible: true, editable: true },
          btnSave: { visible: true, editable: true },
          btnCancel: { visible: true, editable: true },
          btnInvoice: { visible: true, editable: true },
          btnInventory: { visible: true, editable: true },
          actionButtons: { visible: true, editable: true },
          btnApprove: { visible: true, editable: true },
          btnReject: { visible: true, editable: true },
        }
      },
      orderDetailEdit: {
        fields: {
          orderDetails: { visible: true, editable: false },
          customerName: { visible: true, editable: true },
          branchName: { visible: true, editable: true },
          orderBy: { visible: true, editable: true },
          erpId: { visible: true, editable: true },
          entity: { visible: true, editable: true },
          paymentMethod: { visible: true, editable: true },
          totalAmount: { visible: true, editable: true },
          paidAmount: { visible: true, editable: true },
          deliveryCharges: { visible: true, editable: true },
          expectedDeliveryDate: { visible: true, editable: true },
          createdDate: { visible: true, editable: true },
          updatedDate: { visible: true, editable: true },
          driver: { visible: true, editable: true },
          vehicleNumber: { visible: true, editable: true },
          images: { visible: true, editable: true },
          addImages: { visible: true, editable: true },
          products: { visible: true, editable: true },
          orderFooter: { visible: true, editable: true },
          btnSave: { visible: true, editable: true },
          btnCancel: { visible: true, editable: true },
          btnInvoice: { visible: true, editable: true },
          btnInventory: { visible: true, editable: true },
          actionButtons: { visible: true, editable: true },
          btnApprove: { visible: true, editable: true },
          btnReject: { visible: true, editable: true },
        }
      },
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
      orderList: {
        fields: {
          orderNumber: { visible: true, editable: true },
          companyName: { visible: true, editable: true },
          branchName: { visible: true, editable: true },
          entity: { visible: true, editable: true },
          paymentMethod: { visible: true, editable: true },
          expectedDeliveryDate: { visible: true, editable: true },
          paymentStatus: { visible: true, editable: true },
          toyalAmount: { visible: true, editable: true },
          paidAmount: { visible: true, editable: true },
          status: { visible: true, editable: true },
          action: { visible: true, editable: true },
          addButton: { visible: true, editable: true },
          orderBy: { visible: true, editable: true },

        }
      },
      orderDetailAdd: {
        fields: {
          orderDetails: { visible: true, editable: false },
          customerName: { visible: true, editable: true },
          branchName: { visible: true, editable: true },
          orderBy: { visible: true, editable: true },
          erpId: { visible: true, editable: false },
          entity: { visible: true, editable: true },
          paymentMethod: { visible: true, editable: true },
          totalAmount: { visible: true, editable: true },
          paidAmount: { visible: true, editable: true },
          deliveryCharges: { visible: true, editable: true },
          expectedDeliveryDate: { visible: true, editable: true },
          createdDate: { visible: false, editable: false },
          updatedDate: { visible: false, editable: false },
          driver: { visible: true, editable: true },
          vehicleNumber: { visible: true, editable: true },
          images: { visible: true, editable: true },
          addImages: { visible: false, editable: false },
          products: { visible: true, editable: true },
          orderFooter: { visible: true, editable: true },
          btnSave: { visible: true, editable: true },
          btnCancel: { visible: true, editable: true },
          btnInvoice: { visible: true, editable: true },
          btnInventory: { visible: true, editable: true },
          actionButtons: { visible: true, editable: true },
          btnApprove: { visible: true, editable: true },
          btnReject: { visible: true, editable: true },
        }
      },
      orderDetailEdit: {
        fields: {
          orderDetails: { visible: true, editable: false },
          customerName: { visible: true, editable: true },
          branchName: { visible: true, editable: true },
          orderBy: { visible: true, editable: true },
          erpId: { visible: true, editable: true },
          entity: { visible: true, editable: true },
          paymentMethod: { visible: true, editable: true },
          totalAmount: { visible: true, editable: true },
          paidAmount: { visible: true, editable: true },
          deliveryCharges: { visible: true, editable: true },
          expectedDeliveryDate: { visible: true, editable: true },
          createdDate: { visible: true, editable: true },
          updatedDate: { visible: true, editable: true },
          driver: { visible: true, editable: true },
          vehicleNumber: { visible: true, editable: true },
          images: { visible: true, editable: true },
          addImages: { visible: true, editable: true },
          products: { visible: true, editable: true },
          orderFooter: { visible: true, editable: true },
          btnSave: { visible: true, editable: true },
          btnCancel: { visible: true, editable: true },
          btnInvoice: { visible: true, editable: true },
          btnInventory: { visible: true, editable: true },
          actionButtons: { visible: true, editable: true },
          btnApprove: { visible: true, editable: true },
          btnReject: { visible: true, editable: true },
        }
      },
    },

    areaSalesManager: {
      orderList: {
        fields: {
          orderNumber: { visible: true, editable: true },
          companyName: { visible: true, editable: true },
          branchName: { visible: true, editable: true },
          entity: { visible: true, editable: true },
          paymentMethod: { visible: true, editable: true },
          expectedDeliveryDate: { visible: true, editable: true },
          paymentStatus: { visible: true, editable: true },
          toyalAmount: { visible: true, editable: true },
          paidAmount: { visible: true, editable: true },
          status: { visible: true, editable: true },
          action: { visible: true, editable: true },
          addButton: { visible: true, editable: true },
          orderBy: { visible: true, editable: true },

        }
      },
      orderDetailAdd: {
        fields: {
          orderDetails: { visible: true, editable: false },
          customerName: { visible: true, editable: true },
          branchName: { visible: true, editable: true },
          orderBy: { visible: true, editable: true },
          erpId: { visible: true, editable: false },
          entity: { visible: true, editable: true },
          paymentMethod: { visible: true, editable: true },
          totalAmount: { visible: true, editable: true },
          paidAmount: { visible: true, editable: true },
          deliveryCharges: { visible: true, editable: true },
          expectedDeliveryDate: { visible: true, editable: true },
          createdDate: { visible: false, editable: false },
          updatedDate: { visible: false, editable: false },
          driver: { visible: true, editable: true },
          vehicleNumber: { visible: true, editable: true },
          images: { visible: true, editable: true },
          addImages: { visible: false, editable: false },
          products: { visible: true, editable: true },
          orderFooter: { visible: true, editable: true },
          btnSave: { visible: true, editable: true },
          btnCancel: { visible: true, editable: true },
          btnInvoice: { visible: true, editable: true },
          btnInventory: { visible: true, editable: true },
          actionButtons: { visible: true, editable: true },
          btnApprove: { visible: true, editable: true },
          btnReject: { visible: true, editable: true },
        }
      },
      orderDetailEdit: {
        fields: {
          orderDetails: { visible: true, editable: false },
          customerName: { visible: true, editable: true },
          branchName: { visible: true, editable: true },
          orderBy: { visible: true, editable: true },
          erpId: { visible: true, editable: true },
          entity: { visible: true, editable: true },
          paymentMethod: { visible: true, editable: true },
          totalAmount: { visible: true, editable: true },
          paidAmount: { visible: true, editable: true },
          deliveryCharges: { visible: true, editable: true },
          expectedDeliveryDate: { visible: true, editable: true },
          createdDate: { visible: true, editable: true },
          updatedDate: { visible: true, editable: true },
          driver: { visible: true, editable: true },
          vehicleNumber: { visible: true, editable: true },
          images: { visible: true, editable: true },
          addImages: { visible: true, editable: true },
          products: { visible: true, editable: true },
          orderFooter: { visible: true, editable: true },
          btnSave: { visible: true, editable: true },
          btnCancel: { visible: true, editable: true },
          btnInvoice: { visible: true, editable: true },
          btnInventory: { visible: true, editable: true },
          actionButtons: { visible: true, editable: true },
          btnApprove: { visible: true, editable: true },
          btnReject: { visible: true, editable: true },
        }
      },
    },

    fieldEngineer: {
      orderList: {
        fields: {
          orderNumber: { visible: true, editable: true },
          companyName: { visible: true, editable: true },
          branchName: { visible: true, editable: true },
          entity: { visible: true, editable: true },
          paymentMethod: { visible: true, editable: true },
          expectedDeliveryDate: { visible: true, editable: true },
          paymentStatus: { visible: true, editable: true },
          toyalAmount: { visible: true, editable: true },
          paidAmount: { visible: true, editable: true },
          status: { visible: true, editable: true },
          action: { visible: true, editable: true },
          addButton: { visible: true, editable: true },
          orderBy: { visible: true, editable: true },

        }
      },
      orderDetailAdd: {
        fields: {
          orderDetails: { visible: true, editable: false },
          customerName: { visible: true, editable: true },
          branchName: { visible: true, editable: true },
          orderBy: { visible: true, editable: true },
          erpId: { visible: true, editable: false },
          entity: { visible: true, editable: true },
          paymentMethod: { visible: true, editable: true },
          totalAmount: { visible: true, editable: true },
          paidAmount: { visible: true, editable: true },
          deliveryCharges: { visible: true, editable: true },
          expectedDeliveryDate: { visible: true, editable: true },
          createdDate: { visible: false, editable: false },
          updatedDate: { visible: false, editable: false },
          driver: { visible: true, editable: true },
          vehicleNumber: { visible: true, editable: true },
          images: { visible: true, editable: true },
          addImages: { visible: false, editable: false },
          products: { visible: true, editable: true },
          orderFooter: { visible: true, editable: true },
          btnSave: { visible: true, editable: true },
          btnCancel: { visible: true, editable: true },
          btnInvoice: { visible: true, editable: true },
          btnInventory: { visible: true, editable: true },
          actionButtons: { visible: true, editable: true },
          btnApprove: { visible: true, editable: true },
          btnReject: { visible: true, editable: true },
        }
      },
      orderDetailEdit: {
        fields: {
          orderDetails: { visible: true, editable: false },
          customerName: { visible: true, editable: true },
          branchName: { visible: true, editable: true },
          orderBy: { visible: true, editable: true },
          erpId: { visible: true, editable: true },
          entity: { visible: true, editable: true },
          paymentMethod: { visible: true, editable: true },
          totalAmount: { visible: true, editable: true },
          paidAmount: { visible: true, editable: true },
          deliveryCharges: { visible: true, editable: true },
          expectedDeliveryDate: { visible: true, editable: true },
          createdDate: { visible: true, editable: true },
          updatedDate: { visible: true, editable: true },
          driver: { visible: true, editable: true },
          vehicleNumber: { visible: true, editable: true },
          images: { visible: true, editable: true },
          addImages: { visible: true, editable: true },
          products: { visible: true, editable: true },
          orderFooter: { visible: true, editable: true },
          btnSave: { visible: true, editable: true },
          btnCancel: { visible: true, editable: true },
          btnInvoice: { visible: true, editable: true },
          btnInventory: { visible: true, editable: true },
          actionButtons: { visible: true, editable: true },
          btnApprove: { visible: true, editable: true },
          btnReject: { visible: true, editable: true },
        }
      },
    },

    maintenanceTechnician: {
      orderList: {
        fields: {
          orderNumber: { visible: true, editable: true },
          companyName: { visible: true, editable: true },
          branchName: { visible: true, editable: true },
          entity: { visible: true, editable: true },
          paymentMethod: { visible: true, editable: true },
          expectedDeliveryDate: { visible: true, editable: true },
          paymentStatus: { visible: true, editable: true },
          toyalAmount: { visible: true, editable: true },
          paidAmount: { visible: true, editable: true },
          status: { visible: true, editable: true },
          action: { visible: true, editable: true },
          addButton: { visible: true, editable: true },
          orderBy: { visible: true, editable: true },

        }
      },
      orderDetailAdd: {
        fields: {
          orderDetails: { visible: true, editable: false },
          customerName: { visible: true, editable: true },
          branchName: { visible: true, editable: true },
          orderBy: { visible: true, editable: true },
          erpId: { visible: true, editable: false },
          entity: { visible: true, editable: true },
          paymentMethod: { visible: true, editable: true },
          totalAmount: { visible: true, editable: true },
          paidAmount: { visible: true, editable: true },
          deliveryCharges: { visible: true, editable: true },
          expectedDeliveryDate: { visible: true, editable: true },
          createdDate: { visible: false, editable: false },
          updatedDate: { visible: false, editable: false },
          driver: { visible: true, editable: true },
          vehicleNumber: { visible: true, editable: true },
          images: { visible: true, editable: true },
          addImages: { visible: false, editable: false },
          products: { visible: true, editable: true },
          orderFooter: { visible: true, editable: true },
          btnSave: { visible: true, editable: true },
          btnCancel: { visible: true, editable: true },
          btnInvoice: { visible: true, editable: true },
          btnInventory: { visible: true, editable: true },
          actionButtons: { visible: true, editable: true },
          btnApprove: { visible: true, editable: true },
          btnReject: { visible: true, editable: true },
        }
      },
      orderDetailEdit: {
        fields: {
          orderDetails: { visible: true, editable: false },
          customerName: { visible: true, editable: true },
          branchName: { visible: true, editable: true },
          orderBy: { visible: true, editable: true },
          erpId: { visible: true, editable: true },
          entity: { visible: true, editable: true },
          paymentMethod: { visible: true, editable: true },
          totalAmount: { visible: true, editable: true },
          paidAmount: { visible: true, editable: true },
          deliveryCharges: { visible: true, editable: true },
          expectedDeliveryDate: { visible: true, editable: true },
          createdDate: { visible: true, editable: true },
          updatedDate: { visible: true, editable: true },
          driver: { visible: true, editable: true },
          vehicleNumber: { visible: true, editable: true },
          images: { visible: true, editable: true },
          addImages: { visible: true, editable: true },
          products: { visible: true, editable: true },
          orderFooter: { visible: true, editable: true },
          btnSave: { visible: true, editable: true },
          btnCancel: { visible: true, editable: true },
          btnInvoice: { visible: true, editable: true },
          btnInventory: { visible: true, editable: true },
          actionButtons: { visible: true, editable: true },
          btnApprove: { visible: true, editable: true },
          btnReject: { visible: true, editable: true },
        }
      },
    },

    driver: {
      orderList: {
        fields: {
          orderNumber: { visible: true, editable: true },
          companyName: { visible: true, editable: true },
          branchName: { visible: true, editable: true },
          entity: { visible: true, editable: true },
          paymentMethod: { visible: true, editable: true },
          expectedDeliveryDate: { visible: true, editable: true },
          paymentStatus: { visible: true, editable: true },
          toyalAmount: { visible: true, editable: true },
          paidAmount: { visible: true, editable: true },
          status: { visible: true, editable: true },
          action: { visible: true, editable: true },
          addButton: { visible: true, editable: true },
          orderBy: { visible: true, editable: true },

        }
      },
      orderDetailAdd: {
        fields: {
          orderDetails: { visible: true, editable: false },
          customerName: { visible: true, editable: true },
          branchName: { visible: true, editable: true },
          orderBy: { visible: true, editable: true },
          erpId: { visible: true, editable: false },
          entity: { visible: true, editable: true },
          paymentMethod: { visible: true, editable: true },
          totalAmount: { visible: true, editable: true },
          paidAmount: { visible: true, editable: true },
          deliveryCharges: { visible: true, editable: true },
          expectedDeliveryDate: { visible: true, editable: true },
          createdDate: { visible: false, editable: false },
          updatedDate: { visible: false, editable: false },
          driver: { visible: true, editable: true },
          vehicleNumber: { visible: true, editable: true },
          images: { visible: true, editable: true },
          addImages: { visible: false, editable: false },
          products: { visible: true, editable: true },
          orderFooter: { visible: true, editable: true },
          btnSave: { visible: true, editable: true },
          btnCancel: { visible: true, editable: true },
          btnInvoice: { visible: true, editable: true },
          btnInventory: { visible: true, editable: true },
          actionButtons: { visible: true, editable: true },
          btnApprove: { visible: true, editable: true },
          btnReject: { visible: true, editable: true },
        }
      },
      orderDetailEdit: {
        fields: {
          orderDetails: { visible: true, editable: false },
          customerName: { visible: true, editable: true },
          branchName: { visible: true, editable: true },
          orderBy: { visible: true, editable: true },
          erpId: { visible: true, editable: true },
          entity: { visible: true, editable: true },
          paymentMethod: { visible: true, editable: true },
          totalAmount: { visible: true, editable: true },
          paidAmount: { visible: true, editable: true },
          deliveryCharges: { visible: true, editable: true },
          expectedDeliveryDate: { visible: true, editable: true },
          createdDate: { visible: true, editable: true },
          updatedDate: { visible: true, editable: true },
          driver: { visible: true, editable: true },
          vehicleNumber: { visible: true, editable: true },
          images: { visible: true, editable: true },
          addImages: { visible: true, editable: true },
          products: { visible: true, editable: true },
          orderFooter: { visible: true, editable: true },
          btnSave: { visible: true, editable: true },
          btnCancel: { visible: true, editable: true },
          btnInvoice: { visible: true, editable: true },
          btnInventory: { visible: true, editable: true },
          actionButtons: { visible: true, editable: true },
          btnApprove: { visible: true, editable: true },
          btnReject: { visible: true, editable: true }
        }
      },
    }
  };

  static getRoles() {
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
    return (access == null ? true : access.visible);
  }

  /**
   * Checks if a field is editable for the current role and form
   * @param {string} field - The field name
   * @returns {boolean} True if the field is editable, false otherwise
   */
  isE(field, approvalWF = false, fieldInWF = false) {
    //console.log(`~~~~~~~~*********Checking access for field: ${field} in form: ${this.currentForm} for role: ${this.currentRole}`);
    const access = this.getFieldAccess(field);
    //console.log(`~~~~~~~~*********Access for field: ${field} is ${JSON.stringify(access)}`);  
    return (access == null ? true : access.editable) && (this.itemInWF == null ? true : this.isUserOwner) && ((approvalWF == true && fieldInWF == true) ? true : (approvalWF == true && fieldInWF == false) ? false : true);
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