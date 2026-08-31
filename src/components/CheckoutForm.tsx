import React, { useState, useEffect, useCallback } from "react";

export interface CheckoutFormData {
  fullName: string;
  phoneNumber: string;
  emailAddress: string;
  deliveryAddress: string;
  pincode: string;
  city: string;
  state: string;
  orderNote: string;
  paymentMethod: "COD" | "UPI" | "Card";
}

export interface PostOfficeRecord {
  Name: string;
  Description: string | null;
  BranchType: string;
  DeliveryStatus: string;
  Circle: string;
  District: string;
  Division: string;
  Region: string;
  Block: string;
  State: string;
  Country: string;
  Pincode: string;
}

export interface PostalApiResponse {
  Message: string;
  Status: "Success" | "Error";
  PostOffice: PostOfficeRecord[] | null;
}

export interface CheckoutFormProps {
  onSuccess?: (data: CheckoutFormData) => void;
  onCancel?: () => void;
  initialData?: Partial<CheckoutFormData>;
}

/**
 * Calculates delivery timeline based on Indian state:
 * - Uttar Pradesh: "Estimated Delivery: 1-2 Days"
 * - Delhi, Maharashtra, Karnataka: "Estimated Delivery: 3-4 Days"
 * - All other states: "Estimated Delivery: 5-7 Days"
 */
export const calculateDeliveryTimeline = (state: string): string => {
  const normalized = (state || "").trim().toLowerCase();
  if (normalized === "uttar pradesh") {
    return "Estimated Delivery: 1-2 Days";
  }
  if (["delhi", "maharashtra", "karnataka"].includes(normalized)) {
    return "Estimated Delivery: 3-4 Days";
  }
  return "Estimated Delivery: 5-7 Days";
};

