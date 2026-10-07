const CONFIG = {
  GENERAL: {
    COMPANY_NAME: "PT ABC"
  },

  TARGET: {
    SPREADSHEET_ID: "YOUR_ID",
    SHEET_NAME: "SHEET_NAME",
    FOLDER_DRIVE_ID: "YOUR_DRIVE_ID"
  },

  SALES: {
    SPREADSHEET_ID: "YOUR_ID",
    SHEET_NAME: "SHEET_NAME",
    COL_NAME: "COL_SALES_NAME",
    COL_EMAIL: "EMAIL_SALES"
  },

  CUSTOMER: {
    SPREADSHEET_ID: "YOUR_ID",
    SHEET_NAME: "SHEET_NAME",
    COL_CODE: "COL_CODE_OUTLET",
    COL_NAME: "COL_NAME_OUTLET",
    COL_CONTACT: "COL_NAME_CONTACT",
    FILTER_PREFIX: "1|2|3|4|5|6|7|8|9|SL|YY|MKS|MGL|PW|PWT|PLU|SG|SMG|TGL|PA|KDI"
  },

  CATEGORY: {
    SPREADSHEET_ID: "YOUR_ID",
    SHEET_NAME: "SHEET_ID",
    COL_NAME: "COL_CATEGORY"
  },

  CITY: {
    SPREADSHEET_ID: "YOUR_ID",
    SHEET_NAME: "SHEET_NAME",
    COL_NAME: "COL_CITY_NAME"
  },

  PHOTO: {
    ENABLED: true
  }
};

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle(CONFIG.GENERAL.COMPANY_NAME + ' - Order Form')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function getSheetDataByHeader(spreadsheetId, sheetName, columnName) {
  if (!spreadsheetId || !sheetName || !columnName) return [];
  try {
    const ss = SpreadsheetApp.openById(spreadsheetId);
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) return [];

    const data = sheet.getDataRange().getValues();
    if (data.length < 2) return [];

    const headers = data[0].map(h => String(h).replace(/\u00a0/g, " ").trim());
    const colIndex = headers.indexOf(columnName.trim());
    if (colIndex === -1) return [];

    const results = [];
    for (let i = 1; i < data.length; i++) {
      const val = data[i][colIndex];
      if (val !== "" && val !== null && val !== undefined) {
        results.push(String(val).trim());
      }
    }
    return [...new Set(results)];
  } catch (e) {
    Logger.log("Error reading header data: " + e.toString());
    return [];
  }
}

function isCodeMatchingFilter(code, filterString) {
  if (!filterString || String(filterString).trim() === "") return true;
  const prefixes = String(filterString).split('|').map(p => p.trim().toLowerCase()).filter(p => p !== "");
  if (prefixes.length === 0) return true;
  const cleanCode = String(code || "").trim().toLowerCase();
  return prefixes.some(prefix => cleanCode.startsWith(prefix));
}

function getCustomerData() {
  const cfg = CONFIG.CUSTOMER;
  if (!cfg.SPREADSHEET_ID || !cfg.SHEET_NAME) return [];
  try {
    const ss = SpreadsheetApp.openById(cfg.SPREADSHEET_ID);
    const sheet = ss.getSheetByName(cfg.SHEET_NAME);
    if (!sheet) return [];

    const data = sheet.getDataRange().getValues();
    if (data.length < 2) return [];

    const headers = data[0].map(h => String(h).replace(/\u00a0/g, " ").trim());
    const codeIdx = headers.indexOf(cfg.COL_CODE.trim());
    const nameIdx = headers.indexOf(cfg.COL_NAME.trim());
    const contactIdx = cfg.COL_CONTACT ? headers.indexOf(cfg.COL_CONTACT.trim()) : -1;

    if (codeIdx === -1 || nameIdx === -1) return [];

    const customers = [];
    for (let i = 1; i < data.length; i++) {
      const code = String(data[i][codeIdx] || "").trim();
      const name = String(data[i][nameIdx] || "").trim();
      const contact = contactIdx !== -1 ? String(data[i][contactIdx] || "").trim() : "";

      if ((code || name) && isCodeMatchingFilter(code, cfg.FILTER_PREFIX)) {
        customers.push({ code: code, name: name, contact: contact });
      }
    }
    return customers;
  } catch (e) {
    Logger.log("Error customer data: " + e.toString());
    return [];
  }
}

