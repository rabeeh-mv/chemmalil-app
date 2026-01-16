"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db, auth } from "@/app/lib/firebase";
import { collection, getDocs, doc, updateDoc, deleteDoc, addDoc } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  Home, Users, LogOut, Download, FileText,
  Sheet, Search, Edit, Trash2, X, Check, ArrowUpDown
} from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

interface Member {
  fullName: string;
  surname: string;
  fatherName: string;
  motherName: string;
  aadhaar: string;
  phone: string;
  dob: string;
}

interface FamilyData {
  id: string;
  houseName: string;
  familyName: string;
  location: string;
  roadName: string;
  address: string;
  members: Member[];
  primaryMember: {
    name: string;
    phone: string;
    whatsapp: string;
  };
  totalMembers: number;
  createdAt: string;
  registrationDate: string;
}

interface UnitData {
  id: string; // Document ID (usually House ID)
  houseId: string;
  houseName: string;
  guardianName: string;
  guardianDob: string;
  guardianAadhaarLast4: string;
  members: { member_id: string; name: string }[];
  obligations?: { subcollection: string; amount: string | number }[];
}

interface UnitData {
  id: string; // Document ID (usually House ID)
  houseId: string;
  houseName: string;
  guardianName: string;
  guardianDob: string;
  guardianAadhaarLast4: string;
  members: { member_id: string; name: string }[];
  obligations?: { subcollection: string; amount: string | number }[];
}

interface AreaAccount {
  id: string;
  area: string;
  headPersonName: string;
  password: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [families, setFamilies] = useState<FamilyData[]>([]);
  const [filteredFamilies, setFilteredFamilies] = useState<FamilyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"familyName" | "location" | "createdAt">("familyName");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [editingFamily, setEditingFamily] = useState<FamilyData | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Units State
  const [activeTab, setActiveTab] = useState<"families" | "units" | "areas">("families");
  const [units, setUnits] = useState<UnitData[]>([]);
  const [filteredUnits, setFilteredUnits] = useState<UnitData[]>([]);
  const [unitsLoading, setUnitsLoading] = useState(true);
  const [unitSearchTerm, setUnitSearchTerm] = useState("");

  // Area Accounts State
  const [areaAccounts, setAreaAccounts] = useState<AreaAccount[]>([]);
  const [newArea, setNewArea] = useState({ area: "", headPersonName: "", password: "" });
  const [areaLoading, setAreaLoading] = useState(false);

