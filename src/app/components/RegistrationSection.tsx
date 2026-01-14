"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { db, storage } from "@/app/lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { Home, Users, User, X, CheckCircle, Edit, Check, Upload, Image as ImageIcon } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface Member {
  fullName: string;
  surname: string;
  fatherName: string;
  fatherSurname: string;
  motherName: string;
  motherSurname: string;
  dob: string;
  // Marital Status
  isMarried: boolean;
  spouseName?: string;
  spouseSurname?: string;
}

interface GuardianDetails {
  fullName: string;
  surname: string;
  fatherName: string;
  fatherSurname: string;
  motherName: string;
  motherSurname: string;
  wifeName: string;
  wifeSurname: string;
  dob: string;
  aadhaar: string; // last 4 digits
  phone: string;
  whatsapp: string;
  photoURL: string;
}

export default function RegistrationSection() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editingMemberIndex, setEditingMemberIndex] = useState<number | null>(null);

  // Step 1 - House Details
  const [houseName, setHouseName] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [location, setLocation] = useState("");
  const [roadName, setRoadName] = useState("");
  const [address, setAddress] = useState("");

  // Step 2 - Guardian Details
  const [guardian, setGuardian] = useState<GuardianDetails>({
    fullName: "",
    surname: "",
    fatherName: "",
    fatherSurname: "",
    motherName: "",
    motherSurname: "",
    wifeName: "",
    wifeSurname: "",
    dob: "",
    aadhaar: "",
    phone: "",
    whatsapp: "",
    photoURL: "",
  });

  // Guardian Photo Upload State
  const [guardianPhoto, setGuardianPhoto] = useState<File | null>(null);
  const [guardianPhotoPreview, setGuardianPhotoPreview] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // Step 3 - Family Members
  const [members, setMembers] = useState<Member[]>([]);

  // Modal form fields (Member)
  const [modalFullName, setModalFullName] = useState("");
  const [modalSurname, setModalSurname] = useState("");
  const [modalFatherName, setModalFatherName] = useState("");
  const [modalFatherSurname, setModalFatherSurname] = useState("");
  const [modalMotherName, setModalMotherName] = useState("");
  const [modalMotherSurname, setModalMotherSurname] = useState("");
  const [modalDob, setModalDob] = useState("");
  const [modalIsMarried, setModalIsMarried] = useState(false);
  const [modalSpouseName, setModalSpouseName] = useState("");
  const [modalSpouseSurname, setModalSpouseSurname] = useState("");

  const updateGuardian = (field: keyof GuardianDetails, value: string) => {
    setGuardian((prev) => ({ ...prev, [field]: value }));
  };

  const openMemberModal = () => {
    setEditingMemberIndex(null);
    setModalFullName("");
    setModalSurname("");
    setModalFatherName("");
    setModalFatherSurname("");
    setModalMotherName("");
    setModalMotherSurname("");
    setModalDob("");
    setModalIsMarried(false);
    setModalSpouseName("");
    setModalSpouseSurname("");
    setShowMemberModal(true);
  };

  const openEditMemberModal = (index: number) => {
    const member = members[index];
    setEditingMemberIndex(index);
    setModalFullName(member.fullName);
    setModalSurname(member.surname);
    setModalFatherName(member.fatherName);
    setModalFatherSurname(member.fatherSurname);
    setModalMotherName(member.motherName);
    setModalMotherSurname(member.motherSurname);
    setModalDob(member.dob);
    setModalIsMarried(member.isMarried);
    setModalSpouseName(member.spouseName || "");
    setModalSpouseSurname(member.spouseSurname || "");
    setShowMemberModal(true);
  };

  const closeMemberModal = () => {
    setShowMemberModal(false);
    setEditingMemberIndex(null);
  };

  const saveMember = () => {
    // Basic validation
    if (!modalFullName || !modalSurname || !modalFatherName || !modalFatherSurname || !modalMotherName || !modalMotherSurname) {
      toast.error("Please fill all required member name fields", { position: "top-center", autoClose: 3000 });
      return;
    }

    if (modalIsMarried && (!modalSpouseName || !modalSpouseSurname)) {
      toast.error("Please fill spouse details or uncheck 'Married'", { position: "top-center", autoClose: 3000 });
      return;
    }

    const newMember: Member = {
      fullName: modalFullName,
      surname: modalSurname,
      fatherName: modalFatherName,
      fatherSurname: modalFatherSurname,
      motherName: modalMotherName,
      motherSurname: modalMotherSurname,
      dob: modalDob,
      isMarried: modalIsMarried,
      spouseName: modalIsMarried ? modalSpouseName : "",
      spouseSurname: modalIsMarried ? modalSpouseSurname : "",
    };

    if (editingMemberIndex !== null) {
      const updated = [...members];
      updated[editingMemberIndex] = newMember;
      setMembers(updated);
      toast.success("Member updated", { position: "top-center", autoClose: 2000 });
    } else {
      setMembers([...members, newMember]);
      toast.success("Member added", { position: "top-center", autoClose: 2000 });
    }

    closeMemberModal();
  };

  const removeMember = (index: number) => {
    const updated = [...members];
    updated.splice(index, 1);
    setMembers(updated);
    toast.info("Member removed", { position: "top-center", autoClose: 2000 });
  };

  // --- Photo Handling ---
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error("Invalid image file", { position: "top-center", autoClose: 3000 });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image too large (max 5MB)", { position: "top-center", autoClose: 3000 });
        return;
      }
      setGuardianPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => setGuardianPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const uploadGuardianPhoto = async (): Promise<string> => {
    if (!guardianPhoto) return "";
    return new Promise((resolve, reject) => {
      setIsUploading(true);
      const timestamp = Date.now();
      const filename = `guardian-photos/${timestamp}_${guardianPhoto.name}`;
      const storageRef = ref(storage, filename);
      const uploadTask = uploadBytesResumable(storageRef, guardianPhoto);

      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(Math.round(progress));
        },
        (error) => {
          console.error("Upload error:", error);
          setIsUploading(false);
          toast.error("Upload failed", { position: "top-center", autoClose: 3000 });
          reject(error);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          setGuardian((prev) => ({ ...prev, photoURL: downloadURL }));
          setIsUploading(false);
          resolve(downloadURL);
        }
      );
    });
  };

  const removeGuardianPhoto = () => {
    setGuardianPhoto(null);
    setGuardianPhotoPreview("");
    setUploadProgress(0);
    setGuardian((prev) => ({ ...prev, photoURL: "" }));
  };

  // --- Validation ---
  const validateStep1 = () => {
    if (!houseName || !familyName || !location || !roadName || !address) {
      toast.error("Please fill all House Information fields", { position: "top-center", autoClose: 3000 });
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    const { fullName, surname, fatherName, fatherSurname, motherName, motherSurname, dob, aadhaar, phone } = guardian;
    if (!fullName || !surname || !fatherName || !fatherSurname || !motherName || !motherSurname || !dob || !aadhaar || !phone) {
      toast.error("Please fill all required Guardian fields", { position: "top-center", autoClose: 3000 });
      return false;
    }
    if (aadhaar.length !== 4 || isNaN(Number(aadhaar))) {
      toast.error("Aadhaar must be last 4 digits", { position: "top-center", autoClose: 3000 });
      return false;
    }
    if (phone.length !== 10) {
      toast.error("Phone must be 10 digits", { position: "top-center", autoClose: 3000 });
      return false;
    }
    if (guardian.whatsapp && guardian.whatsapp.length !== 10) {
      toast.error("WhatsApp must be 10 digits", { position: "top-center", autoClose: 3000 });
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    // It's allowed to have 0 members technically, but typically a family has members.
    // User didn't specify strict constraint, but let's allow 0 if Guardian is alone? 
    // Usually user context implies adding family members. We'll warn if empty but allow?
    // Let's enforce at least 1 member if separate logic implies guardian isn't in members list?
    // Actually, Guardian IS a member usually, but here we treat GUARDIAN + MEMBERS.
    // So 0 members is valid (Just Guardian living alone).
    return true;
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      let photoURL = guardian.photoURL;
      if (guardianPhoto && !photoURL) {
        photoURL = await uploadGuardianPhoto();
      }

      const finalGuardian = { ...guardian, photoURL: photoURL };

      // Transform Guardian to match Member structure + extra fields
      const guardianMember = {
        fullName: finalGuardian.fullName,
        surname: finalGuardian.surname,
        fatherName: finalGuardian.fatherName,
        fatherSurname: finalGuardian.fatherSurname,
        motherName: finalGuardian.motherName,
        motherSurname: finalGuardian.motherSurname,
        dob: finalGuardian.dob,
        isMarried: !!finalGuardian.wifeName,
        spouseName: finalGuardian.wifeName || "",
        spouseSurname: finalGuardian.wifeSurname || "",

        // Guardian specific fields
        aadhaar: finalGuardian.aadhaar,
        phone: finalGuardian.phone,
        whatsapp: finalGuardian.whatsapp,
        photoURL: finalGuardian.photoURL,
        isGuardian: true
      };

      // Add isGuardian: false to other members
      const regularMembers = members.map(m => ({
        ...m,
        isGuardian: false
      }));

      const allMembers = [guardianMember, ...regularMembers];

      const data = {
        houseName,
        familyName,
        location,
        roadName,
        address,
        // Guardian is now part of members array
        members: allMembers,
        totalMembers: allMembers.length,
        createdAt: new Date().toISOString(),
        registrationDate: new Date().toLocaleDateString(),
      };

      // Sanitize data to remove any undefined values which Firestore rejects
      const sanitizedData = JSON.parse(JSON.stringify(data));

      const docRef = await addDoc(collection(db, "families"), sanitizedData);
      console.log("Saved with ID:", docRef.id);
      setShowSuccessPopup(true);
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Error saving data", { position: "top-center", autoClose: 4000 });
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">

          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Masjid Family Registration
            </h1>
            <p className="text-gray-600 mt-2">Step {step} of 4</p>
          </div>

          {/* Progress Bar */}
          <div className="flex gap-2 mb-8">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex-1">
                <div className={`h-2 rounded-full transition-all duration-300 ${s <= step ? "bg-gradient-to-r from-emerald-600 to-teal-600" : "bg-gray-200"}`} />
              </div>
            ))}
          </div>

          {/* Step 1: House Details */}
          {step === 1 && (
            <div className="space-y-4 animate-fadeIn">
              <h2 className="text-xl font-semibold flex items-center text-gray-800 border-b pb-2">
                <Home className="w-5 h-5 mr-2 text-emerald-600" /> House Information
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">House Name *</label>
                  <input type="text" className="w-full text-gray-900 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={houseName} onChange={(e) => setHouseName(e.target.value)} placeholder="e.g., Al-Noor" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Family Name *</label>
                  <input type="text" className="w-full text-gray-900 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={familyName} onChange={(e) => setFamilyName(e.target.value)} placeholder="e.g., Rahman Family" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Location *</label>
                  <input type="text" className="w-full text-gray-900 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={location} onChange={(e) => setLocation(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Road Name *</label>
                  <input type="text" className="w-full text-gray-900 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={roadName} onChange={(e) => setRoadName(e.target.value)} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Detailed Address *</label>
                  <textarea rows={3} className="w-full text-gray-900 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                    value={address} onChange={(e) => setAddress(e.target.value)} />
                </div>
              </div>
              <button onClick={() => validateStep1() && setStep(2)} className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition">
                Continue
              </button>
            </div>
          )}

          {/* Step 2: Guardian Details */}
          {step === 2 && (
            <div className="space-y-4 animate-fadeIn">
              <h2 className="text-xl font-semibold flex items-center text-gray-800 border-b pb-2">
                <User className="w-5 h-5 mr-2 text-emerald-600" /> Guardian Information
              </h2>

              {/* Photo Upload */}
              {/* <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 mb-4">
                {guardianPhotoPreview ? (
                  <div className="relative">
                    <img src={guardianPhotoPreview} alt="Preview" className="w-32 h-32 object-cover rounded-full border-4 border-white shadow-md" />
                    <button onClick={removeGuardianPhoto} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-lg hover:bg-red-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="text-center">
                    <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 mb-2">Upload Guardian Photo</p>
                    <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" id="guardian-photo-upload" />
                    <label htmlFor="guardian-photo-upload" className="px-4 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer text-sm font-medium text-gray-700 hover:bg-gray-50">
                      Choose File
                    </label>
                  </div>
                )}
              </div> */}

              {/* Personal Details */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Full Name *</label>
                  <input type="text" className="w-full text-gray-900 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={guardian.fullName} onChange={(e) => updateGuardian("fullName", e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Surname *</label>
                  <input type="text" className="w-full text-gray-900 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={guardian.surname} onChange={(e) => updateGuardian("surname", e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Father Name *</label>
                  <input type="text" className="w-full text-gray-900 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={guardian.fatherName} onChange={(e) => updateGuardian("fatherName", e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Father Surname *</label>
                  <input type="text" className="w-full text-gray-900 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={guardian.fatherSurname} onChange={(e) => updateGuardian("fatherSurname", e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Mother Name *</label>
                  <input type="text" className="w-full text-gray-900 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={guardian.motherName} onChange={(e) => updateGuardian("motherName", e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Mother Surname *</label>
                  <input type="text" className="w-full text-gray-900 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={guardian.motherSurname} onChange={(e) => updateGuardian("motherSurname", e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Wife Name</label>
                  <input type="text" className="w-full text-gray-900 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={guardian.wifeName} onChange={(e) => updateGuardian("wifeName", e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Wife Surname</label>
                  <input type="text" className="w-full text-gray-900 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={guardian.wifeSurname} onChange={(e) => updateGuardian("wifeSurname", e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date of Birth *</label>
                  <input type="date" className="w-full text-gray-900 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={guardian.dob} onChange={(e) => updateGuardian("dob", e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Aadhaar (Last 4 Digits) *</label>
                  <input type="text" maxLength={4} className="w-full text-gray-900 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={guardian.aadhaar} onChange={(e) => updateGuardian("aadhaar", e.target.value.replace(/\D/g, ""))} placeholder="XXXX" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone Number *</label>
                  <input type="tel" maxLength={10} className="w-full text-gray-900 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={guardian.phone} onChange={(e) => updateGuardian("phone", e.target.value.replace(/\D/g, ""))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">WhatsApp Number *</label>
                  <input type="tel" maxLength={10} className="w-full text-gray-900 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={guardian.whatsapp} onChange={(e) => updateGuardian("whatsapp", e.target.value.replace(/\D/g, ""))} />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button onClick={() => setStep(1)} className="flex-1 py-3 border rounded-lg hover:bg-gray-50 transition">Back</button>
                <button onClick={() => validateStep2() && setStep(3)} className="flex-1 bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 transition">Continue</button>
              </div>
            </div>
          )}

          {/* Step 3: Family Members */}
          {step === 3 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex justify-between items-center border-b pb-2">
                <h2 className="text-xl font-semibold flex items-center text-gray-800">
                  <Users className="w-5 h-5 mr-2 text-emerald-600" /> Family Members
                </h2>
                <button onClick={openMemberModal} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm flex items-center">
                  <span className="mr-1">+</span> Add Member
                </button>
              </div>

              {members.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed">
                  <p className="text-gray-500">No additional family members added.</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {members.map((m, i) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border">
                      <div>
                        <p className="font-semibold text-gray-900">{m.fullName} {m.surname}</p>
                        <p className="text-xs text-gray-600">{m.isMarried ? `Spouse: ${m.spouseName}` : "Unmarried"}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => openEditMemberModal(i)} className="text-blue-600 p-1 hover:bg-blue-50 rounded"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => removeMember(i)} className="text-red-500 p-1 hover:bg-red-50 rounded"><X className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button onClick={() => setStep(2)} className="flex-1 py-3 border rounded-lg hover:bg-gray-50 transition">Back</button>
                <button onClick={() => validateStep3() && setStep(4)} className="flex-1 bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 transition">Review & Submit</button>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div className="space-y-6 animate-fadeIn">
              <h2 className="text-2xl font-semibold flex items-center text-gray-800 border-b pb-4">
                <CheckCircle className="w-6 h-6 mr-2 text-emerald-600" /> Review Details
              </h2>

              {/* House Review */}
              <div className="bg-gray-50 p-4 rounded-xl border">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-gray-700">House Details</h3>
                  <button onClick={() => setStep(1)} className="text-emerald-600 text-sm">Edit</button>
                </div>
                <div className="grid grid-cols-2 text-gray-800 gap-x-4 gap-y-2 text-md">
                  <p><span className="text-gray-700 text-sm block">House Name</span>{houseName}</p>
                  <p><span className="text-gray-700 text-sm block">Family Name</span>{familyName}</p>
                  <p className="col-span-2"><span className="text-gray-700 text-sm block">Address</span>{address}, {roadName}, {location}</p>
                </div>
              </div>

              {/* Guardian Review */}
              <div className="bg-gray-50 p-4 rounded-xl border">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-gray-700">Guardian Details</h3>
                  <button onClick={() => setStep(2)} className="text-emerald-600 text-sm">Edit</button>
                </div>
                <div className="grid grid-cols-2 text-gray-800 gap-x-4 gap-y-2 text-md">
                  <p><span className="text-gray-700 text-sm block">Name</span>{guardian.fullName} {guardian.surname}</p>
                  <p><span className="text-gray-700 text-sm block">Phone</span>{guardian.phone}</p>
                  <p><span className="text-gray-700 text-sm block">Father</span>{guardian.fatherName} {guardian.fatherSurname}</p>
                  <p><span className="text-gray-700 text-sm block">Mother</span>{guardian.motherName} {guardian.motherSurname}</p>
                  {guardian.wifeName && <p className="col-span-2"><span className="text-gray-700 text-sm block">Wife</span>{guardian.wifeName} {guardian.wifeSurname}</p>}
                </div>
              </div>

              {/* Members Review */}
              <div className="bg-gray-50 p-4 rounded-xl border">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-gray-700">Members ({members.length})</h3>
                  <button onClick={() => setStep(3)} className="text-emerald-600 text-sm">Edit</button>
                </div>
                <ul className="space-y-2">
                  {members.map((m, i) => (
                    <li key={i} className="text-sm bg-white p-2 rounded border">
                      <span className="font-medium">{m.fullName} {m.surname}</span>
                      {m.isMarried && <span className="text-gray-500 ml-2">(Spouse: {m.spouseName})</span>}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex gap-4 pt-4">
                <button onClick={() => setStep(3)} className="flex-1 py-3 border rounded-lg hover:bg-gray-50 transition">Back</button>
                <button onClick={handleSubmit} disabled={loading} className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition">
                  {loading ? "Submitting..." : "Confirm Application"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Member Modal */}
      {showMemberModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 animate-scale-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">{editingMemberIndex !== null ? 'Edit Member' : 'Add Member'}</h3>
              <button onClick={closeMemberModal}><X className="w-5 h-5 text-gray-500" /></button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500">Full Name *</label>
                  <input className="w-full text-gray-900 p-2 border rounded" value={modalFullName} onChange={(e) => setModalFullName(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Surname *</label>
                  <input className="w-full text-gray-900 p-2 border rounded" value={modalSurname} onChange={(e) => setModalSurname(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500">Father Name *</label>
                  <input className="w-full text-gray-900 p-2 border rounded" list="guardian-suggestions" value={modalFatherName} onChange={(e) => setModalFatherName(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Father Surname *</label>
                  <input className="w-full text-gray-900 p-2 border rounded" list="guardian-surname-suggestions" value={modalFatherSurname} onChange={(e) => setModalFatherSurname(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500">Mother Name *</label>
                  <input className="w-full text-gray-900 p-2 border rounded" list="guardian-mother-suggestions" value={modalMotherName} onChange={(e) => setModalMotherName(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Mother Surname *</label>
                  <input className="w-full text-gray-900 p-2 border rounded" list="guardian-mother-surname-suggestions" value={modalMotherSurname} onChange={(e) => setModalMotherSurname(e.target.value)} />
                </div>
              </div>

              {/* Suggestions Datalists - Simple implementation */}
              <datalist id="guardian-suggestions">
                <option value={guardian.fullName} />
                <option value={guardian.fatherName} />
              </datalist>
              <datalist id="guardian-surname-suggestions">
                <option value={guardian.surname} />
                <option value={guardian.fatherSurname} />
              </datalist>
              <datalist id="guardian-mother-suggestions">
                <option value={guardian.motherName} />
                <option value={guardian.wifeName} />
              </datalist>
              <datalist id="guardian-mother-surname-suggestions">
                <option value={guardian.motherSurname} />
                <option value={guardian.wifeSurname} />
              </datalist>

              <div>
                <label className="text-xs font-medium text-gray-500">Date of Birth</label>
                <input type="date" className="w-full p-2 border rounded" value={modalDob} onChange={(e) => setModalDob(e.target.value)} />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={modalIsMarried} onChange={(e) => setModalIsMarried(e.target.checked)} className="w-4 h-4 text-emerald-600 rounded" />
                  <span className="text-sm font-medium text-gray-700">Is Married?</span>
                </label>
              </div>

              {modalIsMarried && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg">
                  <div>
                    <label className="text-xs font-medium text-gray-500">Spouse Name *</label>
                    <input className="w-full p-2 border rounded" value={modalSpouseName} onChange={(e) => setModalSpouseName(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500">Spouse Surname *</label>
                    <input className="w-full p-2 border rounded" value={modalSpouseSurname} onChange={(e) => setModalSpouseSurname(e.target.value)} />
                  </div>
                </div>
              )}

              <button onClick={saveMember} className="w-full mt-4 bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700">Save Member</button>
            </div>
          </div>
        </div>
      )}

      {/* Success Popup */}
      {showSuccessPopup && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 text-center max-w-md w-full animate-bounce-in">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Registration Complete!</h2>
            <p className="text-gray-600 mb-6">JazakAllah Khair! Your family details have been submitted successfully.</p>
            <button onClick={() => window.location.reload()} className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold">Start New Registration</button>
          </div>
        </div>
      )}
      <ToastContainer />
    </div>
  );
}