function getSalesData(userEmail) {
  const cfg = CONFIG.SALES;
  if (!cfg.SPREADSHEET_ID || !cfg.SHEET_NAME) {
    return { isAllowed: false, salesList: [], matchedSales: "", debugError: "CONFIG.SALES SPREADSHEET_ID atau SHEET_NAME belum diisi." };
  }
  
  try {
    const ss = SpreadsheetApp.openById(cfg.SPREADSHEET_ID);
    const sheet = ss.getSheetByName(cfg.SHEET_NAME);
    
    if (!sheet) {
      return { isAllowed: false, salesList: [], matchedSales: "", debugError: "Sheet '" + cfg.SHEET_NAME + "' tidak ditemukan di Spreadsheet." };
    }

    const data = sheet.getDataRange().getValues();
    if (data.length < 2) {
      return { isAllowed: false, salesList: [], matchedSales: "", debugError: "Data pada sheet '" + cfg.SHEET_NAME + "' kosong atau hanya ada header." };
    }

    const headers = data[0].map(h => String(h).replace(/\u00a0/g, " ").trim());
    const nameIdx = headers.indexOf(cfg.COL_NAME.trim());
    const emailIdx = headers.indexOf(cfg.COL_EMAIL.trim());

    if (nameIdx === -1 || emailIdx === -1) {
      return { 
        isAllowed: false, 
        salesList: [], 
        matchedSales: "", 
        debugError: "Header kolom '" + cfg.COL_NAME + "' atau '" + cfg.COL_EMAIL + "' tidak ditemukan. Header yang dibaca: " + JSON.stringify(headers) 
      };
    }

    const salesList = [];
    let matchedSales = "";
    let isAllowed = false;

    const cleanUserEmail = String(userEmail || "").replace(/\u00a0/g, "").trim().toLowerCase();

    for (let i = 1; i < data.length; i++) {
      const sName = String(data[i][nameIdx] || "").trim();
      const sEmail = String(data[i][emailIdx] || "").replace(/\u00a0/g, "").trim().toLowerCase();

      if (sName && !salesList.includes(sName)) {
        salesList.push(sName);
      }

      if (sEmail && cleanUserEmail && sEmail === cleanUserEmail) {
        isAllowed = true;
        matchedSales = sName;
      }
    }

    return { 
      isAllowed: isAllowed, 
      salesList: salesList, 
      matchedSales: matchedSales,
      debugError: isAllowed ? "" : "Email (" + cleanUserEmail + ") tidak cocok dengan daftar email di sheet."
    };

  } catch (e) {
    return { 
      isAllowed: false, 
      salesList: [], 
      matchedSales: "", 
      debugError: "Error Sistem Google Apps Script: " + e.toString() 
    };
  }
}

function getInitialData() {
  const activeEmail = Session.getActiveUser().getEmail();
  const salesInfo = getSalesData(activeEmail);
  const customers = getCustomerData();

  const categories = getSheetDataByHeader(CONFIG.CATEGORY.SPREADSHEET_ID, CONFIG.CATEGORY.SHEET_NAME, CONFIG.CATEGORY.COL_NAME);
  const cities = getSheetDataByHeader(CONFIG.CITY.SPREADSHEET_ID, CONFIG.CITY.SHEET_NAME, CONFIG.CITY.COL_NAME);

  return {
    companyName: CONFIG.GENERAL.COMPANY_NAME,
    userEmail: activeEmail,
    salesInfo: salesInfo,
    customers: customers,
    categories: categories,
    cities: cities,
    configStatus: {
      hasCategory: categories.length > 0,
      hasCity: cities.length > 0,
      hasPhoto: CONFIG.PHOTO.ENABLED
    }
  };
}

function submitOrderForm(formPayload) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.TARGET.SPREADSHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.TARGET.SHEET_NAME);
    if (!sheet) throw new Error("Sheet target '" + CONFIG.TARGET.SHEET_NAME + "' tidak ditemukan.");

    let photoUrl = "";

    if (formPayload.photoData && formPayload.photoName) {
      const folder = DriveApp.getFolderById(CONFIG.TARGET.FOLDER_DRIVE_ID);
      const blob = Utilities.newBlob(
        Utilities.base64Decode(formPayload.photoData.split(',')[1]),
        formPayload.photoMimeType || 'image/jpeg',
        formPayload.photoName
      );
      const file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      photoUrl = file.getUrl();
    }

    const timestamp = new Date();

    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

    const dataMap = {
      "Timestamp": timestamp,
      "Nama Sales": formPayload.salesName || "",
      "Kategori": formPayload.category || "",
      "No Pelanggan": formPayload.customerCodes || "",
      "No. Pelanggan.": formPayload.customerCodes || "",
      "No Pelanggan.": formPayload.customerCodes || "",
      "Nama Customer": formPayload.customerNames || "",
      "Kota Customer": formPayload.customerCity || "",
      "Foto Order": photoUrl
    };

    const rowData = headers.map(header => {
      const cleanHeader = String(header).replace(/\u00a0/g, " ").trim();
      return dataMap[cleanHeader] !== undefined ? dataMap[cleanHeader] : "";
    });

    sheet.appendRow(rowData);
    return { success: true, message: "Orderan berhasil disimpan!" };
  } catch (err) {
    return { success: false, message: "Gagal menyimpan: " + err.toString() };
  }
}
