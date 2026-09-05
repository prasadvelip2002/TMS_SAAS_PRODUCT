"use client";

import { useEffect, useState, useRef } from "react";
import { fetchApi, getCustomerRates, bulkSyncCustomerRates, getCustomerRateContracts, deleteCustomerRate } from "@/lib/api";
import { ProtoTable, Td } from "@/components/PrototypeUI";
import { 
  Search, Grid, List, Plus, Users, UserPlus, X, Activity, 
  FileSpreadsheet, Download, Upload, Calendar, Truck, ArrowRight, 
  DollarSign, Trash2, CheckCircle2, Clock, MapPin, Building2, Filter
} from "lucide-react";
import * as XLSX from "xlsx";

interface Customer {
  id: number;
  name: string;
  gstin: string;
  address: string;
  contactPerson: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  pan: string;
  creditLimit: number;
  paymentTerms: string;
  code: string;
  rateContract: string;
  status: string;
  createdAt: string;
}

interface RateItem {
  id?: number;
  source: string;
  destination: string;
  vehicleType: string;
  rate: number;
  remarks?: string;
  status?: string;
}

interface MasterRateContract {
  id: number;
  customerId: number;
  customerName: string;
  customerCode: string;
  source: string;
  destination: string;
  vehicleType: string;
  rate: number;
  contractDuration: string;
  effectiveFrom: string;
  effectiveTo: string;
  remarks?: string;
  status: string;
  createdAt: string;
}

const VEHICLE_TYPE_OPTIONS = [
  "20 Ft Container",
  "32 Ft Single Axle (SXL)",
  "32 Ft Multi-Axle (MXL)",
  "10 Wheeler (16 Ton)",
  "12 Wheeler (20 Ton)",
  "14 Wheeler (25 Ton)",
  "20 Wheeler",
  "40 Ft Trailer",
  "Open Body Truck (32 Ft)",
  "LCV / 14 Ft",
  "Custom"
];

const DEFAULT_FORM = {
  id: 0,
  name: "",
  gstin: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  state: "",
  pan: "",
  creditLimit: 0,
  paymentTerms: "Net 30",
  contactPerson: "",
  code: "",
  rateContract: "",
  status: "Active",
  customerType: "Contract",
  contractDuration: "1 Year",
  effectiveFrom: new Date().toISOString().split("T")[0],
  effectiveTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
};

