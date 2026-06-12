import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import api from "../../services/api";
import { calculateCartOfferPricing, fetchAllOffers, getActiveFarmerOffers } from "../../utils/offers";
import "./CheckoutPage.css";

const indiaStates = [
  { name: "Andhra Pradesh", districts: ["Anantapur", "Chittoor", "East Godavari", "Guntur", "Krishna", "Kurnool", "Nellore", "Prakasam", "Srikakulam", "Sri Sathya Sai", "Tirupati", "Visakhapatnam", "Vizianagaram", "West Godavari"] },
  { name: "Arunachal Pradesh", districts: ["Anjaw", "Changlang", "Dibang Valley", "East Kameng", "East Siang", "Kamle", "Kra Daadi", "Kurung Kumey", "Lohit", "Longding", "Lower Dibang Valley", "Lower Siang", "Lower Subansiri", "Namsai", "Papum Pare", "Shi Yomi", "Siang", "Tawang", "Tirap", "Upper Siang", "Upper Subansiri", "West Kameng", "West Siang"] },
  { name: "Assam", districts: ["Baksa", "Barpeta", "Biswanath", "Bongaigaon", "Cachar", "Charaideo", "Chirang", "Darrang", "Dhemaji", "Dhubri", "Dibrugarh", "Dima Hasao", "Goalpara", "Golaghat", "Hailakandi", "Hojai", "Jorhat", "Kamrup", "Kamrup Metropolitan", "Karbi Anglong", "Karimganj", "Kokrajhar", "Lakhimpur", "Majuli", "Morigaon", "Nagaon", "Nalbari", "Sivasagar", "Sonitpur", "South Salmara-Mankachar", "Tinsukia", "Udalguri", "West Karbi Anglong"] },
  { name: "Bihar", districts: ["Araria", "Arwal", "Aurangabad", "Banka", "Begusarai", "Bhagalpur", "Bhojpur", "Buxar", "Darbhanga", "East Champaran", "Gaya", "Gopalganj", "Jamui", "Jehanabad", "Kaimur", "Katihar", "Khagaria", "Kishanganj", "Lakhisarai", "Madhepura", "Madhubani", "Munger", "Muzaffarpur", "Nalanda", "Nawada", "Patna", "Purnia", "Rohtas", "Saharsa", "Samastipur", "Saran", "Sheikhpura", "Sheohar", "Sitamarhi", "Siwan", "Supaul", "Vaishali", "West Champaran"] },
  { name: "Chhattisgarh", districts: ["Balod", "Baloda Bazar", "Balrampur", "Bastar", "Bemetara", "Bijapur", "Bilaspur", "Dakshin Bastar Dantewada", "Dantewada", "Dhamtari", "Durg", "Gariaband", "Janjgir-Champa", "Jashpur", "Kabirdham", "Kanker", "Kondagaon", "Korba", "Koriya", "Mahasamund", "Mungeli", "Narayanpur", "Raigarh", "Raipur", "Rajnandgaon", "Sukma", "Surajpur", "Surguja"] },
  { name: "Goa", districts: ["North Goa", "South Goa"] },
  { name: "Gujarat", districts: ["Ahmedabad", "Amreli", "Anand", "Aravalli", "Banaskantha", "Bharuch", "Bhavnagar", "Botad", "Chhota Udaipur", "Dahod", "Dang", "Devbhoomi Dwarka", "Gandhinagar", "Gir Somnath", "Jamnagar", "Junagadh", "Kheda", "Kutch", "Mahisagar", "Mehsana", "Morbi", "Narmada", "Navsari", "Panchmahal", "Patan", "Porbandar", "Rajkot", "Sabarkantha", "Surat", "Surendranagar", "Tapi", "Vadodara", "Valsad"] },
  { name: "Haryana", districts: ["Ambala", "Bhiwani", "Charkhi Dadri", "Faridabad", "Fatehabad", "Gurugram", "Hisar", "Jhajjar", "Jind", "Kaithal", "Karnal", "Kurukshetra", "Mahendragarh", "Nuh", "Palwal", "Panchkula", "Panipat", "Rewari", "Rohtak", "Sirsa", "Sonipat", "Yamunanagar"] },
  { name: "Himachal Pradesh", districts: ["Bilaspur", "Chamba", "Hamirpur", "Kangra", "Kinnaur", "Kullu", "Lahaul and Spiti", "Mandi", "Shimla", "Sirmaur", "Solan", "Una"] },
  { name: "Jharkhand", districts: ["Bokaro", "Chatra", "Deoghar", "Dhanbad", "Dumka", "East Singhbhum", "Garhwa", "Giridih", "Godda", "Gumla", "Hazaribagh", "Jamtara", "Khunti", "Koderma", "Latehar", "Lohardaga", "Pakur", "Palamu", "Ramgarh", "Ranchi", "Sahibganj", "Seraikela Kharsawan", "Simdega", "West Singhbhum"] },
  { name: "Karnataka", districts: ["Bagalkot", "Ballari", "Belagavi", "Bengaluru Rural", "Bengaluru Urban", "Bidar", "Chamarajanagar", "Chikballapur", "Chikkamagaluru", "Chitradurga", "Dakshina Kannada", "Davanagere", "Dharwad", "Gadag", "Hassan", "Haveri", "Kalaburagi", "Kodagu", "Kolar", "Koppal", "Mandya", "Mysuru", "Raichur", "Ramanagara", "Shivamogga", "Tumakuru", "Udupi", "Uttara Kannada", "Vijayapura", "Yadgir"] },
  { name: "Kerala", districts: ["Alappuzha", "Ernakulam", "Idukki", "Kannur", "Kasaragod", "Kollam", "Kottayam", "Kozhikode", "Malappuram", "Palakkad", "Pathanamthitta", "Thiruvananthapuram", "Thrissur", "Wayanad"] },
  { name: "Madhya Pradesh", districts: ["Alirajpur", "Anuppur", "Ashoknagar", "Balaghat", "Barwani", "Betul", "Bhind", "Bhopal", "Burhanpur", "Chhatarpur", "Chhindwara", "Damoh", "Datia", "Dewas", "Dhar", "Dindori", "Guna", "Gwalior", "Harda", "Hoshangabad", "Indore", "Jabalpur", "Jhabua", "Katni", "Khandwa", "Khargone", "Mandla", "Mandsaur", "Morena", "Narsinghpur", "Panna", "Raisen", "Rajgarh", "Ratlam", "Rewa", "Sagar", "Satna", "Sehore", "Seoni", "Shahdol", "Shajapur", "Sheopur", "Shivpuri", "Sidhi", "Singrauli", "Tikamgarh", "Ujjain", "Umaria", "Vidisha"] },
  { name: "Maharashtra", districts: ["Ahmednagar", "Akola", "Amravati", "Aurangabad", "Beed", "Bhandara", "Buldhana", "Chandrapur", "Dhule", "Gadchiroli", "Gondia", "Hingoli", "Jalgaon", "Jalna", "Kolhapur", "Latur", "Mumbai City", "Mumbai Suburban", "Nagpur", "Nanded", "Nandurbar", "Nashik", "Osmanabad", "Palghar", "Parbhani", "Pune", "Raigad", "Ratnagiri", "Sangli", "Satara", "Sindhudurg", "Solapur", "Thane", "Wardha", "Washim", "Yavatmal"] },
  { name: "Manipur", districts: ["Bishnupur", "Chandel", "Churachandpur", "Imphal East", "Imphal West", "Jiribam", "Kakching", "Kamjong", "Kangpokpi", "Noney", "Pherzawl", "Senapati", "Tamenglong", "Tengnoupal", "Thoubal", "Ukhrul"] },
  { name: "Meghalaya", districts: ["East Garo Hills", "East Jaintia Hills", "East Khasi Hills", "North Garo Hills", "Ri Bhoi", "South Garo Hills", "South West Garo Hills", "South West Khasi Hills", "West Garo Hills", "West Jaintia Hills", "West Khasi Hills"] },
  { name: "Mizoram", districts: ["Aizawl", "Champhai", "Hnahthial", "Khawzawl", "Kolasib", "Lawngtlai", "Lunglei", "Mamit", "Saiha", "Saitual", "Serchhip", "Siaha"] },
  { name: "Nagaland", districts: ["Dimapur", "Kiphire", "Kohima", "Longleng", "Mokokchung", "Mon", "Peren", "Phek", "Tuensang", "Wokha", "Zunheboto"] },
  { name: "Odisha", districts: ["Angul", "Balangir", "Balasore", "Bargarh", "Bhadrak", "Boudh", "Cuttack", "Deogarh", "Dhenkanal", "Gajapati", "Ganjam", "Jagatsinghpur", "Jajpur", "Jharsuguda", "Kalahandi", "Kandhamal", "Kendrapara", "Kendujhar", "Khordha", "Koraput", "Malkangiri", "Mayurbhanj", "Nabarangpur", "Nayagarh", "Nuapada", "Puri", "Rayagada", "Sambalpur", "Sonepur", "Sundergarh"] },
  { name: "Punjab", districts: ["Amritsar", "Barnala", "Bathinda", "Faridkot", "Fatehgarh Sahib", "Fazilka", "Ferozepur", "Gurdaspur", "Hoshiarpur", "Jalandhar", "Kapurthala", "Ludhiana", "Mansa", "Moga", "Muktsar", "Nawanshahr", "Pathankot", "Patiala", "Rupnagar", "Sangrur", "Shaheed Bhagat Singh Nagar", "Tarn Taran"] },
  { name: "Rajasthan", districts: ["Ajmer", "Alwar", "Banswara", "Baran", "Barmer", "Bharatpur", "Bhilwara", "Bikaner", "Bundi", "Chittorgarh", "Churu", "Dausa", "Dholpur", "Dungarpur", "Hanumangarh", "Jaipur", "Jaisalmer", "Jalor", "Jhalawar", "Jhunjhunu", "Jodhpur", "Karauli", "Kota", "Nagaur", "Pali", "Pratapgarh", "Rajsamand", "Sawai Madhopur", "Sikar", "Sirohi", "Sri Ganganagar", "Tonk", "Udaipur"] },
  { name: "Sikkim", districts: ["East Sikkim", "North Sikkim", "South Sikkim", "West Sikkim"] },
  { name: "Tamil Nadu", districts: ["Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore", "Dharmapuri", "Dindigul", "Erode", "Kallakurichi", "Kanchipuram", "Kanniyakumari", "Karur", "Krishnagiri", "Madurai", "Mayiladuthurai", "Nagapattinam", "Namakkal", "Nilgiris", "Perambalur", "Pudukkottai", "Ramanathapuram", "Ranipet", "Salem", "Sivaganga", "Tenkasi", "Thanjavur", "Theni", "Thoothukudi", "Tiruchirappalli", "Tirunelveli", "Tirupattur", "Tiruppur", "Tiruvallur", "Tiruvannamalai", "Vellore", "Viluppuram", "Virudhunagar"] },
  { name: "Telangana", districts: ["Adilabad", "Bhadradri Kothagudem", "Hyderabad", "Jagtial", "Jangaon", "Jayashankar Bhupalpally", "Jogulamba Gadwal", "Kamareddy", "Karimnagar", "Khammam", "Komaram Bheem Asifabad", "Mahabubabad", "Mahbubnagar", "Medak", "Medchal Malkajgiri", "Mulugu", "Nagarkurnool", "Nalgonda", "Narayanpet", "Nirmal", "Nizamabad", "Peddapalli", "Rajanna Sircilla", "Rangareddy", "Sangareddy", "Siddipet", "Suryapet", "Vikarabad", "Wanaparthy", "Warangal Rural", "Warangal Urban", "Yadadri Bhuvanagiri"] },
  { name: "Tripura", districts: ["Dhalai", "Gomati", "Khowai", "North Tripura", "Sepahijala", "South Tripura", "Unakoti", "West Tripura"] },
  { name: "Uttar Pradesh", districts: ["Agra", "Aligarh", "Ambedkar Nagar", "Amethi", "Amroha", "Auraiya", "Azamgarh", "Baghpat", "Bahraich", "Ballia", "Balrampur", "Banda", "Barabanki", "Bareilly", "Basti", "Bhadohi", "Bijnor", "Budaun", "Bulandshahr", "Chandauli", "Chitrakoot", "Deoria", "Etah", "Etawah", "Farrukhabad", "Fatehpur", "Firozabad", "Gautam Buddha Nagar", "Ghaziabad", "Ghazipur", "Gonda", "Gorakhpur", "Hamirpur", "Hardoi", "Hathras", "Jalaun", "Jaunpur", "Jhansi", "Kannauj", "Kanpur Dehat", "Kanpur Nagar", "Kasganj", "Kaushambi", "Kheri", "Kushinagar", "Lalitpur", "Lucknow", "Maharajganj", "Mainpuri", "Mathura", "Mau", "Meerut", "Mirzapur", "Moradabad", "Muzaffarnagar", "Pilibhit", "Pratapgarh", "Rae Bareli", "Rampur", "Saharanpur", "Sambhal", "Sant Kabir Nagar", "Shahjahanpur", "Shamli", "Shravasti", "Siddharthnagar", "Sitapur", "Sonbhadra", "Sultanpur", "Unnao", "Varanasi"] },
  { name: "Uttarakhand", districts: ["Almora", "Bageshwar", "Chamoli", "Champawat", "Dehradun", "Haridwar", "Nainital", "Pauri Garhwal", "Pithoragarh", "Rudraprayag", "Tehri Garhwal", "Udham Singh Nagar", "Uttarkashi"] },
  { name: "West Bengal", districts: ["Alipurduar", "Bankura", "Birbhum", "Cooch Behar", "Darjeeling", "Hooghly", "Howrah", "Jalpaiguri", "Jhargram", "Kalimpong", "Kolkata", "Malda", "Murshidabad", "Nadia", "North 24 Parganas", "Paschim Bardhaman", "Paschim Medinipur", "Purba Bardhaman", "Purba Medinipur", "Purulia", "South 24 Parganas", "Uttar Dinajpur"] },
  { name: "Andaman and Nicobar Islands", districts: ["Nicobar", "North and Middle Andaman", "South Andaman"] },
  { name: "Chandigarh", districts: ["Chandigarh"] },
  { name: "Dadra and Nagar Haveli and Daman and Diu", districts: ["Dadra and Nagar Haveli", "Daman", "Diu"] },
  { name: "Delhi", districts: ["Central Delhi", "East Delhi", "New Delhi", "North Delhi", "North East Delhi", "North West Delhi", "South Delhi", "South East Delhi", "South West Delhi", "West Delhi"] },
  { name: "Jammu and Kashmir", districts: ["Anantnag", "Bandipora", "Baramulla", "Budgam", "Doda", "Ganderbal", "Jammu", "Kathua", "Kishtwar", "Kulgam", "Kupwara", "Poonch", "Pulwama", "Rajauri", "Ramban", "Reasi", "Samba", "Shopian", "Srinagar", "Udhampur"] },
  { name: "Ladakh", districts: ["Kargil", "Leh"] },
  { name: "Lakshadweep", districts: ["Lakshadweep"] },
  { name: "Puducherry", districts: ["Karaikal", "Mahe", "Puducherry", "Yanam"] },
];

