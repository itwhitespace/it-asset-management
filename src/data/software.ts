export type AssignedUser = { name: string; email: string; department: string };

export type Software = {
  id: string;
  name: string;
  detail: string;
  seats: number;
  used: number;
  expiry: string;
  status: "Active" | "Warning" | "Expired";
  pricePerUnit: number; 
  type: "Back office" | "Designer";
  licenseType: "Monthly" | "Yearly";
  assignedUsers: AssignedUser[];
};

export const initialSoftware: Software[] = [
  // Back Office
  { 
    id: "SFT-BO-001", name: "Microsoft office 365", detail: "MS 365 Family 6 User/year", seats: 1, used: 1, expiry: "2026-06-15", status: "Active", pricePerUnit: 2450,
    type: "Back office", licenseType: "Yearly", assignedUsers: []
  },
  { 
    id: "SFT-BO-002", name: "Google Workspace", detail: "41 Account (38 active)", seats: 41, used: 38, expiry: "2026-03-10", status: "Active", pricePerUnit: 4350,
    type: "Back office", licenseType: "Yearly", assignedUsers: []
  },
  { 
    id: "SFT-BO-003", name: "Kinsta", detail: "word press hosting", seats: 1, used: 1, expiry: "2025-10-25", status: "Active", pricePerUnit: 22897,
    type: "Back office", licenseType: "Yearly", assignedUsers: []
  },
  { 
    id: "SFT-BO-004", name: "GoDaddy", detail: "brandrivendesign.com", seats: 1, used: 1, expiry: "2025-11-01", status: "Active", pricePerUnit: 692,
    type: "Back office", licenseType: "Yearly", assignedUsers: []
  },
  { 
    id: "SFT-BO-005", name: "Meta Workplace", detail: "12 Unit", seats: 12, used: 12, expiry: "2026-10-01", status: "Active", pricePerUnit: 65.42,
    type: "Back office", licenseType: "Monthly", assignedUsers: []
  },
  { 
    id: "SFT-BO-006", name: "CRM Monday.com", detail: "Standard Plan", seats: 12, used: 12, expiry: "2026-12-31", status: "Active", pricePerUnit: 3500,
    type: "Back office", licenseType: "Monthly", assignedUsers: []
  },
  
  // Designer
  { 
    id: "SFT-DS-001", name: "PDF Expert", detail: "1 Account", seats: 1, used: 1, expiry: "2026-08-10", status: "Active", pricePerUnit: 2900,
    type: "Designer", licenseType: "Yearly", assignedUsers: []
  },
  { 
    id: "SFT-DS-002", name: "Adobe Photoshop", detail: "5 Account", seats: 5, used: 5, expiry: "2026-05-15", status: "Active", pricePerUnit: 16900,
    type: "Designer", licenseType: "Yearly", assignedUsers: []
  },
  { 
    id: "SFT-DS-003", name: "Enscape", detail: "5 Account", seats: 5, used: 5, expiry: "2026-01-20", status: "Active", pricePerUnit: 8305.80,
    type: "Designer", licenseType: "Yearly", assignedUsers: []
  },
  { 
    id: "SFT-DS-004", name: "Sketchup Pro", detail: "7 Account", seats: 7, used: 7, expiry: "2026-04-10", status: "Active", pricePerUnit: 12000,
    type: "Designer", licenseType: "Yearly", assignedUsers: []
  },
  { 
    id: "SFT-DS-005", name: "Autodesk AutoCAD", detail: "Auto cad LT 26 Account", seats: 26, used: 26, expiry: "2026-06-01", status: "Active", pricePerUnit: 14300,
    type: "Designer", licenseType: "Yearly", assignedUsers: []
  }
];