  // Auth check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/admin/login");
      }
    });
    return () => unsubscribe();
  }, [router]);

  // Fetch families data
  useEffect(() => {
    fetchFamilies();
    fetchUnits();
    fetchAreas();
  }, []);

  // Filter Units
  useEffect(() => {
    let filtered = units.filter((unit) => {
      const searchLower = unitSearchTerm.toLowerCase();
      return (
        (unit.houseName || "").toLowerCase().includes(searchLower) ||
        (unit.guardianName || "").toLowerCase().includes(searchLower) ||
        (unit.houseId || "").toLowerCase().includes(searchLower)
      );
    });
    setFilteredUnits(filtered);
  }, [unitSearchTerm, units]);

  // Filter and sort
  useEffect(() => {
    let filtered = families.filter((family) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        family.familyName.toLowerCase().includes(searchLower) ||
        family.houseName.toLowerCase().includes(searchLower) ||
        family.location.toLowerCase().includes(searchLower) ||
        family.primaryMember.name.toLowerCase().includes(searchLower)
      );
    });

    filtered.sort((a, b) => {
      let aValue: string | number = a[sortBy];
      let bValue: string | number = b[sortBy];

      if (sortBy === "createdAt") {
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    setFilteredFamilies(filtered);
  }, [searchTerm, families, sortBy, sortOrder]);

  const fetchFamilies = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "families"));
      const data: FamilyData[] = [];
      querySnapshot.forEach((doc) => {
        const docData = doc.data();
        // Fallback for missing primaryMember
        let primary = docData.primaryMember;
        if (!primary) {
          if (docData.members && docData.members.length > 0) {
            // Try to find guardian, otherwise use first member
            const guardian = docData.members.find((m: any) => m.isGuardian) || docData.members[0];
            primary = {
              name: guardian.fullName || guardian.name || "Unknown",
              phone: guardian.phone || "",
              whatsapp: guardian.whatsapp || ""
            };
          } else {
            primary = { name: "Unknown", phone: "", whatsapp: "" };
          }
        }

        data.push({ id: doc.id, ...docData, primaryMember: primary } as FamilyData);
      });
      setFamilies(data);
    } catch (error) {
      console.error("Error fetching families:", error);
      toast.error("Failed to load families data");
    } finally {
      setLoading(false);
    }
  };

  const fetchUnits = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "units"));
      const data: UnitData[] = [];
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as UnitData);
      });
      setUnits(data);
    } catch (error) {
      console.error("Error fetching units:", error);
      toast.error("Failed to load synced units data");
    } finally {
      setUnitsLoading(false);
    }
  };

  const fetchAreas = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "area_accounts"));
      const data: AreaAccount[] = [];
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as AreaAccount);
      });
      setAreaAccounts(data);
    } catch (error) {
      console.error("Error fetching areas:", error);
      toast.error("Failed to load area accounts");
    }
  };

  const handleAddArea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newArea.area || !newArea.headPersonName || !newArea.password) {
      toast.error("All fields are required");
      return;
    }

    setAreaLoading(true);
    try {
      await addDoc(collection(db, "area_accounts"), newArea);
      toast.success("Area Account added successfully");
      setNewArea({ area: "", headPersonName: "", password: "" });
      fetchAreas();
    } catch (error) {
      console.error("Error adding area:", error);
      toast.error("Failed to add area account");
    } finally {
      setAreaLoading(false);
    }
  };

  const handleDeleteArea = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the account for ${name}?`)) return;
    try {
      await deleteDoc(doc(db, "area_accounts", id));
      toast.success("Area Account deleted");
      fetchAreas();
    } catch (error) {
      console.error("Error deleting area:", error);
      toast.error("Failed to delete area account");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/admin/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleSort = (field: "familyName" | "location" | "createdAt") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const handleEdit = (family: FamilyData) => {
    setEditingFamily(family);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingFamily) return;

    try {
      const familyRef = doc(db, "families", editingFamily.id);
      await updateDoc(familyRef, {
        houseName: editingFamily.houseName,
        familyName: editingFamily.familyName,
        location: editingFamily.location,
        roadName: editingFamily.roadName,
        address: editingFamily.address,
        primaryMember: editingFamily.primaryMember,
      });

      toast.success("Family updated successfully!");
      setShowEditModal(false);
      fetchFamilies();
    } catch (error) {
      console.error("Error updating family:", error);
      toast.error("Failed to update family");
    }
  };

  const handleDelete = async (id: string, familyName: string) => {
    if (!confirm(`Are you sure you want to delete ${familyName}?`)) return;

    try {
      await deleteDoc(doc(db, "families", id));
      toast.success("Family deleted successfully!");
      fetchFamilies();
    } catch (error) {
      console.error("Error deleting family:", error);
      toast.error("Failed to delete family");
    }
  };

  const handleDeleteUnit = async (id: string) => {
    if (!confirm("Are you sure you want to delete this synced unit? This will only remove it from the dashboard, not the desktop app source.")) return;
    try {
      await deleteDoc(doc(db, "units", id));
      toast.success("Unit deleted successfully");
      fetchUnits();
    } catch (e) {
      console.error("Error deleting unit", e);
      toast.error("Failed to delete unit");
    }
  };

  const exportToPDF = () => {
    const pdf = new jsPDF();

    pdf.setFontSize(18);
    pdf.text("Masjid Family Registration Data", 14, 22);

    pdf.setFontSize(11);
    pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

    const tableData = filteredFamilies.map((family) => [
      family.familyName,
      family.houseName,
      family.location,
      family.totalMembers.toString(),
      family.primaryMember.name,
      family.primaryMember.phone,
      family.registrationDate,
    ]);

    autoTable(pdf, {
      head: [["Family Name", "House Name", "Location", "Members", "Contact Person", "Phone", "Reg. Date"]],
      body: tableData,
      startY: 35,
      theme: "striped",
      headStyles: { fillColor: [16, 185, 129] },
    });

    pdf.save(`families_${new Date().toISOString().split("T")[0]}.pdf`);
    toast.success("PDF exported successfully!");
  };

  const exportToExcel = () => {
    const excelData = filteredFamilies.map((family) => ({
      "Family Name": family.familyName,
      "House Name": family.houseName,
      "Location": family.location,
      "Road Name": family.roadName,
      "Address": family.address,
      "Total Members": family.totalMembers,
      "Primary Contact": family.primaryMember.name,
      "Phone": family.primaryMember.phone,
      "WhatsApp": family.primaryMember.whatsapp,
      "Registration Date": family.registrationDate,
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Families");

    XLSX.writeFile(workbook, `families_${new Date().toISOString().split("T")[0]}.xlsx`);
    toast.success("Excel file exported successfully!");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Home className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Admin Dashboard
                </h1>
                <p className="text-xs text-gray-500">Family Management</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-8 bg-blue-100 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab("families")}
            className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === "families"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-blue-600 hover:bg-blue-200"
              }`}
          >
            Web Registrations
          </button>
          <button
            onClick={() => setActiveTab("units")}
            className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === "units"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-blue-600 hover:bg-blue-200"
              }`}
          >
            Synced Units
          </button>
          <button
            onClick={() => setActiveTab("areas")}
            className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === "areas"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-blue-600 hover:bg-blue-200"
              }`}
          >
            Area Controllers
          </button>
        </div>

        {activeTab === "families" && (
          <>
            {/* Stats Cards */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Families</p>
                    <p className="text-3xl font-bold text-blue-600">{families.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Home className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Members</p>
                    <p className="text-3xl font-bold text-emerald-600">
                      {families.reduce((sum, f) => sum + f.totalMembers, 0)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Average Members/Family</p>
                    <p className="text-3xl font-bold text-purple-600">
                      {families.length > 0
                        ? (families.reduce((sum, f) => sum + f.totalMembers, 0) / families.length).toFixed(1)
                        : 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="bg-white rounded-xl p-6 shadow-lg mb-6">
              <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search families..."
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {/* Export Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={exportToPDF}
                    className="flex items-center gap-2 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                  >
                    <FileText className="w-4 h-4" />
                    Export PDF
                  </button>
                  <button
                    onClick={exportToExcel}
                    className="flex items-center gap-2 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                  >
                    <Sheet className="w-4 h-4" />
                    Export Excel
                  </button>
                </div>
              </div>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                    <tr>
                      <th className="px-6 py-4 text-left">
                        <button
                          onClick={() => handleSort("familyName")}
                          className="flex items-center gap-2 hover:text-blue-200 transition"
                        >
                          Family Name
                          <ArrowUpDown className="w-4 h-4" />
                        </button>
                      </th>
                      <th className="px-6 py-4 text-left">House Name</th>
                      <th className="px-6 py-4 text-left">
                        <button
                          onClick={() => handleSort("location")}
                          className="flex items-center gap-2 hover:text-blue-200 transition"
                        >
                          Location
                          <ArrowUpDown className="w-4 h-4" />
                        </button>
                      </th>
                      <th className="px-6 py-4 text-left">Members</th>
                      <th className="px-6 py-4 text-left">Contact Person</th>
                      <th className="px-6 py-4 text-left">Phone</th>
                      <th className="px-6 py-4 text-left">
                        <button
                          onClick={() => handleSort("createdAt")}
                          className="flex items-center gap-2 hover:text-blue-200 transition"
                        >
                          Reg. Date
                          <ArrowUpDown className="w-4 h-4" />
                        </button>
                      </th>
                      <th className="px-6 py-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredFamilies.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                          No families found
                        </td>
                      </tr>
                    ) : (
                      filteredFamilies.map((family) => (
                        <tr key={family.id} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4 font-medium text-gray-900">{family.familyName}</td>
                          <td className="px-6 py-4 text-gray-600">{family.houseName}</td>
                          <td className="px-6 py-4 text-gray-600">{family.location}</td>
                          <td className="px-6 py-4">
                            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                              {family.totalMembers}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-600">{family.primaryMember.name}</td>
                          <td className="px-6 py-4 text-gray-600">{family.primaryMember.phone}</td>
                          <td className="px-6 py-4 text-gray-600">{family.registrationDate}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleEdit(family)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(family.id, family.familyName)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === "units" && (
          <>
            {/* Units View */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Synced Units</p>
                    <p className="text-3xl font-bold text-indigo-600">{units.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <Home className="w-6 h-6 text-indigo-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="bg-white rounded-xl p-6 shadow-lg mb-6">
              <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search units..."
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    value={unitSearchTerm}
                    onChange={(e) => setUnitSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Units Table */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                    <tr>
                      <th className="px-6 py-4 text-left">House ID</th>
                      <th className="px-6 py-4 text-left">House Name</th>
                      <th className="px-6 py-4 text-left">Guardian</th>
                      <th className="px-6 py-4 text-left">Members</th>
                      <th className="px-6 py-4 text-left">Obligations (Pending)</th>
                      <th className="px-6 py-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredUnits.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                          No units found
                        </td>
                      </tr>
                    ) : (
                      filteredUnits.map((unit) => (
                        <tr key={unit.id} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4 font-medium text-gray-900">{unit.houseId || unit.id}</td>
                          <td className="px-6 py-4 text-gray-600">{unit.houseName}</td>
                          <td className="px-6 py-4 text-gray-600">
                            <div>{unit.guardianName}</div>
                            <div className="text-xs text-gray-400">DOB: {unit.guardianDob || 'N/A'}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                              {unit.members ? unit.members.length : 0}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {unit.obligations && unit.obligations.length > 0 ? (
                              <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                                {unit.obligations.length} Pending
                              </span>
                            ) : (
                              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                                Clear
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleDeleteUnit(unit.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === "areas" && (

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Area Controller Accounts</h2>

            {/* Add New Area Form */}
            <form onSubmit={handleAddArea} className="bg-slate-50 p-6 rounded-xl border border-gray-200 mb-8">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Add New Controller</h3>
              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Area Name</label>
                  <select
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={newArea.area}
                    onChange={(e) => setNewArea({ ...newArea, area: e.target.value })}
                    required
                  >
                    <option value="">Select Area</option>
                    <option value="Ramanatukara">Ramanatukara</option>
                    <option value="Pullumkunn">Pullumkunn</option>
                    <option value="Idimuyikkal">Idimuyikkal</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Head Person Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={newArea.headPersonName}
                    onChange={(e) => setNewArea({ ...newArea, headPersonName: e.target.value })}
                    placeholder="e.g. John Doe"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Password</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={newArea.password}
                    onChange={(e) => setNewArea({ ...newArea, password: e.target.value })}
                    placeholder="Set login password"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={areaLoading}
                className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-emerald-700 transition disabled:opacity-50"
              >
                {areaLoading ? "Adding..." : "+ Create Account"}
              </button>
            </form>

            {/* List Areas */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 text-gray-600">
                  <tr>
                    <th className="px-6 py-3 text-left">Area</th>
                    <th className="px-6 py-3 text-left">Head Person</th>
                    <th className="px-6 py-3 text-left">Password</th>
                    <th className="px-6 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {areaAccounts.map((account) => (
                    <tr key={account.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 font-medium text-gray-900">{account.area}</td>
                      <td className="px-6 py-3 text-gray-600">{account.headPersonName}</td>
                      <td className="px-6 py-3 text-gray-500 font-mono">{account.password}</td>
                      <td className="px-6 py-3 text-center">
                        <button
                          onClick={() => handleDeleteArea(account.id, account.area)}
                          className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded transition"
                          title="Delete Account"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {areaAccounts.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                        No area controllers added yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* Edit Modal */}
      {
        showEditModal && editingFamily && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Edit Family Details</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Family Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      value={editingFamily.familyName}
                      onChange={(e) =>
                        setEditingFamily({ ...editingFamily, familyName: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      House Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      value={editingFamily.houseName}
                      onChange={(e) =>
                        setEditingFamily({ ...editingFamily, houseName: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      value={editingFamily.location}
                      onChange={(e) =>
                        setEditingFamily({ ...editingFamily, location: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Road Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      value={editingFamily.roadName}
                      onChange={(e) =>
                        setEditingFamily({ ...editingFamily, roadName: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                    value={editingFamily.address}
                    onChange={(e) =>
                      setEditingFamily({ ...editingFamily, address: e.target.value })
                    }
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Person
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      value={editingFamily.primaryMember.name}
                      onChange={(e) =>
                        setEditingFamily({
                          ...editingFamily,
                          primaryMember: { ...editingFamily.primaryMember, name: e.target.value },
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      value={editingFamily.primaryMember.phone}
                      onChange={(e) =>
                        setEditingFamily({
                          ...editingFamily,
                          primaryMember: { ...editingFamily.primaryMember, phone: e.target.value },
                        })
                      }
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium text-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }

      <ToastContainer />
    </div >
  );
}