export default function ContractCustomersPage() {
  const [activeTab, setActiveTab] = useState<'directory' | 'rates'>('directory');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Master Rate Sheets state
  const [masterRates, setMasterRates] = useState<MasterRateContract[]>([]);
  const [isRatesLoading, setIsRatesLoading] = useState(false);
  const [rateSearch, setRateSearch] = useState("");
  const [rateCustomerFilter, setRateCustomerFilter] = useState<string>("All");
  const [rateVehicleFilter, setRateVehicleFilter] = useState<string>("All");

  // Form & Drawer state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [ratesList, setRatesList] = useState<RateItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRatesLoadingForCustomer, setIsRatesLoadingForCustomer] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [customerSearch, setCustomerSearch] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadCustomers = async () => {
    try {
      const data = await fetchApi("/Customers?customerType=Contract");
      setCustomers(data);
    } catch (error) {
      console.error("Failed to fetch customers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMasterRates = async () => {
    setIsRatesLoading(true);
    try {
      const data = await getCustomerRateContracts();
      setMasterRates(data);
    } catch (error) {
      console.error("Failed to load master rates:", error);
    } finally {
      setIsRatesLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
    loadMasterRates();
  }, []);

  // Update EffectiveTo date when duration changes
  const handleDurationChange = (duration: string) => {
    let years = 1;
    if (duration === "2 Years") years = 2;
    if (duration === "3 Years") years = 3;
    if (duration === "6 Months") {
      const d = new Date(formData.effectiveFrom || Date.now());
      d.setMonth(d.getMonth() + 6);
      setFormData({
        ...formData,
        contractDuration: duration,
        effectiveTo: d.toISOString().split("T")[0]
      });
      return;
    }
    
    const d = new Date(formData.effectiveFrom || Date.now());
    d.setFullYear(d.getFullYear() + years);
    setFormData({
      ...formData,
      contractDuration: duration,
      effectiveTo: d.toISOString().split("T")[0]
    });
  };

  // Add a blank rate row
  const handleAddRateRow = () => {
    setRatesList(prev => [
      ...prev,
      {
        source: "",
        destination: "",
        vehicleType: "20 Ft Container",
        rate: 0,
        remarks: ""
      }
    ]);
  };

  // Update a specific rate row field
  const handleRateRowChange = (index: number, field: keyof RateItem, value: any) => {
    setRatesList(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Remove a rate row
  const handleRemoveRateRow = (index: number) => {
    setRatesList(prev => prev.filter((_, i) => i !== index));
  };

  // Download Sample Excel Template
  const handleDownloadSampleTemplate = () => {
    const sampleData = [
      {
        "Source (Origin)": "Mumbai",
        "Destination": "Bangalore",
        "Vehicle Type": "20 Ft Container",
        "Rate (INR)": 28000,
        "Remarks": "Annual fixed rate contract"
      },
      {
        "Source (Origin)": "Mumbai",
        "Destination": "Bangalore",
        "Vehicle Type": "32 Ft Multi-Axle (MXL)",
        "Rate (INR)": 45000,
        "Remarks": "Toll extra at actuals"
      },
      {
        "Source (Origin)": "Delhi",
        "Destination": "Pune",
        "Vehicle Type": "10 Wheeler (16 Ton)",
        "Rate (INR)": 32000,
        "Remarks": ""
      },
      {
        "Source (Origin)": "Chennai",
        "Destination": "Hyderabad",
        "Vehicle Type": "20 Ft Container",
        "Rate (INR)": 22000,
        "Remarks": ""
      },
      {
        "Source (Origin)": "Chennai",
        "Destination": "Hyderabad",
        "Vehicle Type": "40 Ft Trailer",
        "Rate (INR)": 52000,
        "Remarks": "Heavy cargo agreement"
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "ContractRatesTemplate");
    XLSX.writeFile(workbook, "Contract_Rate_Sheet_Sample_Template.xlsx");
  };

  // Export Master Rates to Excel
  const handleExportMasterRates = () => {
    const exportData = filteredMasterRates.map(r => ({
      "Customer Name": r.customerName,
      "Customer Code": r.customerCode,
      "Source": r.source,
      "Destination": r.destination,
      "Vehicle Type": r.vehicleType,
      "Rate (INR)": r.rate,
      "Contract Duration": r.contractDuration,
      "Effective From": r.effectiveFrom ? r.effectiveFrom.split("T")[0] : "",
      "Effective To": r.effectiveTo ? r.effectiveTo.split("T")[0] : "",
      "Remarks": r.remarks || "",
      "Status": r.status
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "CustomerRates");
    XLSX.writeFile(wb, `Contract_Rates_Master_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  // Handle Excel Sheet Upload inside Form
  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const rawRows: any[] = XLSX.utils.sheet_to_json(ws);

        if (!rawRows || rawRows.length === 0) {
          alert("No data found in the uploaded spreadsheet.");
          return;
        }

        const parsedRates: RateItem[] = rawRows.map(row => {
          const source = row["Source (Origin)"] || row["Source"] || row["Origin"] || row["From"] || "";
          const destination = row["Destination"] || row["Dest"] || row["To"] || "";
          const vehicleType = row["Vehicle Type"] || row["VehicleType"] || row["Vehicle"] || "20 Ft Container";
          const rateVal = row["Rate (INR)"] || row["Rate"] || row["Price"] || row["Amount"] || 0;
          const remarks = row["Remarks"] || row["Notes"] || "";

          return {
            source: String(source).trim(),
            destination: String(destination).trim(),
            vehicleType: String(vehicleType).trim(),
            rate: Number(rateVal) || 0,
            remarks: String(remarks).trim()
          };
        }).filter(r => r.source && r.destination);

        if (parsedRates.length === 0) {
          alert("Could not find valid route columns. Please ensure columns include 'Source', 'Destination', 'Vehicle Type', and 'Rate'.");
          return;
        }

        setRatesList(prev => [...prev, ...parsedRates]);
        alert(`Successfully parsed and loaded ${parsedRates.length} rate rows from Excel! You can review them below before saving.`);
      } catch (err) {
        console.error("Error parsing Excel:", err);
        alert("Failed to parse Excel file. Please ensure it's a valid .xlsx or .csv file.");
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let savedCustomerId = formData.id;

      // Update rateContract display text
      const durationText = formData.contractDuration || "1 Year";
      const rateContractSummary = ratesList.length > 0 
        ? `${durationText} (${ratesList.length} Rates)`
        : `${durationText} Contract`;

      const payload = {
        ...formData,
        rateContract: rateContractSummary
      };

      if (formData.id > 0) {
        // Edit existing customer
        await fetchApi(`/Customers/${formData.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        // Create new customer
        const created = await fetchApi("/Customers", {
          method: "POST",
          body: JSON.stringify({ ...payload, id: undefined }),
        });
        if (created?.id) {
          savedCustomerId = created.id;
        }
      }

      // Sync customer rates
      if (savedCustomerId > 0) {
        await bulkSyncCustomerRates(savedCustomerId, {
          contractDuration: formData.contractDuration,
          effectiveFrom: formData.effectiveFrom,
          effectiveTo: formData.effectiveTo,
          rates: ratesList
        });
      }

      setFormData(DEFAULT_FORM);
      setRatesList([]);
      setIsFormOpen(false);
      loadCustomers();
      loadMasterRates();
    } catch (error) {
      console.error(error);
      alert("Failed to save customer and rate contracts.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (c: Customer) => {
    setFormData({
      id: c.id,
      name: c.name || "",
      gstin: c.gstin || "",
      phone: c.phone || "",
      email: c.email || "",
      address: c.address || "",
      city: c.city || "",
      state: c.state || "",
      pan: c.pan || "",
      creditLimit: c.creditLimit || 0,
      paymentTerms: c.paymentTerms || "Net 30",
      contactPerson: c.contactPerson || "",
      code: c.code || "",
      rateContract: c.rateContract || "",
      status: c.status || "Active",
      customerType: "Contract",
      contractDuration: c.rateContract?.includes("2 Year") ? "2 Years" : c.rateContract?.includes("3 Year") ? "3 Years" : "1 Year",
      effectiveFrom: new Date().toISOString().split("T")[0],
      effectiveTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    });

    setIsRatesLoadingForCustomer(true);
    setIsFormOpen(true);

    try {
      const rates = await getCustomerRates(c.id);
      if (rates && rates.length > 0) {
        setRatesList(rates.map((r: any) => ({
          id: r.id,
          source: r.source,
          destination: r.destination,
          vehicleType: r.vehicleType || "20 Ft Container",
          rate: r.rate,
          remarks: r.remarks || ""
        })));
        if (rates[0].contractDuration) {
          setFormData(prev => ({
            ...prev,
            contractDuration: rates[0].contractDuration,
            effectiveFrom: rates[0].effectiveFrom ? rates[0].effectiveFrom.split("T")[0] : prev.effectiveFrom,
            effectiveTo: rates[0].effectiveTo ? rates[0].effectiveTo.split("T")[0] : prev.effectiveTo,
          }));
        }
      } else {
        setRatesList([]);
      }
    } catch (err) {
      console.error("Failed to load customer rates:", err);
      setRatesList([]);
    } finally {
      setIsRatesLoadingForCustomer(false);
    }
  };

  const handleDeleteCustomer = async (id: number) => {
    if (!confirm("Are you sure you want to delete this customer? This will also remove associated rate contracts.")) return;
    try {
      await fetchApi(`/Customers/${id}`, { method: "DELETE" });
      loadCustomers();
      loadMasterRates();
    } catch (error) {
      alert("Failed to delete customer");
    }
  };

  const handleDeleteMasterRate = async (id: number) => {
    if (!confirm("Are you sure you want to delete this contract rate?")) return;
    try {
      await deleteCustomerRate(id);
      loadMasterRates();
      loadCustomers();
    } catch (err) {
      alert("Failed to delete rate contract.");
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === "Active") return <span className="px-[8px] py-[3px] bg-[#dcfce7] text-[#166534] rounded-[6px] text-[11px] font-medium border border-[#bbf7d0]">Active</span>;
    if (status === "Pending KYC") return <span className="px-[8px] py-[3px] bg-[#fef9c3] text-[#a16207] rounded-[6px] text-[11px] font-medium border border-[#fef08a]">Pending KYC</span>;
    if (status === "On Hold") return <span className="px-[8px] py-[3px] bg-[#fee2e2] text-[#991b1b] rounded-[6px] text-[11px] font-medium border border-[#fecaca]">On Hold</span>;
    return <span className="px-[8px] py-[3px] bg-gray-100 text-gray-700 rounded-[6px] text-[11px] font-medium border border-gray-200">{status || 'Draft'}</span>;
  };

  // Filtered customer list
  const filteredCustomers = customers.filter(c => {
    const q = customerSearch.toLowerCase();
    return (
      c.name?.toLowerCase().includes(q) ||
      c.code?.toLowerCase().includes(q) ||
      c.gstin?.toLowerCase().includes(q) ||
      c.city?.toLowerCase().includes(q)
    );
  });

  // Filtered master rates list
  const filteredMasterRates = masterRates.filter(r => {
    const q = rateSearch.toLowerCase();
    const matchesSearch = 
      r.customerName?.toLowerCase().includes(q) ||
      r.source?.toLowerCase().includes(q) ||
      r.destination?.toLowerCase().includes(q) ||
      r.vehicleType?.toLowerCase().includes(q);

    const matchesCustomer = rateCustomerFilter === "All" || r.customerId.toString() === rateCustomerFilter;
    const matchesVehicle = rateVehicleFilter === "All" || r.vehicleType === rateVehicleFilter;

    return matchesSearch && matchesCustomer && matchesVehicle;
  });

  // Unique route corridors
  const uniqueCorridors = new Set(masterRates.map(r => `${r.source} → ${r.destination}`)).size;
  const customersWithRatesCount = new Set(masterRates.map(r => r.customerId)).size;
  const avgRate = masterRates.length > 0
    ? Math.round(masterRates.reduce((acc, r) => acc + (Number(r.rate) || 0), 0) / masterRates.length)
    : 0;

  return (
    <div className="max-w-[1600px] mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Contract Customers & Rate Sheets</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Manage long-term annual contract accounts, vehicle-specific agreed pricing, and route rate sheets.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {activeTab === 'rates' && (
            <button
              onClick={handleExportMasterRates}
              className="bg-white hover:bg-slate-50 text-slate-700 font-semibold px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm transition-all flex items-center gap-2 text-sm"
            >
              <Download className="w-4 h-4 text-slate-500" />
              Export Rates
            </button>
          )}
          <button 
            onClick={() => { 
              setFormData(DEFAULT_FORM); 
              setRatesList([
                { source: "", destination: "", vehicleType: "20 Ft Container", rate: 0, remarks: "" }
              ]);
              setIsFormOpen(true); 
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-xl shadow-[0_4px_14px_rgba(37,99,235,0.25)] transition-all flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Contract Customer
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 mb-6">
        <button
          onClick={() => setActiveTab('directory')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'directory'
              ? 'border-blue-600 text-blue-600 bg-blue-50/40'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Customer Directory</span>
          <span className="ml-1.5 px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-600 font-mono">
            {customers.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('rates')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'rates'
              ? 'border-blue-600 text-blue-600 bg-blue-50/40'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Contract Rate Sheets</span>
          <span className="ml-1.5 px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700 font-mono">
            {masterRates.length}
          </span>
        </button>
      </div>

      {/* TAB 1: CUSTOMERS DIRECTORY */}
      {activeTab === 'directory' && (
        <>
          {/* Search & Toolbar */}
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200/50 p-2 mb-6 flex items-center justify-between">
            <div className="flex items-center px-4 gap-3 flex-1">
              <Search className="w-5 h-5 text-slate-400" />
              <input 
                type="text" 
                value={customerSearch}
                onChange={e => setCustomerSearch(e.target.value)}
                placeholder="Search customers by name, code, GSTIN, or city..." 
                className="w-full bg-transparent border-none focus:outline-none text-sm text-slate-700 font-medium placeholder:text-slate-400 py-2.5"
              />
            </div>
            <div className="flex items-center gap-2 pr-2">
              <button 
                onClick={() => setViewMode('grid')} 
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${
                  viewMode === 'grid' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'text-slate-500 border-transparent hover:bg-slate-50'
                }`}
              >
                <Grid className="w-4 h-4" /> Grid
              </button>
              <button 
                onClick={() => setViewMode('list')} 
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${
                  viewMode === 'list' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'text-slate-500 border-transparent hover:bg-slate-50'
                }`}
              >
                <List className="w-4 h-4" /> Table
              </button>
            </div>
          </div>

          {/* Main Content Area */}
          {isLoading ? (
            <div className="flex justify-center p-16">
              <Activity className="animate-spin text-blue-600 w-8 h-8" />
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-20 flex flex-col items-center justify-center text-center mt-2">
              <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-6">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">No customers found</h3>
              <p className="text-slate-500 text-[14.5px] mb-8 max-w-sm">
                {customerSearch ? "No customers match your search criteria." : "You haven't added any contract customers yet."}
              </p>
              <button 
                onClick={() => { 
                  setFormData(DEFAULT_FORM); 
                  setRatesList([{ source: "", destination: "", vehicleType: "20 Ft Container", rate: 0 }]);
                  setIsFormOpen(true); 
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-xl shadow-[0_4px_14px_rgba(37,99,235,0.25)] transition-all flex items-center gap-2"
              >
                <UserPlus className="w-5 h-5" />
                Add First Customer
              </button>
            </div>
          ) : viewMode === 'list' ? (
            <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200/50 overflow-hidden">
              <ProtoTable headers={["CODE", "CUSTOMER", "GSTIN", "RATE CONTRACT & DURATION", "STATUS", "ACTIONS"]}>
                {filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors cursor-pointer group" onClick={() => handleEdit(c)}>
                    <Td className="font-mono text-[12px]">{c.code || "—"}</Td>
                    <Td>
                      <div className="font-semibold text-slate-900">{c.name}</div>
                      <div className="text-xs text-slate-400">{c.city ? `${c.city}, ${c.state}` : ""}</div>
                    </Td>
                    <Td className="font-mono text-[12px]">{c.gstin || "—"}</Td>
                    <Td>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold border border-blue-100">
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        <span>{c.rateContract || "Draft"}</span>
                      </div>
                    </Td>
                    <Td>{getStatusBadge(c.status)}</Td>
                    <Td>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEdit(c); }}
                          className="text-blue-600 hover:text-blue-800 text-xs font-semibold"
                        >
                          Manage Rates
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeleteCustomer(c.id); }}
                          className="text-slate-400 hover:text-red-600 text-[12px] font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Delete
                        </button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </ProtoTable>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredCustomers.map((c) => (
                <div key={c.id} onClick={() => handleEdit(c)} className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg transition-all cursor-pointer group relative flex flex-col h-full overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg line-clamp-1">{c.name}</h3>
                      <p className="text-xs font-mono text-slate-500 mt-1">{c.code || "NO-CODE"}</p>
                    </div>
                    {getStatusBadge(c.status)}
                  </div>
                  
                  <div className="flex-1 space-y-3 mb-6 mt-2">
                    <div className="flex items-center text-sm text-slate-600">
                      <div className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center mr-3 border border-slate-100"><span className="text-[10px]">🏢</span></div>
                      <span className="truncate">{c.city ? `${c.city}, ${c.state}` : 'No Address Info'}</span>
                    </div>
                    <div className="flex items-center text-sm text-slate-600">
                      <div className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center mr-3 border border-slate-100"><span className="text-[10px]">📞</span></div>
                      <span>{c.phone || 'No Phone'}</span>
                    </div>
                    <div className="flex items-center text-sm text-slate-600">
                      <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center mr-3 border border-blue-100 text-blue-600"><FileSpreadsheet className="w-3.5 h-3.5" /></div>
                      <span className="text-xs font-medium text-blue-700">{c.rateContract || "Draft"}</span>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-auto">
                    <div>
                      <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">GSTIN</div>
                      <div className="text-xs font-mono font-medium text-slate-700">{c.gstin || 'N/A'}</div>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteCustomer(c.id); }}
                      className="text-slate-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* TAB 2: CONTRACT RATE SHEETS (MASTER VIEW) */}
      {activeTab === 'rates' && (
        <div className="space-y-6">
          {/* KPI Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Active Rates</p>
                <h3 className="text-2xl font-black text-slate-900 mt-1">{masterRates.length}</h3>
                <p className="text-xs text-slate-400 mt-0.5">Route & vehicle combinations</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Contract Customers</p>
                <h3 className="text-2xl font-black text-slate-900 mt-1">{customersWithRatesCount}</h3>
                <p className="text-xs text-slate-400 mt-0.5">With configured rate sheets</p>
              </div>
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Unique Corridors</p>
                <h3 className="text-2xl font-black text-slate-900 mt-1">{uniqueCorridors}</h3>
                <p className="text-xs text-slate-400 mt-0.5">Source → Destination routes</p>
              </div>
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <MapPin className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Average Rate</p>
                <h3 className="text-2xl font-black text-slate-900 mt-1">₹{avgRate.toLocaleString()}</h3>
                <p className="text-xs text-slate-400 mt-0.5">Per contracted trip</p>
              </div>
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200/50 p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center px-3 gap-3 flex-1 w-full bg-slate-50 rounded-xl border border-slate-200">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={rateSearch}
                onChange={e => setRateSearch(e.target.value)}
                placeholder="Search by customer, origin city, destination, or vehicle type..."
                className="w-full bg-transparent border-none focus:outline-none text-sm text-slate-700 font-medium py-2.5 placeholder:text-slate-400"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              {/* Customer Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  value={rateCustomerFilter}
                  onChange={e => setRateCustomerFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500"
                >
                  <option value="All">All Customers</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id.toString()}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Vehicle Type Filter */}
              <select
                value={rateVehicleFilter}
                onChange={e => setRateVehicleFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500"
              >
                <option value="All">All Vehicle Types</option>
                {VEHICLE_TYPE_OPTIONS.map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Master Rates Table */}
          {isRatesLoading ? (
            <div className="flex justify-center p-16">
              <Activity className="animate-spin text-blue-600 w-8 h-8" />
            </div>
          ) : filteredMasterRates.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-16 text-center">
              <FileSpreadsheet className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-800">No contract rates found</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
                {rateSearch || rateCustomerFilter !== "All" || rateVehicleFilter !== "All"
                  ? "No rates match your filters. Try resetting the filters."
                  : "Start by creating contract customers and configuring their agreed route rates or uploading an Excel sheet."}
              </p>
              <button
                onClick={() => {
                  setFormData(DEFAULT_FORM);
                  setRatesList([{ source: "", destination: "", vehicleType: "20 Ft Container", rate: 0 }]);
                  setIsFormOpen(true);
                }}
                className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold shadow-sm hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" /> Add Rates
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200/50 overflow-hidden">
              <ProtoTable headers={["CUSTOMER", "CORRIDOR / ROUTE", "VEHICLE TYPE", "AGREED RATE (₹)", "CONTRACT DURATION", "VALIDITY PERIOD", "STATUS", "ACTIONS"]}>
                {filteredMasterRates.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors group">
                    <Td>
                      <div className="font-semibold text-slate-900">{r.customerName}</div>
                      <div className="text-[11px] font-mono text-slate-400">{r.customerCode || "—"}</div>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-2 font-medium text-slate-800 text-sm">
                        <span>{r.source}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span>{r.destination}</span>
                      </div>
                      {r.remarks && <div className="text-[11px] text-slate-400 mt-0.5">{r.remarks}</div>}
                    </Td>
                    <Td>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold">
                        <Truck className="w-3.5 h-3.5 text-slate-500" />
                        <span>{r.vehicleType}</span>
                      </div>
                    </Td>
                    <Td className="font-mono text-sm font-bold text-slate-900">
                      ₹{Number(r.rate).toLocaleString()}
                    </Td>
                    <Td>
                      <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-semibold border border-indigo-100">
                        {r.contractDuration || "1 Year"}
                      </span>
                    </Td>
                    <Td className="text-xs text-slate-500 font-mono">
                      {r.effectiveFrom ? r.effectiveFrom.split("T")[0] : "—"} to {r.effectiveTo ? r.effectiveTo.split("T")[0] : "—"}
                    </Td>
                    <Td>{getStatusBadge(r.status)}</Td>
                    <Td>
                      <button
                        onClick={() => handleDeleteMasterRate(r.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete Rate"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </Td>
                  </tr>
                ))}
              </ProtoTable>
            </div>
          )}
        </div>
      )}

      {/* Slide-over Form Panel (Add / Edit Customer + Contract Rates) */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsFormOpen(false)} 
          />
          
          {/* Slide-over Panel (Wide drawer for comfortable rate sheet management) */}
          <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out border-l border-slate-200">
             {/* Form Header */}
             <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
               <div>
                 <h3 className="font-bold text-lg text-slate-900 tracking-tight">
                   {formData.id > 0 ? "Edit Contract Customer & Rates" : "New Contract Customer & Rate Agreement"}
                 </h3>
                 <p className="text-[13px] font-medium text-slate-500 mt-0.5">
                   Configure customer credentials, contract tenure (1/2 years), and vehicle pricing sheet.
                 </p>
               </div>
               <button 
                 onClick={() => setIsFormOpen(false)} 
                 className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
               >
                 <X className="w-5 h-5" />
               </button>
             </div>
             
             {/* Form Body - Scrollable */}
             <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
               <form id="customerForm" onSubmit={handleSubmit} className="space-y-6">
                  {/* Section 1: Customer Profile */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-blue-600" />
                      <span>1. Customer Profile</span>
                    </h4>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-[11.5px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                          Customer Name *
                        </label>
                        <input 
                          required 
                          value={formData.name} 
                          onChange={e => setFormData({...formData, name: e.target.value})} 
                          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-800 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm" 
                          placeholder="e.g. Tata Steel Ltd / Reliance Retail" 
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11.5px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Customer Code</label>
                          <input 
                            value={formData.code} 
                            onChange={e => setFormData({...formData, code: e.target.value})} 
                            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-800 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm font-mono" 
                            placeholder="e.g. CUST-001" 
                          />
                        </div>
                        <div>
                          <label className="block text-[11.5px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Account Status</label>
                          <select 
                            value={formData.status} 
                            onChange={e => setFormData({...formData, status: e.target.value})} 
                            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-800 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                          >
                            <option value="Active">Active</option>
                            <option value="Pending KYC">Pending KYC</option>
                            <option value="On Hold">On Hold</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11.5px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">GSTIN *</label>
                          <input 
                            required 
                            value={formData.gstin} 
                            onChange={e => setFormData({...formData, gstin: e.target.value})} 
                            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-800 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm font-mono" 
                            placeholder="29AAACH1234D1Z5" 
                          />
                        </div>
                        <div>
                          <label className="block text-[11.5px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">PAN</label>
                          <input 
                            value={formData.pan} 
                            onChange={e => setFormData({...formData, pan: e.target.value})} 
                            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-800 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm font-mono uppercase" 
                            placeholder="AAACH1234D" 
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11.5px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Phone *</label>
                          <input 
                            required 
                            value={formData.phone} 
                            onChange={e => setFormData({...formData, phone: e.target.value})} 
                            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-800 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm" 
                            placeholder="Phone number" 
                          />
                        </div>
                        <div>
                          <label className="block text-[11.5px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Contact Person</label>
                          <input 
                            value={formData.contactPerson} 
                            onChange={e => setFormData({...formData, contactPerson: e.target.value})} 
                            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-800 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm" 
                            placeholder="e.g. Rahul Sharma" 
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11.5px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">City</label>
                          <input 
                            value={formData.city} 
                            onChange={e => setFormData({...formData, city: e.target.value})} 
                            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-800 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm" 
                            placeholder="e.g. Mumbai" 
                          />
                        </div>
                        <div>
                          <label className="block text-[11.5px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">State</label>
                          <input 
                            value={formData.state} 
                            onChange={e => setFormData({...formData, state: e.target.value})} 
                            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-800 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm" 
                            placeholder="e.g. Maharashtra" 
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11.5px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Credit Limit (₹)</label>
                          <input 
                            type="number" 
                            value={formData.creditLimit} 
                            onChange={e => setFormData({...formData, creditLimit: Number(e.target.value)})} 
                            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-800 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm" 
                            placeholder="e.g. 500000" 
                          />
                        </div>
                        <div>
                          <label className="block text-[11.5px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Payment Terms</label>
                          <select 
                            value={formData.paymentTerms} 
                            onChange={e => setFormData({...formData, paymentTerms: e.target.value})} 
                            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-800 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                          >
                            <option value="Immediate">Immediate</option>
                            <option value="Net 15">Net 15</option>
                            <option value="Net 30">Net 30</option>
                            <option value="Net 45">Net 45</option>
                            <option value="Net 60">Net 60</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  <hr className="border-slate-200" />

                  {/* Section 2: Contract Agreement & Validity */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-indigo-600" />
                      <span>2. Contract Duration & Period</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[11.5px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                          Contract Duration *
                        </label>
                        <select
                          value={formData.contractDuration}
                          onChange={e => handleDurationChange(e.target.value)}
                          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-800 font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                        >
                          <option value="1 Year">1 Year Contract</option>
                          <option value="2 Years">2 Years Contract</option>
                          <option value="3 Years">3 Years Contract</option>
                          <option value="6 Months">6 Months Contract</option>
                          <option value="Custom">Custom Period</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11.5px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                          Effective From *
                        </label>
                        <input
                          type="date"
                          required
                          value={formData.effectiveFrom}
                          onChange={e => setFormData({...formData, effectiveFrom: e.target.value})}
                          className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-800 font-medium outline-none focus:border-blue-500 transition-all shadow-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-[11.5px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                          Effective To *
                        </label>
                        <input
                          type="date"
                          required
                          value={formData.effectiveTo}
                          onChange={e => setFormData({...formData, effectiveTo: e.target.value})}
                          className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm bg-slate-50 hover:bg-slate-100 focus:bg-white text-slate-800 font-medium outline-none focus:border-blue-500 transition-all shadow-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <hr className="border-slate-200" />

                  {/* Section 3: Route & Vehicle Rate Sheet */}
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                      <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                          <span>3. Route & Vehicle Rate Sheet</span>
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Set vehicle-specific prices for each route (e.g. 20 Ft @ ₹28,000, 32 Ft MXL @ ₹45,000).
                        </p>
                      </div>

                      {/* Excel Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleDownloadSampleTemplate}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-200 transition-colors"
                          title="Download Excel format template"
                        >
                          <Download className="w-3.5 h-3.5 text-slate-500" />
                          <span>Sample Template</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-emerald-200 transition-colors"
                        >
                          <Upload className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Upload Excel</span>
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".xlsx, .xls, .csv"
                          onChange={handleExcelUpload}
                          className="hidden"
                        />
                      </div>
                    </div>

                    {/* Rate Rows Table / Editor */}
                    {isRatesLoadingForCustomer ? (
                      <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
                        <Activity className="w-5 h-5 text-blue-600 animate-spin mx-auto mb-2" />
                        <span className="text-xs text-slate-500">Loading customer rate agreement...</span>
                      </div>
                    ) : ratesList.length === 0 ? (
                      <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-8 text-center">
                        <p className="text-xs text-slate-500 mb-3">
                          No rates configured yet. Add vehicle rates manually or upload an Excel file.
                        </p>
                        <button
                          type="button"
                          onClick={handleAddRateRow}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add First Route Rate</span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-3">
                          {ratesList.map((row, idx) => (
                            <div key={idx} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm relative group space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                  Rate Item #{idx + 1}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveRateRow(idx)}
                                  className="text-slate-400 hover:text-red-500 p-1 rounded-md hover:bg-red-50 transition-colors"
                                  title="Remove row"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Source / Origin *</label>
                                  <input
                                    required
                                    value={row.source}
                                    onChange={e => handleRateRowChange(idx, "source", e.target.value)}
                                    placeholder="e.g. Mumbai / Taloja MIDC"
                                    className="w-full mt-1 px-3 py-1.5 text-xs bg-slate-50 rounded-lg border border-slate-200 focus:bg-white focus:border-blue-500 outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Destination *</label>
                                  <input
                                    required
                                    value={row.destination}
                                    onChange={e => handleRateRowChange(idx, "destination", e.target.value)}
                                    placeholder="e.g. Bangalore / Peenya"
                                    className="w-full mt-1 px-3 py-1.5 text-xs bg-slate-50 rounded-lg border border-slate-200 focus:bg-white focus:border-blue-500 outline-none"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Vehicle Type *</label>
                                  <select
                                    value={row.vehicleType}
                                    onChange={e => handleRateRowChange(idx, "vehicleType", e.target.value)}
                                    className="w-full mt-1 px-3 py-1.5 text-xs bg-slate-50 rounded-lg border border-slate-200 focus:bg-white focus:border-blue-500 outline-none font-medium"
                                  >
                                    {VEHICLE_TYPE_OPTIONS.map(v => (
                                      <option key={v} value={v}>{v}</option>
                                    ))}
                                  </select>
                                </div>

                                <div>
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Agreed Rate (₹) *</label>
                                  <div className="relative mt-1">
                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">₹</span>
                                    <input
                                      type="number"
                                      required
                                      value={row.rate || ""}
                                      onChange={e => handleRateRowChange(idx, "rate", Number(e.target.value))}
                                      placeholder="e.g. 28000"
                                      className="w-full pl-6 pr-3 py-1.5 text-xs bg-slate-50 rounded-lg border border-slate-200 focus:bg-white focus:border-blue-500 outline-none font-mono font-bold text-slate-800"
                                    />
                                  </div>
                                </div>
                              </div>

                              <div>
                                <input
                                  value={row.remarks || ""}
                                  onChange={e => handleRateRowChange(idx, "remarks", e.target.value)}
                                  placeholder="Notes / terms (optional, e.g. Toll included)"
                                  className="w-full px-3 py-1 text-[11px] bg-slate-50 rounded-lg border border-slate-200 focus:bg-white focus:border-blue-500 outline-none text-slate-600"
                                />
                              </div>
                            </div>
                          ))}
                        </div>

                        <button
                          type="button"
                          onClick={handleAddRateRow}
                          className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition-colors flex items-center justify-center gap-2"
                        >
                          <Plus className="w-4 h-4 text-slate-500" />
                          <span>+ Add Another Vehicle Rate</span>
                        </button>
                      </div>
                    )}
                  </div>
               </form>
             </div>
             
             {/* Form Footer */}
             <div className="p-6 border-t border-slate-100 bg-white">
               <button 
                 type="submit" 
                 form="customerForm" 
                 disabled={isSubmitting}
                 className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-[0_4px_14px_rgba(37,99,235,0.25)] transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
               >
                 {isSubmitting ? (
                   <><Activity className="w-5 h-5 mr-2 animate-spin" /> Saving Customer & Rates...</>
                 ) : (
                   formData.id > 0 ? "Update Customer & Rate Sheet" : "Save Contract Customer & Rate Sheet"
                 )}
               </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
