"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User, Home, FileText, Users, LogOut, CreditCard, X, MoveRight, UserMinus, Link } from "lucide-react";

interface Member {
    name: string;
    relationship?: string;
    dob?: string;
    [key: string]: any;
}

interface Obligation {
    subcollection?: string;
    name?: string;
    amount: number | string;
    status?: string;
    date?: string;
    [key: string]: any;
}

interface FamilyData {
    id: string; // House ID
    houseName: string;
    guardianName: string;
    projects?: Obligation[]; // Sometimes obligations are under projects/collections? Using 'obligations' as per prompt
    obligations?: Obligation[];
    members?: Member[];
    [key: string]: any;
}

export default function MyFamilyPage() {
    const router = useRouter();
    const [data, setData] = useState<FamilyData | null>(null);

    const [showTransferModal, setShowTransferModal] = useState(false);
    const [showSplitModal, setShowSplitModal] = useState(false);
    const [showConnectParentsModal, setShowConnectParentsModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [connectParentsFormData, setConnectParentsFormData] = useState({
        memberName: '',
        fatherId: '',
        motherId: ''
    });

    const [transferFormData, setTransferFormData] = useState({
        houseName: '',
        familyName: '',
        location: '',
        areaLocality: '',
        roadName: '',
        detailedAddress: '',
        movingHouseId: ''
    });

    const [splitFormData, setSplitFormData] = useState({
        houseName: '',
        familyName: '',
        location: '',
        areaLocality: '',
        roadName: '',
        detailedAddress: '',
        movingHouseId: ''
    });
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

    const [guardianData, setGuardianData] = useState({
        name: '',
        aadhaar: '',
        phone: '',
        whatsapp: '',
        dob: ''
    });

    useEffect(() => {
        // Check authentication
        const isLoggedIn = sessionStorage.getItem("isLoggedIn");
        const storedData = sessionStorage.getItem("familyData");

        if (!isLoggedIn || !storedData) {
            router.push("/login");
            return;
        }

        try {
            setData(JSON.parse(storedData));
        } catch (e) {
            console.error("Error parsing family data", e);
            router.push("/login");
        }
    }, [router]);

    const handleLogout = () => {
        sessionStorage.clear();
        router.push("/login");
    };

    const handleTransferSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!data) return;
        setSubmitting(true);
        try {
            const { db } = await import("../lib/firebase");
            const { collection, addDoc, serverTimestamp } = await import("firebase/firestore");

            await addDoc(collection(db, "portalRequests"), {
                type: "house_transfer",
                status: "pending",
                createdAt: serverTimestamp(),
                data: {
                    oldHouseId: data.id,
                    oldHouseName: data.houseName,
                    members: data.members || [],
                    ...transferFormData
                }
            });
            alert("House transfer request submitted successfully!");
            setShowTransferModal(false);
            setTransferFormData({ houseName: '', familyName: '', location: '', areaLocality: '', roadName: '', detailedAddress: '', movingHouseId: '' });
        } catch (error) {
            console.error("Error submitting transfer request:", error);
            alert("Failed to submit request.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleSplitSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!data) return;
        if (selectedMembers.length === 0) {
            alert("Please select at least one member to split.");
            return;
        }
        setSubmitting(true);
        try {
            const { db } = await import("../lib/firebase");
            const { collection, addDoc, serverTimestamp } = await import("firebase/firestore");

            const membersToMove = (data.members || []).filter(m => selectedMembers.includes(m.name));

            await addDoc(collection(db, "portalRequests"), {
                type: "member_split",
                status: "pending",
                createdAt: serverTimestamp(),
                data: {
                    oldHouseId: data.id,
                    oldHouseName: data.houseName,
                    members: membersToMove,
                    guardianData: splitFormData.movingHouseId ? null : guardianData,
                    ...splitFormData
                }
            });
            alert("Member split request submitted successfully!");
            setShowSplitModal(false);
            setSplitFormData({ houseName: '', familyName: '', location: '', areaLocality: '', roadName: '', detailedAddress: '', movingHouseId: '' });
            setGuardianData({ name: '', aadhaar: '', phone: '', whatsapp: '', dob: '' });
            setSelectedMembers([]);
        } catch (error) {
            console.error("Error submitting split request:", error);
            alert("Failed to submit request.");
        } finally {
            setSubmitting(false);
        }
    };

    const toggleMemberSelection = (memberName: string) => {
        if (selectedMembers.includes(memberName)) {
            setSelectedMembers(selectedMembers.filter(m => m !== memberName));
        } else {
            setSelectedMembers([...selectedMembers, memberName]);
        }
    };

    const handleConnectParentsSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!data) return;
        if (!connectParentsFormData.fatherId && !connectParentsFormData.motherId) {
            alert("Please provide at least a Father ID or a Mother ID.");
            return;
        }
        setSubmitting(true);
        try {
            const { db } = await import("../lib/firebase");
            const { collection, addDoc, serverTimestamp } = await import("firebase/firestore");

            await addDoc(collection(db, "portalRequests"), {
                type: "parent_connection",
                status: "pending",
                createdAt: serverTimestamp(),
                data: {
                    houseId: data.id,
                    houseName: data.houseName,
                    requesterMemberName: connectParentsFormData.memberName,
                    fatherId: connectParentsFormData.fatherId,
                    motherId: connectParentsFormData.motherId,
                }
            });
            alert("Parent connection request submitted successfully! Pending admin approval.");
            setShowConnectParentsModal(false);
            setConnectParentsFormData({ memberName: '', fatherId: '', motherId: '' });
        } catch (error) {
            console.error("Error submitting parent connection request:", error);
            alert("Failed to submit request.");
        } finally {
            setSubmitting(false);
        }
    };

    if (!data) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 text-emerald-600">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            </div>
        );
    }

    // Helper to fallback safely for arrays
    const obligations = data.obligations || [];
    const members = data.members || [];
    
    // Find guardian ID from members list
    const guardianMember = members.find(m => m.name === data.guardianName);
    const guardianId = guardianMember?.member_id || "N/A";

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            {/* Top Navigation Bar */}
            <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <Home className="w-6 h-6 text-emerald-600 mr-2" />
                            <span className="font-bold text-xl text-gray-800">My Family Portal</span>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center text-gray-500 hover:text-red-500 transition-colors"
                        >
                            <LogOut className="w-5 h-5 mr-1" />
                            <span className="hidden sm:inline">Logout</span>
                        </button>
                    </div>
                </div>
            </nav>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

                {/* House Header Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
                    <div className="p-6 sm:p-8 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mb-4">
                            <Home className="w-8 h-8" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">{data.houseName || "House Name"}</h1>
                        <div className="inline-block bg-gray-100 rounded-full px-4 py-1 text-sm font-medium text-gray-600">
                            House ID: {data.id}
                        </div>
                        <div className="mt-6 flex flex-col sm:flex-row justify-center gap-4 flex-wrap">
                            <button
                                onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
                                className="flex items-center justify-center bg-white text-emerald-600 border border-emerald-600 px-6 py-2 rounded-lg font-medium hover:bg-emerald-50 transition-colors shadow-sm"
                            >
                                View Quick Actions
                            </button>
                        </div>
                    </div>
                </div>

                {/* Guardian Info */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
                    <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center">
                            <div className="bg-blue-100 p-3 rounded-lg mr-4">
                                <User className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Guardian Details</h2>
                                <p className="text-gray-500 text-sm">Head of the family</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Guardian Name</p>
                                <p className="text-lg font-medium text-gray-800">{data.guardianName || "N/A"}</p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Guardian ID</p>
                                <p className="text-lg font-mono text-gray-800">{guardianId}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Obligations Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
                    <div className="flex items-center mb-6">
                        <div className="bg-purple-100 p-3 rounded-lg mr-4">
                            <CreditCard className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Obligations</h2>
                            <p className="text-gray-500 text-sm">Financial commitments and dues</p>
                        </div>
                    </div>

                    {obligations.length > 0 ? (
                        <div className="overflow-hidden border border-gray-200 rounded-xl">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subcollection / Title</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {obligations.map((obl, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{obl.subcollection || obl.name || "Pending Payment"}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-700">₹{obl.amount}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${(obl.status || 'pending').toLowerCase() === 'paid'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    {obl.status || "Pending"}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                            <p className="text-gray-500 italic">No obligations found.</p>
                        </div>
                    )}
                </div>

                {/* Family Members Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
                    <div className="flex items-center mb-6">
                        <div className="bg-rose-100 p-3 rounded-lg mr-4">
                            <Users className="w-6 h-6 text-rose-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Family Members</h2>
                            <p className="text-gray-500 text-sm">Registered members of the house</p>
                        </div>
                    </div>

                    {members.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {members.map((member, idx) => (
                                <div key={idx} className="flex items-center p-4 border border-gray-200 rounded-xl hover:shadow-md transition-shadow bg-white">
                                    <div className="h-10 w-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 font-bold mr-4">
                                        {member.name ? member.name.charAt(0).toUpperCase() : "?"}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{member.name}</h3>
                                        {member.relationship && <p className="text-sm text-gray-500">{member.relationship}</p>}
                                    </div>
                                    <p className="text-sm text-gray-500 pl-4"> Id:<span className="font-semibold text-gray-900">{member.member_id}</span></p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                            <p className="text-gray-500 italic">No family members listed.</p>
                        </div>
                    )}
                </div>

                {/* Quick Actions Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
                    <div className="flex items-center mb-6">
                        <div className="bg-orange-100 p-3 rounded-lg mr-4">
                            <FileText className="w-6 h-6 text-orange-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Forms & Actions</h2>
                            <p className="text-gray-500 text-sm">Manage house, perform transfers and connect members</p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-start gap-4 flex-wrap">
                        <button
                            onClick={() => setShowTransferModal(true)}
                            className="flex items-center justify-center bg-emerald-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-emerald-700 transition-colors shadow-sm"
                        >
                            <MoveRight className="w-5 h-5 mr-2" />
                            Change House
                        </button>
                        <button
                            onClick={() => setShowSplitModal(true)}
                            className="flex items-center justify-center bg-white text-emerald-600 border border-emerald-600 px-6 py-2 rounded-lg font-medium hover:bg-emerald-50 transition-colors shadow-sm"
                        >
                            <UserMinus className="w-5 h-5 mr-2" />
                            Split Members
                        </button>
                        <button
                            onClick={() => setShowConnectParentsModal(true)}
                            className="flex items-center justify-center bg-blue-50 text-blue-600 border border-blue-200 px-6 py-2 rounded-lg font-medium hover:bg-blue-100 transition-colors shadow-sm"
                        >
                            <Link className="w-5 h-5 mr-2" />
                            Connect Parents
                        </button>
                    </div>
                </div>

            </main>

            {/* Modals */}
            {showTransferModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex justify-between items-center z-10">
                            <h2 className="text-xl font-bold text-gray-900">Change House (Full Transfer)</h2>
                            <button onClick={() => setShowTransferModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleTransferSubmit} className="p-6 space-y-4">
                            <p className="text-sm text-gray-600 mb-4">
                                This will transfer the entire family from <strong>{data.houseName}</strong> (ID: {data.id}) to a new or existing house.
                            </p>

                            <div className="space-y-4">
                                <h3 className="font-semibold text-gray-900 border-b pb-2">New House Details</h3>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">House Name *</label>
                                        <input required type="text" className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" value={transferFormData.houseName} onChange={(e) => setTransferFormData({ ...transferFormData, houseName: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Family Name *</label>
                                        <input required type="text" className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" value={transferFormData.familyName} onChange={(e) => setTransferFormData({ ...transferFormData, familyName: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
                                        <input required type="text" className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" value={transferFormData.location} onChange={(e) => setTransferFormData({ ...transferFormData, location: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Area / Locality *</label>
                                        <input required type="text" className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" value={transferFormData.areaLocality} onChange={(e) => setTransferFormData({ ...transferFormData, areaLocality: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Road Name</label>
                                        <input type="text" className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" value={transferFormData.roadName} onChange={(e) => setTransferFormData({ ...transferFormData, roadName: e.target.value })} />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Detailed Address *</label>
                                    <textarea required rows={3} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" value={transferFormData.detailedAddress} onChange={(e) => setTransferFormData({ ...transferFormData, detailedAddress: e.target.value })} />
                                </div>

                                <div className="pt-4 border-t border-gray-100">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Moving to an existing house? (Optional)</label>
                                    <p className="text-xs text-gray-500 mb-2">If moving to an already registered house, enter its ID here.</p>
                                    <input type="text" placeholder="e.g. 1045" className="w-full sm:w-1/2 border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" value={transferFormData.movingHouseId} onChange={(e) => setTransferFormData({ ...transferFormData, movingHouseId: e.target.value })} />
                                </div>
                            </div>

                            <div className="mt-8 flex justify-end gap-3">
                                <button type="button" onClick={() => setShowTransferModal(false)} className="px-5 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
                                <button type="submit" disabled={submitting} className="px-5 py-2 bg-emerald-600 text-white font-medium hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50">
                                    {submitting ? 'Submitting...' : 'Submit Request'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showSplitModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex justify-between items-center z-10">
                            <h2 className="text-xl font-bold text-gray-900">Member Split</h2>
                            <button onClick={() => setShowSplitModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleSplitSubmit} className="p-6 space-y-4">
                            <p className="text-sm text-gray-600">
                                Select the members who are splitting to a new house.
                            </p>

                            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2 bg-gray-50">
                                {members.map((member, idx) => (
                                    <label key={idx} className="flex items-center p-2 hover:bg-white rounded cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                                            checked={selectedMembers.includes(member.name)}
                                            onChange={() => toggleMemberSelection(member.name)}
                                        />
                                        <span className="ml-3 font-medium text-gray-900">{member.name}</span>
                                        {member.relationship && <span className="ml-2 text-sm text-gray-500">({member.relationship})</span>}
                                    </label>
                                ))}
                            </div>
                            {selectedMembers.length > 0 && (
                                <p className="text-sm text-emerald-600 font-medium text-right">{selectedMembers.length} member(s) selected</p>
                            )}

                            <div className="space-y-4 pt-4 border-t border-gray-100">
                                <h3 className="font-semibold text-gray-900 border-b pb-2">Target House Details</h3>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">House Name *</label>
                                        <input required={!splitFormData.movingHouseId} type="text" className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" value={splitFormData.houseName} onChange={(e) => setSplitFormData({ ...splitFormData, houseName: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Family Name *</label>
                                        <input required={!splitFormData.movingHouseId} type="text" className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" value={splitFormData.familyName} onChange={(e) => setSplitFormData({ ...splitFormData, familyName: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
                                        <input required={!splitFormData.movingHouseId} type="text" className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" value={splitFormData.location} onChange={(e) => setSplitFormData({ ...splitFormData, location: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Area / Locality *</label>
                                        <input required={!splitFormData.movingHouseId} type="text" className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" value={splitFormData.areaLocality} onChange={(e) => setSplitFormData({ ...splitFormData, areaLocality: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Road Name</label>
                                        <input type="text" className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" value={splitFormData.roadName} onChange={(e) => setSplitFormData({ ...splitFormData, roadName: e.target.value })} />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Detailed Address *</label>
                                    <textarea required={!splitFormData.movingHouseId} rows={3} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" value={splitFormData.detailedAddress} onChange={(e) => setSplitFormData({ ...splitFormData, detailedAddress: e.target.value })} />
                                </div>

                                <div className="pt-4 border-t border-gray-100">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Moving to an existing house? (Optional)</label>
                                    <p className="text-xs text-gray-500 mb-2">If joining an already registered house, enter its ID.</p>
                                    <input type="text" placeholder="e.g. 1045" className="w-full sm:w-1/2 border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" value={splitFormData.movingHouseId} onChange={(e) => setSplitFormData({ ...splitFormData, movingHouseId: e.target.value })} />
                                </div>

                                {!splitFormData.movingHouseId && (
                                    <div className="pt-4 border-t border-gray-100 mt-4 space-y-4">
                                        <h3 className="font-semibold text-gray-900 border-b pb-2">Guardian Details</h3>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Select Guardian *</label>
                                            <select
                                                required
                                                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                                                value={guardianData.name}
                                                onChange={(e) => setGuardianData({ ...guardianData, name: e.target.value })}
                                            >
                                                <option value="">-- Select Guardian --</option>
                                                {selectedMembers.map((m, idx) => (
                                                    <option key={idx} value={m}>{m}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {guardianData.name && (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                                                <div>
                                                    <label className="block text-xs font-medium text-emerald-800 mb-1">Aadhaar (Last 4 Digits) *</label>
                                                    <input required type="text" maxLength={4} placeholder="e.g. 1234" className="w-full text-sm border border-emerald-200 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none" value={guardianData.aadhaar} onChange={(e) => setGuardianData({ ...guardianData, aadhaar: e.target.value })} />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-emerald-800 mb-1">Phone Number *</label>
                                                    <input required type="tel" placeholder="Phone Number" className="w-full text-sm border border-emerald-200 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none" value={guardianData.phone} onChange={(e) => setGuardianData({ ...guardianData, phone: e.target.value })} />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-emerald-800 mb-1">WhatsApp Number *</label>
                                                    <input required type="tel" placeholder="WhatsApp Number" className="w-full text-sm border border-emerald-200 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none" value={guardianData.whatsapp} onChange={(e) => setGuardianData({ ...guardianData, whatsapp: e.target.value })} />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-emerald-800 mb-1">Date of Birth *</label>
                                                    <input required type="date" className="w-full text-sm border border-emerald-200 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none" value={guardianData.dob} onChange={(e) => setGuardianData({ ...guardianData, dob: e.target.value })} />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="mt-8 flex justify-end gap-3">
                                <button type="button" onClick={() => setShowSplitModal(false)} className="px-5 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
                                <button type="submit" disabled={submitting} className="px-5 py-2 bg-emerald-600 text-white font-medium hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50">
                                    {submitting ? 'Submitting...' : 'Submit Request'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {showConnectParentsModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex justify-between items-center z-10">
                            <h2 className="text-xl font-bold text-gray-900">Connect Parents</h2>
                            <button onClick={() => setShowConnectParentsModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleConnectParentsSubmit} className="p-6 space-y-4">
                            <p className="text-sm text-gray-600 mb-4">
                                Link a member of your house to their parents using the parent's system IDs. This request will be verified by the admin.
                            </p>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Member *</label>
                                    <select
                                        required
                                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                                        value={connectParentsFormData.memberName}
                                        onChange={(e) => setConnectParentsFormData({ ...connectParentsFormData, memberName: e.target.value })}
                                    >
                                        <option value="">-- Select Member --</option>
                                        {members.map((m, idx) => (
                                            <option key={idx} value={m.name}>{m.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="pt-4 border-t border-gray-100">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Father's Member ID (Optional)</label>
                                    <p className="text-xs text-gray-500 mb-2">The exact ID of the member's father.</p>
                                    <input type="text" placeholder="e.g. M-1045" className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" value={connectParentsFormData.fatherId} onChange={(e) => setConnectParentsFormData({ ...connectParentsFormData, fatherId: e.target.value })} />
                                </div>

                                <div className="pt-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Mother's Member ID (Optional)</label>
                                    <p className="text-xs text-gray-500 mb-2">The exact ID of the member's mother.</p>
                                    <input type="text" placeholder="e.g. M-1046" className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" value={connectParentsFormData.motherId} onChange={(e) => setConnectParentsFormData({ ...connectParentsFormData, motherId: e.target.value })} />
                                </div>
                            </div>

                            <div className="mt-8 flex justify-end gap-3">
                                <button type="button" onClick={() => setShowConnectParentsModal(false)} className="px-5 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
                                <button type="submit" disabled={submitting} className="px-5 py-2 bg-emerald-600 text-white font-medium hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50">
                                    {submitting ? 'Submitting...' : 'Submit Request'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
