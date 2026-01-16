"use client";

import { useState, useEffect } from "react";
import { db } from "@/app/lib/firebase";
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";
import { CheckCircle, LogIn, MapPin, User, Loader2 } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function AreaPortal() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [areaName, setAreaName] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [pendingFamilies, setPendingFamilies] = useState<any[]>([]);
    const [currentArea, setCurrentArea] = useState<any>(null);

    // --- Login Logic ---
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Query 'area_accounts' collection
            // Schema expected: { area: "Ramanatukara", password: "...", headPersonName: "..." }
            const q = query(collection(db, "area_accounts"), where("area", "==", areaName));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                toast.error("Area not found");
                setLoading(false);
                return;
            }

            const accountDoc = querySnapshot.docs[0];
            const accountData = accountDoc.data();

            if (accountData.password !== password) {
                toast.error("Invalid password");
                setLoading(false);
                return;
            }

            setCurrentArea(accountData);
            setIsLoggedIn(true);
            toast.success(`Welcome, ${accountData.headPersonName || "Area Controller"}`);
            fetchPendingData(accountData.area);

        } catch (error) {
            console.error("Login Error:", error);
            toast.error("Login failed. Check console.");
        } finally {
            setLoading(false);
        }
    };

    // --- Fetch Pending Data ---
    const fetchPendingData = async (area: string) => {
        setLoading(true);
        try {
            // Fetch families in this area that are NOT verified
            const q = query(
                collection(db, "families"),
                where("area", "==", area),
                where("areaVerified", "==", false)
            );

            const querySnapshot = await getDocs(q);
            const families = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            setPendingFamilies(families);
        } catch (error) {
            console.error("Fetch Error:", error);
            toast.error("Failed to load pending data");
        } finally {
            setLoading(false);
        }
    };

    // --- Confirm Data ---
    const confirmFamily = async (familyId: string, familyName: string) => {
        if (!confirm(`Are you sure you want to verify the ${familyName} family?`)) return;

        try {
            const familyRef = doc(db, "families", familyId);
            await updateDoc(familyRef, {
                areaVerified: true,
                verifiedAt: new Date().toISOString(),
                verifiedBy: currentArea.headPersonName
            });

            toast.success("Family verified successfully");
            // Remove from local list
            setPendingFamilies(prev => prev.filter(f => f.id !== familyId));
        } catch (error) {
            console.error("Verification Error:", error);
            toast.error("Failed to verify family");
        }
    };

    // --- Update Logic ---
    const [editingFamily, setEditingFamily] = useState<any>(null);

    const handleUpdateFamily = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingFamily) return;
        setLoading(true);

        try {
            const familyRef = doc(db, "families", editingFamily.id);
            // Create a clean copy associated with the state to avoid reference issues
            const updatedData = { ...editingFamily };
            delete updatedData.id; // Don't save ID into the document

            await updateDoc(familyRef, updatedData);

            toast.success("Family details updated successfully");
            setEditingFamily(null);

            // Refresh local data
            setPendingFamilies(prev =>
                prev.map(f => f.id === editingFamily.id ? editingFamily : f)
            );
        } catch (error) {
            console.error("Update Error:", error);
            toast.error("Failed to update family");
        } finally {
            setLoading(false);
        }
    };

    const handleMemberChange = (index: number, field: string, value: string) => {
        if (!editingFamily) return;
        const updatedMembers = [...editingFamily.members];
        updatedMembers[index] = { ...updatedMembers[index], [field]: value };
        setEditingFamily({ ...editingFamily, members: updatedMembers });
    };

    // --- Views ---

    if (!isLoggedIn) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <ToastContainer />
                <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <MapPin className="w-8 h-8 text-emerald-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800">Area Controller Portal</h1>
                        <p className="text-gray-500 mt-2">Login to manage your area's data</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Area Name</label>
                            <select
                                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                value={areaName}
                                onChange={(e) => setAreaName(e.target.value)}
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <input
                                type="password"
                                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition flex items-center justify-center"
                        >
                            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <><LogIn className="w-5 h-5 mr-2" /> Login</>}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <ToastContainer />

            {/* Navbar */}
            <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center sticky top-0 z-10">
                <div className="flex items-center space-x-2">
                    <MapPin className="w-6 h-6 text-emerald-600" />
                    <span className="font-bold text-lg text-gray-800">{currentArea?.area} Area</span>
                </div>
                <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-500 hidden sm:block">Controller: {currentArea?.headPersonName}</span>
                    <button
                        onClick={() => setIsLoggedIn(false)}
                        className="text-red-600 hover:bg-red-50 px-3 py-1 rounded text-sm font-medium"
                    >
                        Logout
                    </button>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto p-4 sm:p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Pending Verifications</h2>
                    <button
                        onClick={() => fetchPendingData(currentArea.area)}
                        className="text-emerald-600 hover:text-emerald-700 font-medium"
                    >
                        Refresh List
                    </button>
                </div>

                {loading && !editingFamily ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="animate-spin w-8 h-8 text-emerald-600" />
                    </div>
                ) : pendingFamilies.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                        <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg">No pending verifications for {currentArea.area}</p>
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {pendingFamilies.map((family) => (
                            <div key={family.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition overflow-hidden border border-gray-100">
                                <div className="p-5">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900">{family.familyName}</h3>
                                            <p className="text-sm text-emerald-600 font-medium">{family.houseName}</p>
                                        </div>
                                        <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-medium">
                                            Pending
                                        </span>
                                    </div>

                                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                                        <p className="flex items-start">
                                            <MapPin className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                                            {family.address}, {family.location}
                                        </p>
                                        <p className="flex items-center">
                                            <User className="w-4 h-4 mr-2" />
                                            {family.totalMembers} Members
                                        </p>
                                    </div>

                                    {/* Guardian Snippet */}
                                    {family.members && family.members.find((m: any) => m.isGuardian) && (
                                        <div className="bg-slate-50 p-3 rounded-lg text-sm mb-4">
                                            <p className="text-xs text-gray-500 uppercase font-bold mb-1">Guardian</p>
                                            <p className="font-medium text-gray-800">
                                                {family.members.find((m: any) => m.isGuardian).fullName}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Phone: {family.members.find((m: any) => m.isGuardian).phone}
                                            </p>
                                        </div>
                                    )}

                                    <div className="flex gap-2">
                                        {/* Edit Button */}
                                        <button
                                            onClick={() => setEditingFamily(family)}
                                            className="flex-1 border border-emerald-600 text-emerald-600 py-2 rounded-lg font-medium hover:bg-emerald-50 transition"
                                        >
                                            Edit
                                        </button>
                                        {/* Verify Button */}
                                        <button
                                            onClick={() => confirmFamily(family.id, family.familyName)}
                                            className="flex-1 bg-emerald-600 text-white py-2 rounded-lg font-medium hover:bg-emerald-700 transition flex items-center justify-center"
                                        >
                                            <CheckCircle className="w-4 h-4 mr-2" /> Verify
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Edit Modal */}
                {editingFamily && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4">
                            <div className="sticky top-0 bg-white p-6 border-b flex justify-between items-center z-10">
                                <h2 className="text-xl font-bold text-gray-800">Edit Family Details</h2>
                                <button onClick={() => setEditingFamily(null)} className="p-2 hover:bg-gray-100 rounded-full">✕</button>
                            </div>

                            <form onSubmit={handleUpdateFamily} className="p-6 space-y-8">
                                {/* House Details */}
                                <section>
                                    <h3 className="text-lg font-semibold text-gray-700 mb-4 pb-2 border-b">House Information</h3>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Family Name</label>
                                            <input
                                                type="text"
                                                className="w-full p-2 border rounded focus:ring-2 focus:ring-emerald-500 outline-none"
                                                value={editingFamily.familyName}
                                                onChange={(e) => setEditingFamily({ ...editingFamily, familyName: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">House Name</label>
                                            <input
                                                type="text"
                                                className="w-full p-2 border rounded focus:ring-2 focus:ring-emerald-500 outline-none"
                                                value={editingFamily.houseName}
                                                onChange={(e) => setEditingFamily({ ...editingFamily, houseName: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Location / Place</label>
                                            <input
                                                type="text"
                                                className="w-full p-2 border rounded focus:ring-2 focus:ring-emerald-500 outline-none"
                                                value={editingFamily.location}
                                                onChange={(e) => setEditingFamily({ ...editingFamily, location: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Locality (Selection)</label>
                                            <select
                                                className="w-full p-2 border rounded focus:ring-2 focus:ring-emerald-500 outline-none"
                                                value={editingFamily.locality || ""}
                                                onChange={(e) => setEditingFamily({ ...editingFamily, locality: e.target.value })}
                                            >
                                                <option value="">Select Locality</option>
                                                <option value="Ramanatukara">Ramanatukara</option>
                                                <option value="Pullumkunn">Pullumkunn</option>
                                                <option value="Idimuyikkal">Idimuyikkal</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Address</label>
                                            <textarea
                                                className="w-full p-2 border rounded focus:ring-2 focus:ring-emerald-500 outline-none"
                                                rows={2}
                                                value={editingFamily.address}
                                                onChange={(e) => setEditingFamily({ ...editingFamily, address: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>
                                </section>

                                {/* Members List */}
                                <section>
                                    <h3 className="text-lg font-semibold text-gray-700 mb-4 pb-2 border-b">Members ({editingFamily.members?.length || 0})</h3>
                                    <div className="space-y-6">
                                        {editingFamily.members?.map((member: any, index: number) => (
                                            <div key={index} className="bg-slate-50 p-4 rounded-lg border border-gray-200">
                                                <div className="flex justify-between items-center mb-3">
                                                    <span className="font-semibold text-gray-700">
                                                        #{index + 1} {member.isGuardian ? <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded ml-2">Guardian</span> : <span className="text-gray-500 text-sm ml-2">({member.relation})</span>}
                                                    </span>
                                                </div>

                                                {/* Personal Basics */}
                                                <div className="grid md:grid-cols-4 gap-3 mb-3">
                                                    <div className="col-span-2 md:col-span-1">
                                                        <label className="block text-xs font-medium text-gray-500 mb-1">First Name</label>
                                                        <input
                                                            type="text"
                                                            className="w-full p-2 text-sm border rounded focus:ring-1 focus:ring-emerald-500 outline-none"
                                                            value={member.fullName || ""}
                                                            onChange={(e) => handleMemberChange(index, 'fullName', e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="col-span-2 md:col-span-1">
                                                        <label className="block text-xs font-medium text-gray-500 mb-1">Surname</label>
                                                        <input
                                                            type="text"
                                                            className="w-full p-2 text-sm border rounded focus:ring-1 focus:ring-emerald-500 outline-none"
                                                            value={member.surname || ""}
                                                            onChange={(e) => handleMemberChange(index, 'surname', e.target.value)}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-500 mb-1">Date of Birth</label>
                                                        <input
                                                            type="date"
                                                            className="w-full p-2 text-sm border rounded focus:ring-1 focus:ring-emerald-500 outline-none"
                                                            value={member.dob || ""}
                                                            onChange={(e) => handleMemberChange(index, 'dob', e.target.value)}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-500 mb-1">Relation</label>
                                                        <input
                                                            type="text"
                                                            className="w-full p-2 text-sm border rounded focus:ring-1 focus:ring-emerald-500 outline-none"
                                                            value={member.relation || (member.isGuardian ? "Head" : "")}
                                                            onChange={(e) => handleMemberChange(index, 'relation', e.target.value)}
                                                            disabled={member.isGuardian}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Contact & ID (Mainly for Guardian) */}
                                                <div className="grid md:grid-cols-3 gap-3 mb-3">
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-500 mb-1">Phone</label>
                                                        <input
                                                            type="text"
                                                            className="w-full p-2 text-sm border rounded focus:ring-1 focus:ring-emerald-500 outline-none"
                                                            value={member.phone || ""}
                                                            onChange={(e) => handleMemberChange(index, 'phone', e.target.value)}
                                                            placeholder={!member.isGuardian ? "Optional" : ""}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-500 mb-1">Aadhaar (Last 4)</label>
                                                        <input
                                                            type="text"
                                                            maxLength={4}
                                                            className="w-full p-2 text-sm border rounded focus:ring-1 focus:ring-emerald-500 outline-none"
                                                            value={member.aadhaar || ""}
                                                            onChange={(e) => handleMemberChange(index, 'aadhaar', e.target.value)}
                                                        />
                                                    </div>
                                                    {member.isGuardian && (
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-500 mb-1">WhatsApp</label>
                                                            <input
                                                                type="text"
                                                                className="w-full p-2 text-sm border rounded focus:ring-1 focus:ring-emerald-500 outline-none"
                                                                value={member.whatsapp || ""}
                                                                onChange={(e) => handleMemberChange(index, 'whatsapp', e.target.value)}
                                                            />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Parents Details */}
                                                <div className="grid md:grid-cols-4 gap-3 mb-3 bg-white p-2 rounded border border-gray-100">
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-400 mb-1">Father's Name</label>
                                                        <input
                                                            type="text"
                                                            className="w-full p-1.5 text-sm border rounded focus:ring-1 focus:ring-emerald-500 outline-none bg-gray-50"
                                                            value={member.fatherName || ""}
                                                            onChange={(e) => handleMemberChange(index, 'fatherName', e.target.value)}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-400 mb-1">Father's Surname</label>
                                                        <input
                                                            type="text"
                                                            className="w-full p-1.5 text-sm border rounded focus:ring-1 focus:ring-emerald-500 outline-none bg-gray-50"
                                                            value={member.fatherSurname || ""}
                                                            onChange={(e) => handleMemberChange(index, 'fatherSurname', e.target.value)}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-400 mb-1">Mother's Name</label>
                                                        <input
                                                            type="text"
                                                            className="w-full p-1.5 text-sm border rounded focus:ring-1 focus:ring-emerald-500 outline-none bg-gray-50"
                                                            value={member.motherName || ""}
                                                            onChange={(e) => handleMemberChange(index, 'motherName', e.target.value)}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-400 mb-1">Mother's Surname</label>
                                                        <input
                                                            type="text"
                                                            className="w-full p-1.5 text-sm border rounded focus:ring-1 focus:ring-emerald-500 outline-none bg-gray-50"
                                                            value={member.motherSurname || ""}
                                                            onChange={(e) => handleMemberChange(index, 'motherSurname', e.target.value)}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Marital Status & Extra */}
                                                <div className="grid md:grid-cols-2 gap-3">
                                                    <div className="flex items-center space-x-2 pt-4">
                                                        <input
                                                            type="checkbox"
                                                            id={`married-${index}`}
                                                            checked={member.isMarried || false}
                                                            onChange={(e) => handleMemberChange(index, 'isMarried', e.target.checked as any)} // Cast for boolean handling fix if needed
                                                            className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                                                        />
                                                        <label htmlFor={`married-${index}`} className="text-sm text-gray-700">Married</label>
                                                    </div>
                                                    {member.isMarried && (
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div>
                                                                <label className="block text-xs font-medium text-gray-500 mb-1">Spouse Name</label>
                                                                <input
                                                                    type="text"
                                                                    className="w-full p-2 text-sm border rounded"
                                                                    value={member.spouseName || ""}
                                                                    onChange={(e) => handleMemberChange(index, 'spouseName', e.target.value)}
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs font-medium text-gray-500 mb-1">Spouse Surname</label>
                                                                <input
                                                                    type="text"
                                                                    className="w-full p-2 text-sm border rounded"
                                                                    value={member.spouseSurname || ""}
                                                                    onChange={(e) => handleMemberChange(index, 'spouseSurname', e.target.value)}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                    {member.isGuardian && (
                                                        <div className="col-span-2">
                                                            <label className="block text-xs font-medium text-gray-500 mb-1">Grandfather Name</label>
                                                            <input
                                                                type="text"
                                                                className="w-full p-2 text-sm border rounded focus:ring-1 focus:ring-emerald-500 outline-none"
                                                                value={member.grandFatherName || ""}
                                                                onChange={(e) => handleMemberChange(index, 'grandFatherName', e.target.value)}
                                                            />
                                                        </div>
                                                    )}
                                                </div>

                                            </div>
                                        ))}
                                    </div>
                                </section>

                                <div className="flex gap-4 pt-4 border-t sticky bottom-0 bg-white p-4 -mx-6 -mb-6 rounded-b-2xl shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                                    <button
                                        type="button"
                                        onClick={() => setEditingFamily(null)}
                                        className="flex-1 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition"
                                    >
                                        {loading ? "Saving..." : "Save Changes"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