function CheckoutPage() {
  const { cartItems, fetchCart } = useCart();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [shipping, setShipping] = useState({
    fullName: "",
    phone: "",
    house: "",
    landmark: "",
    state: "",
    district: "",
    pincode: "",
  });
  const [savedProfile, setSavedProfile] = useState(null);
  const [addressMode, setAddressMode] = useState("saved");
  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [offers, setOffers] = useState([]);
  const [locationFetching, setLocationFetching] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [locationCoords, setLocationCoords] = useState(null);
  const [suggestedAddress, setSuggestedAddress] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("agromart_profile");
    if (stored) {
      const parsed = JSON.parse(stored);
      setSavedProfile(parsed);
      if (parsed?.address) {
        applySavedAddress(parsed);
      }
    } else {
      setAddressMode("new");
    }
  }, []);

  useEffect(() => {
    const loadOffers = async () => {
      try {
        const offersData = await fetchAllOffers();
        setOffers(getActiveFarmerOffers(offersData));
      } catch (err) {
        console.error("Error loading checkout offers:", err);
      }
    };
    loadOffers();
  }, []);

  const applySavedAddress = (profile) => {
    if (!profile || !profile.address) return;
    const { fullName, phone, address } = profile;
    setShipping({
      fullName: fullName || "",
      phone: phone || "",
      house: address.street || "",
      landmark: address.landmark || "",
      state: address.state || "",
      district: address.district || address.city || "",
      pincode: address.pincode || "",
    });
  };

  const handleFetchLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }

    setLocationError("");
    setSuggestedAddress(null);
    setLocationFetching(true);

    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      setLocationCoords({ lat: latitude, lng: longitude });

      try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`;
        const response = await fetch(url, {
          headers: { 'Accept': 'application/json' }
        });
        const data = await response.json();
        const address = data.address || {};

        const house = [address.house_number, address.road, address.neighbourhood, address.suburb].filter(Boolean).join(", ");
        const landmark = address.landmark || address.neighbourhood || address.suburb || address.village || "";
        const district = address.county || address.city_district || address.city || address.town || address.village || "";
        const state = address.state || "";
        const pincode = address.postcode || "";
        const fullText = [house, landmark, district, state, pincode].filter(Boolean).join(", ");

        if (!house && !district && !pincode) {
          setLocationError("Unable to resolve a complete address from your location. Please enter your address manually.");
          setSuggestedAddress(null);
        } else {
          setSuggestedAddress({ house, landmark, district, state, pincode, fullText });
        }
      } catch (err) {
        console.error("Reverse geocoding error:", err);
        setLocationError("Unable to resolve address from your location.");
        setSuggestedAddress(null);
      } finally {
        setLocationFetching(false);
      }
    }, (err) => {
      console.error("Geolocation error:", err);
      setLocationError("Could not fetch your location. Please allow location access or enter your address manually.");
      setLocationFetching(false);
      setSuggestedAddress(null);
    }, { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 });
  };

  const applySuggestedAddress = () => {
    if (!suggestedAddress) return;
    setShipping((prev) => ({
      ...prev,
      house: suggestedAddress.house || prev.house,
      landmark: suggestedAddress.landmark || prev.landmark,
      district: suggestedAddress.district || prev.district,
      state: suggestedAddress.state || prev.state,
      pincode: suggestedAddress.pincode || prev.pincode,
    }));
    setSuggestedAddress(null);
    setLocationError("");
  };

  const validateStep1 = () => {
    if (!shipping.fullName || !shipping.phone || !shipping.house || !shipping.state || !shipping.district || !shipping.pincode) {
      setError("Please fill all mandatory shipping fields.");
      return false;
    }
    if (!/^\d{10}$/.test(shipping.phone)) {
      setError("Phone number must be 10 digits.");
      return false;
    }
    if (!/^\d{6}$/.test(shipping.pincode)) {
      setError("Pincode must be 6 digits.");
      return false;
    }
    setError("");
    return true;
  };

  const handleNext = () => {
    if (validateStep1()) setStep(2);
  };

  const validCartItems = useMemo(
    () => cartItems.filter((item) => item.productId && Number(item.quantity) > 0),
    [cartItems]
  );

  const pricedCartItems = useMemo(
    () => calculateCartOfferPricing(offers, validCartItems),
    [offers, validCartItems]
  );

  const subtotal = pricedCartItems.reduce((sum, item) => sum + item.pricing.total, 0);
  const totalDiscount = pricedCartItems.reduce((sum, item) => sum + item.pricing.discount, 0);
  const discountedSubtotal = pricedCartItems.reduce((sum, item) => sum + item.pricing.finalTotal, 0);
  const deliveryFee = discountedSubtotal > 500 ? 0 : 50;
  const gst = discountedSubtotal * 0.05;
  const totalAmount = discountedSubtotal + deliveryFee + gst;

  const handlePlaceOrder = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const payload = {
        items: pricedCartItems.map((item) => ({
          productId: item.productId?._id || item.productId,
          name: item.productId?.name || "",
          price: Number(item.pricing.finalUnitPrice.toFixed(2)),
          quantity: Number(item.quantity),
        })),
        shipping: { ...shipping, city: shipping.district },
        productTotal: discountedSubtotal,
        deliveryFee,
        gst,
        amount: Number(totalAmount.toFixed(2)),
      };

      const orderResponse = await api.post("/orders/create", payload, { headers });
      const { razorpayOrderId, amount: rzpAmount, currency, key } = orderResponse.data;

      const options = {
        key: key || process.env.REACT_APP_RAZORPAY_KEY_ID,
        amount: rzpAmount,
        currency: currency || "INR",
        name: "AgroMart",
        order_id: razorpayOrderId,
        prefill: { name: shipping.fullName, contact: shipping.phone },
        handler: async (response) => {
          try {
            const verify = await api.post("/orders/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }, { headers });

            if (verify.data.paymentStatus === "paid") {
              await fetchCart();
              navigate("/order-confirmation", {
                state: {
                  shipping,
                  orderConfirmation: {
                    paymentStatus: "Success",
                    razorpayOrderId: response.razorpay_order_id,
                    razorpayPaymentId: response.razorpay_payment_id,
                  },
                  orderItems: validCartItems,
                  orderId: verify.data.orderId
                },
              });
            }
          } catch (e) {
            alert("Verification failed.");
          } finally {
            setIsProcessing(false);
          }
        },
        modal: { ondismiss: () => setIsProcessing(false) }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      alert("Checkout failed. Please try again.");
      setIsProcessing(false);
    }
  };

  if (!validCartItems.length) {
    return (
      <div className="checkout-page">
        <div className="checkout-card empty-state">
          <h2>Your cart is empty</h2>
          <button className="add-cart-btn" onClick={() => navigate("/customer")}>Browse Products</button>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="checkout-card">
        <div className="checkout-header">
          <h2>Secure Checkout</h2>
        </div>

        <div className="checkout-steps">
          <div className={`checkout-step ${step === 1 ? "active" : ""}`}>1. Shipping Details</div>
          <div className={`checkout-step ${step === 2 ? "active" : ""}`}>2. Review & Confirm</div>
        </div>

        <div className="checkout-body">
          {step === 1 ? (
            <div className="checkout-form">
              {savedProfile && (
                <div className="edit-field">
                  <label>Select Address</label>
                  <select value={addressMode} onChange={(e) => {
                    setAddressMode(e.target.value);
                    if (e.target.value === "saved") applySavedAddress(savedProfile);
                    else setShipping({ fullName: "", phone: "", house: "", landmark: "", state: "", district: "", pincode: "" });
                  }}>
                    <option value="saved">Saved Address</option>
                    <option value="new">New Address</option>
                  </select>
                </div>
              )}
              <div className="edit-field">
                <label>Full Name</label>
                <input type="text" value={shipping.fullName} onChange={(e) => setShipping({ ...shipping, fullName: e.target.value })} />
              </div>
              <div className="edit-field">
                <label>Phone Number</label>
                <input type="tel" value={shipping.phone} onChange={(e) => setShipping({ ...shipping, phone: e.target.value })} />
              </div>
              <div className="edit-field">
                <label>House / Street / Area</label>
                <input type="text" value={shipping.house} onChange={(e) => setShipping({ ...shipping, house: e.target.value })} />
              </div>
              <div className="location-row">
                <button type="button" className="fetch-location-btn" onClick={handleFetchLocation} disabled={locationFetching}>
                  {locationFetching ? "Fetching location…" : "Use My Current Location"}
                </button>
                {locationCoords && (
                  <span className="location-info">Live coordinates: {locationCoords.lat.toFixed(4)}, {locationCoords.lng.toFixed(4)}</span>
                )}
              </div>
              {suggestedAddress && (
                <div className="suggestion-card">
                  <div className="suggestion-title">Suggested address from current location</div>
                  <p className="suggested-value">{suggestedAddress.fullText}</p>
                  <div className="suggestion-actions">
                    <button type="button" className="fetch-location-btn apply-suggestion-btn" onClick={applySuggestedAddress}>
                      Use Suggested Address
                    </button>
                    <button type="button" className="back-link-btn clear-suggestion-btn" onClick={() => setSuggestedAddress(null)}>
                      Enter Manually
                    </button>
                  </div>
                </div>
              )}
              {locationError && <p className="error-text">{locationError}</p>}
              <div className="edit-row">
                <div className="edit-field">
                  <label>State</label>
                  <select value={shipping.state} onChange={(e) => {
                    const stateData = indiaStates.find(s => s.name === e.target.value);
                    setShipping({ ...shipping, state: e.target.value, district: stateData ? stateData.districts[0] : "" });
                  }}>
                    <option value="">Select State</option>
                    {indiaStates.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                    {shipping.state && !indiaStates.some(s => s.name === shipping.state) && (
                      <option value={shipping.state}>{shipping.state}</option>
                    )}
                  </select>
                </div>
                <div className="edit-field">
                  <label>District</label>
                  <select value={shipping.district} onChange={(e) => setShipping({ ...shipping, district: e.target.value })} disabled={!shipping.state}>
                    {(indiaStates.find(s => s.name === shipping.state)?.districts || []).map(d => <option key={d} value={d}>{d}</option>)}
                    {shipping.district && !indiaStates.find(s => s.name === shipping.state)?.districts.includes(shipping.district) && (
                      <option value={shipping.district}>{shipping.district}</option>
                    )}
                  </select>
                </div>
              </div>
              <div className="edit-field">
                <label>Pincode</label>
                <input type="text" value={shipping.pincode} onChange={(e) => setShipping({ ...shipping, pincode: e.target.value })} />
              </div>
              {error && <p className="error-text">{error}</p>}
              <div className="action-row">
                <button className="add-cart-btn" onClick={handleNext}>Review Order</button>
                <button className="delete-btn" onClick={() => navigate("/cart")}>Return to Cart</button>
              </div>
            </div>
          ) : (
            <div className="checkout-review-container">
              <div className="review-section">
                <div className="section-title-wrapper">
                  <i className="fas fa-truck-fast"></i>
                  <h3>Shipping Details</h3>
                </div>
                <div className="review-info-card">
                  <div className="user-profile-brief">
                    <div className="profile-icon">{shipping.fullName.charAt(0)}</div>
                    <div className="profile-details">
                      <strong>{shipping.fullName}</strong>
                      <span>{shipping.phone}</span>
                    </div>
                  </div>
                  <div className="address-badge">
                    <i className="fas fa-location-dot"></i>
                    <p>{shipping.house}, {shipping.landmark}, {shipping.district}, {shipping.state} - {shipping.pincode}</p>
                  </div>
                </div>
              </div>

              <div className="review-section">
                <div className="section-title-wrapper">
                  <i className="fas fa-basket-shopping"></i>
                  <h3>Order Summary</h3>
                </div>
                <div className="order-items-list">
                  {pricedCartItems.map((item) => (
                    <div className="summary-item-row" key={item._id}>
                      <div className="item-main">
                        <span className="item-name">{item.productId?.name}</span>
                        <span className="item-qty">Qty: {item.quantity} {item.productId?.unit}</span>
                      </div>
                      <div className="item-price">
                        {item.pricing.discount > 0 && <span className="old-price">₹{item.pricing.total.toFixed(0)}</span>}
                        <span className="final-price">₹{item.pricing.finalTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="price-breakdown-card">
                  <div className="price-row">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  {totalDiscount > 0 && (
                    <div className="price-row discount">
                      <span>Farmer Offer Applied</span>
                      <span>-₹{totalDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="price-row">
                    <span>Delivery Fee</span>
                    <span className={deliveryFee === 0 ? "free-delivery" : ""}>
                      {deliveryFee === 0 ? "FREE" : `₹${deliveryFee.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="price-row">
                    <span>GST (5%)</span>
                    <span>₹{gst.toFixed(2)}</span>
                  </div>
                  <div className="price-row grand-total">
                    <span>Total Amount</span>
                    <span>₹{totalAmount.toFixed(2)}</span>
                  </div>
                </div>

                <div className="action-row vertical">
                  <button className="add-cart-btn checkout-pay-btn" onClick={handlePlaceOrder} disabled={isProcessing}>
                    {isProcessing ? (
                      <span className="loader-text"><i className="fas fa-circle-notch fa-spin"></i> Processing...</span>
                    ) : (
                      <>Pay ₹{totalAmount.toFixed(2)} Securely <i className="fas fa-arrow-right"></i></>
                    )}
                  </button>
                  <button className="back-link-btn" onClick={() => setStep(1)} disabled={isProcessing}>
                    Edit Shipping Information
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CheckoutPage;
