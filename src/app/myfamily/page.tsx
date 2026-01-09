"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User, Home, FileText, Users, LogOut, CreditCard } from "lucide-react";

interface Member {
    name: string;
    relationship?: string;
    dob?: string;
    [key: string]: any;
}

interface Obligation {
    name: string;
    amount: number | string;
    status: string;
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
                                <p className="text-lg font-mono text-gray-800">{data.id}</p> {/* Assuming guardian ID is implicitly house ID or we don't have separate one */}
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
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {obligations.map((obl, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{obl.name || "Payment"}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">₹{obl.amount}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${(obl.status || '').toLowerCase() === 'paid'
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
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                            <p className="text-gray-500 italic">No family members listed.</p>
                        </div>
                    )}
                </div>

            </main>
        </div>
    );
}
