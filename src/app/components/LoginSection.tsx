"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/app/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { User, Home, LogIn } from "lucide-react";

export default function LoginSection() {
  const router = useRouter();
  const [aadhaarLast4, setAadhaarLast4] = useState("");
  const [dob, setDob] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Aadhaar Last 4 validation
    if (!aadhaarLast4 || aadhaarLast4.length !== 4 || isNaN(Number(aadhaarLast4))) {
      setError("Please enter the last 4 digits of Aadhaar");
      return;
    }

    if (!dob) {
      setError("Please enter your Date of Birth");
      return;
    }

    setLoading(true);

    try {
      // Query Firestore 'units' collection (official data)
      // Matches: guardianAadhaarLast4 == input AND guardianDob == input
      // Note: This requires a composite index if asking for both equality at once.
      // Or we can filter client side if volume is low, but let's try strict query.
      // Firestore allows equality on multiple fields without composite index usually? 
      // Actually strictly equality on multiple fields works fine without index for small datasets or usually auto-indexed?
      // No, multiple equality is fine. It's equality + range that needs index.

      const q = query(
        collection(db, "units"),
        where("guardianAadhaarLast4", "==", aadhaarLast4),
        where("guardianDob", "==", dob)
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError("Invalid credentials! No matching record found.");
        setLoading(false);
        return;
      }

      // Login successful
      const unitDoc = querySnapshot.docs[0];
      const unitData = { id: unitDoc.id, ...unitDoc.data() };

      // Store in sessionStorage
      if (typeof window !== "undefined") {
        sessionStorage.setItem("familyData", JSON.stringify(unitData));
        sessionStorage.setItem("isLoggedIn", "true");
      }

      console.log("Login successful:", unitData);

      // Navigate to dashboard
      router.push("/myfamily");

    } catch (error) {
      console.error("Login error:", error);
      setError("Error during login. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Welcome Back</h2>
          <p className="text-gray-600 mt-2">Login to access your family dashboard</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Aadhaar - Last 4 Digits *
            </label>
            <input
              type="text"
              value={aadhaarLast4}
              onChange={(e) => setAadhaarLast4(e.target.value.replace(/\D/g, "").slice(0, 4))}
              maxLength={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition text-center tracking-widest text-lg"
              placeholder="XXXX"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Guardian Date of Birth *
            </label>
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter the date of birth of the Guardian
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Logging in...
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5 mr-2" />
                Login
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            Don't have an account?{" "}
            <a href="/register" className="text-emerald-600 font-semibold hover:underline">
              Register here
            </a>
          </p>
        </div>

        <div className="mt-4 text-center">
          <a href="/" className="text-gray-500 hover:text-gray-700 text-sm inline-flex items-center">
            <Home className="w-4 h-4 mr-1" />
            Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}