export const CheckoutForm: React.FC<CheckoutFormProps> = ({
  onSuccess,
  onCancel,
  initialData
}) => {
  const [formData, setFormData] = useState<CheckoutFormData>({
    fullName: initialData?.fullName || "",
    phoneNumber: initialData?.phoneNumber || "",
    emailAddress: initialData?.emailAddress || "",
    deliveryAddress: initialData?.deliveryAddress || "",
    pincode: initialData?.pincode || "",
    city: initialData?.city || "",
    state: initialData?.state || "",
    orderNote: initialData?.orderNote || "",
    paymentMethod: initialData?.paymentMethod || "COD"
  });

  const [isLoadingPin, setIsLoadingPin] = useState<boolean>(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [deliveryTimeline, setDeliveryTimeline] = useState<string | null>(null);

  // Fetch City and State from postal API when 6-digit PIN code is reached
  useEffect(() => {
    const cleanPin = formData.pincode.replace(/\D/g, "");

    if (cleanPin.length !== 6) {
      setPinError(null);
      setDeliveryTimeline(null);
      return;
    }

    const abortController = new AbortController();
    setIsLoadingPin(true);
    setPinError(null);

    const fetchPincodeDetails = async () => {
      try {
        const response = await fetch(`https://api.postalpincode.in/pincode/${cleanPin}`, {
          signal: abortController.signal
        });

        if (!response.ok) {
          throw new Error("Network response was not ok");
        }

        const data: PostalApiResponse[] = await response.json();

        if (
          Array.isArray(data) &&
          data[0]?.Status === "Success" &&
          Array.isArray(data[0]?.PostOffice) &&
          data[0].PostOffice.length > 0
        ) {
          const postOffice = data[0].PostOffice[0];
          const fetchedDistrict = postOffice.District || postOffice.Name || "";
          const fetchedState = postOffice.State || "";

          setFormData((prev) => ({
            ...prev,
            city: fetchedDistrict,
            state: fetchedState
          }));

          const timeline = calculateDeliveryTimeline(fetchedState);
          setDeliveryTimeline(timeline);
          setPinError(null);
        } else {
          // Invalid PIN response
          setFormData((prev) => ({
            ...prev,
            city: "",
            state: ""
          }));
          setDeliveryTimeline(null);
          setPinError("Invalid PIN");
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }
        setFormData((prev) => ({
          ...prev,
          city: "",
          state: ""
        }));
        setDeliveryTimeline(null);
        setPinError("Invalid PIN");
      } finally {
        setIsLoadingPin(false);
      }
    };

    fetchPincodeDetails();

    return () => {
      abortController.abort();
    };
  }, [formData.pincode]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;

      if (name === "pincode") {
        // Enforce numeric only and max 6 digits
        const numeric = value.replace(/\D/g, "").slice(0, 6);
        setFormData((prev) => ({ ...prev, pincode: numeric }));
        return;
      }

      if (name === "phoneNumber") {
        const numeric = value.replace(/\D/g, "").slice(0, 10);
        setFormData((prev) => ({ ...prev, phoneNumber: numeric }));
        return;
      }

      setFormData((prev) => ({ ...prev, [name]: value }));
    },
    []
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.phoneNumber || !formData.deliveryAddress || !formData.pincode) {
      return;
    }
    if (onSuccess) {
      onSuccess(formData);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-[#fcf8f2] border border-[#d8b36a]/30 rounded-2xl p-6 sm:p-8 shadow-2xl text-[#29160c]">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="font-serif text-2xl sm:text-3xl text-[#29160c] tracking-tight">
          Express Secure Checkout
        </h2>
        <p className="text-xs text-[#6d5d4d] mt-1">
          Complimentary insured delivery &amp; handcrafted velvet gift box included
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name */}
        <div>
          <label className="block text-[11px] font-semibold tracking-wider text-[#29160c] uppercase mb-1">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="fullName"
            required
            value={formData.fullName}
            onChange={handleInputChange}
            placeholder="e.g. Radhika Sharma"
            className="w-full px-3.5 py-2.5 bg-white border border-[#b4823c]/30 rounded-lg text-sm text-[#29160c] outline-none focus:border-[#d4a843] focus:ring-2 focus:ring-[#d4a843]/20 transition"
          />
        </div>

        {/* Phone & Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold tracking-wider text-[#29160c] uppercase mb-1">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              name="phoneNumber"
              required
              value={formData.phoneNumber}
              onChange={handleInputChange}
              placeholder="e.g. 9876543210"
              maxLength={10}
              className="w-full px-3.5 py-2.5 bg-white border border-[#b4823c]/30 rounded-lg text-sm text-[#29160c] outline-none focus:border-[#d4a843] focus:ring-2 focus:ring-[#d4a843]/20 transition"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold tracking-wider text-[#29160c] uppercase mb-1">
              Email Address <span className="text-[#6d5d4d] font-normal">(Optional)</span>
            </label>
            <input
              type="email"
              name="emailAddress"
              value={formData.emailAddress}
              onChange={handleInputChange}
              placeholder="e.g. radhika@example.com"
              className="w-full px-3.5 py-2.5 bg-white border border-[#b4823c]/30 rounded-lg text-sm text-[#29160c] outline-none focus:border-[#d4a843] focus:ring-2 focus:ring-[#d4a843]/20 transition"
            />
          </div>
        </div>

        {/* Delivery Address */}
        <div>
          <label className="block text-[11px] font-semibold tracking-wider text-[#29160c] uppercase mb-1">
            Delivery Address <span className="text-red-500">*</span>
          </label>
          <textarea
            name="deliveryAddress"
            required
            rows={2}
            value={formData.deliveryAddress}
            onChange={handleInputChange}
            placeholder="House/Flat No, Apartment/Street, Landmark"
            className="w-full px-3.5 py-2.5 bg-white border border-[#b4823c]/30 rounded-lg text-sm text-[#29160c] outline-none focus:border-[#d4a843] focus:ring-2 focus:ring-[#d4a843]/20 transition resize-none"
          />
        </div>

        {/* PIN Code, City, State Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-semibold tracking-wider text-[#29160c] uppercase mb-1">
              PIN Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="pincode"
              required
              inputMode="numeric"
              maxLength={6}
              value={formData.pincode}
              onChange={handleInputChange}
              placeholder="e.g. 110001"
              className={`w-full px-3.5 py-2.5 bg-white border rounded-lg text-sm text-[#29160c] outline-none transition ${
                pinError
                  ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                  : "border-[#b4823c]/30 focus:border-[#d4a843] focus:ring-2 focus:ring-[#d4a843]/20"
              }`}
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold tracking-wider text-[#29160c] uppercase mb-1">
              City
            </label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              placeholder="City"
              className="w-full px-3.5 py-2.5 bg-white border border-[#b4823c]/30 rounded-lg text-sm text-[#29160c] outline-none focus:border-[#d4a843] focus:ring-2 focus:ring-[#d4a843]/20 transition"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold tracking-wider text-[#29160c] uppercase mb-1">
              State
            </label>
            <input
              type="text"
              name="state"
              value={formData.state}
              onChange={handleInputChange}
              placeholder="State"
              className="w-full px-3.5 py-2.5 bg-white border border-[#b4823c]/30 rounded-lg text-sm text-[#29160c] outline-none focus:border-[#d4a843] focus:ring-2 focus:ring-[#d4a843]/20 transition"
            />
          </div>
        </div>

        {/* PIN Code Status / Timeline Banner */}
        {isLoadingPin && (
          <div className="flex items-center gap-2 p-2.5 text-xs text-[#7b581e] bg-[#b8862d]/10 border border-[#b8862d]/25 rounded-md animate-pulse">
            <span>⚡ Verifying PIN code &amp; fetching delivery timeline…</span>
          </div>
        )}

        {pinError && (
          <div className="p-2.5 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-md">
            {pinError}
          </div>
        )}

        {deliveryTimeline && formData.state && !pinError && (
          <div className="flex items-center justify-between p-2.5 text-xs text-green-800 bg-green-50 border border-green-200 rounded-md">
            <span className="truncate">
              📍 <strong>{formData.city ? `${formData.city}, ` : ""}{formData.state}</strong>
            </span>
            <span className="font-semibold px-2 py-0.5 bg-green-100 text-green-900 rounded text-[11px] shrink-0 ml-2">
              {deliveryTimeline}
            </span>
          </div>
        )}

        {/* Gift Message / Order Note */}
        <div>
          <label className="block text-[11px] font-semibold tracking-wider text-[#29160c] uppercase mb-1">
            Gift Message / Order Note <span className="text-[#6d5d4d] font-normal">(Optional)</span>
          </label>
          <input
            type="text"
            name="orderNote"
            value={formData.orderNote}
            onChange={handleInputChange}
            placeholder="Gift card message or delivery instructions"
            className="w-full px-3.5 py-2.5 bg-white border border-[#b4823c]/30 rounded-lg text-sm text-[#29160c] outline-none focus:border-[#d4a843] focus:ring-2 focus:ring-[#d4a843]/20 transition"
          />
        </div>

        {/* Payment Methods */}
        <div className="bg-[#ebd9c3]/30 border border-[#b4823c]/20 rounded-xl p-3.5 space-y-2">
          <span className="block text-[10px] font-bold tracking-wider text-[#6d5d4d] uppercase mb-1.5">
            Payment Method
          </span>
          
          <label className="flex items-start gap-3 p-2.5 bg-white rounded-lg border border-[#b4823c]/25 cursor-pointer hover:border-[#d4a843] transition">
            <input
              type="radio"
              name="paymentMethod"
              value="COD"
              checked={formData.paymentMethod === "COD"}
              onChange={() => setFormData((p) => ({ ...p, paymentMethod: "COD" }))}
              className="mt-1 accent-[#8b6528]"
            />
            <div>
              <strong className="block text-xs font-semibold text-[#29160c]">
                Cash on Delivery (COD)
              </strong>
              <span className="block text-[11px] text-[#6d5d4d]">
                Pay at your doorstep upon express delivery
              </span>
            </div>
          </label>

          <label className="flex items-start gap-3 p-2.5 bg-white rounded-lg border border-[#b4823c]/25 cursor-pointer hover:border-[#d4a843] transition">
            <input
              type="radio"
              name="paymentMethod"
              value="UPI"
              checked={formData.paymentMethod === "UPI"}
              onChange={() => setFormData((p) => ({ ...p, paymentMethod: "UPI" }))}
              className="mt-1 accent-[#8b6528]"
            />
            <div>
              <strong className="block text-xs font-semibold text-[#29160c]">
                UPI Express (GPay, PhonePe, Paytm, QR)
              </strong>
              <span className="block text-[11px] text-[#6d5d4d]">
                Instant zero-fee payment confirmation
              </span>
            </div>
          </label>

          <label className="flex items-start gap-3 p-2.5 bg-white rounded-lg border border-[#b4823c]/25 cursor-pointer hover:border-[#d4a843] transition">
            <input
              type="radio"
              name="paymentMethod"
              value="Card"
              checked={formData.paymentMethod === "Card"}
              onChange={() => setFormData((p) => ({ ...p, paymentMethod: "Card" }))}
              className="mt-1 accent-[#8b6528]"
            />
            <div>
              <strong className="block text-xs font-semibold text-[#29160c]">
                Debit / Credit Card / NetBanking
              </strong>
              <span className="block text-[11px] text-[#6d5d4d]">
                100% Encrypted 256-bit bank checkout
              </span>
            </div>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 space-y-2">
          <button
            type="submit"
            className="w-full py-3.5 px-4 bg-gradient-to-r from-[#8b6528] to-[#5b3c16] text-white font-medium text-sm rounded-lg shadow-md hover:from-[#75531e] hover:to-[#462d10] transition active:scale-[0.99] cursor-pointer"
          >
            Confirm Order
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="w-full py-2.5 px-4 bg-transparent border border-[#b4823c]/40 text-[#29160c] font-medium text-xs rounded-lg hover:bg-white/50 transition cursor-pointer"
            >
              Return to Bag
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default CheckoutForm;
