export type Computer = {
  id: string;
  computerName: string;
  model: string;
  user: string;
  department: string;
  company: "Whitespace Partners" | "Whitespace Connect";
  status: "Active" | "Available";
  type: "Laptop" | "Desktop" | "MacOS";
  os: string;
  osKey: string;
  serialNo: string;
  macAddress: string;
  mainBoard: string;
  cpu: string;
  ram: string;
  gpu: string;
  hdd: string;
  warranty: string;
  purchaseDate: string;
  price: string;
};

export const initialComputers: Computer[] = [
  { id: "MAC-001", computerName: "MAC-DESIGN-01", model: "MacBook Pro 16\"", user: "Sarah Jenkins", department: "Design", company: "Whitespace Partners", status: "Active", type: "Laptop", os: "macOS 14.2", osKey: "Built-in", serialNo: "C02DG4B5Q6L5", macAddress: "00:1B:44:11:3A:B7", mainBoard: "Apple Logic Board", cpu: "Apple M3 Max", ram: "36GB Unified", gpu: "Apple 40-core GPU", hdd: "1TB SSD", warranty: "2027-01-15", purchaseDate: "2024-01-15", price: "129,900" },
  { id: "MAC-002", computerName: "MAC-ENG-02", model: "MacBook Air M2", user: "John Doe", department: "Engineering", company: "Whitespace Connect", status: "Active", type: "Laptop", os: "macOS 14.2", osKey: "Built-in", serialNo: "C02DG4B5Q6L6", macAddress: "00:1B:44:11:3A:B8", mainBoard: "Apple Logic Board", cpu: "Apple M2", ram: "16GB Unified", gpu: "Apple 10-core GPU", hdd: "512GB SSD", warranty: "2026-06-10", purchaseDate: "2023-06-10", price: "43,900" },
  { id: "WIN-042", computerName: "WIN-ENG-42", model: "Dell XPS 15", user: "Michael Chen", department: "Engineering", company: "Whitespace Partners", status: "Available", type: "Laptop", os: "Windows 11 Pro", osKey: "W269N-WFGWX-YVC9B-4J6C9-T83GX", serialNo: "DP7G3F2", macAddress: "F8:B1:56:A1:2C:99", mainBoard: "Dell 0K5CV3", cpu: "Intel Core i9-13900H", ram: "32GB DDR5", gpu: "NVIDIA RTX 4070", hdd: "1TB NVMe SSD", warranty: "2025-11-20", purchaseDate: "2022-11-20", price: "85,900" },
  { id: "MAC-003", computerName: "MAC-MKT-03", model: "iMac 24\"", user: "Alice Wong", department: "Marketing", company: "Whitespace Connect", status: "Active", type: "Desktop", os: "macOS 14.2", osKey: "Built-in", serialNo: "C02DG4B5Q6L7", macAddress: "00:1B:44:11:3A:B9", mainBoard: "Apple Logic Board", cpu: "Apple M3", ram: "16GB Unified", gpu: "Apple 10-core GPU", hdd: "512GB SSD", warranty: "2027-02-10", purchaseDate: "2024-02-10", price: "56,900" },
];
