import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Wind,
  UserCheck,
  Users,
  Sparkles,
  Zap,
  Gift,
  Briefcase,
  ChefHat,
  Heart,
  Phone,
  Mail,
  MapPin,
  Clock,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Star,
  Menu as MenuIcon,
  X,
  Utensils,
  Calendar,
  Coffee,
  ShoppingCart,
  Plus,
  Minus,
  Send,
  Check,
  Award,
  History,
  Edit3,
  Truck,
  Package,
  Search
} from "lucide-react";
import {
  MENU_ITEMS,
  FACILITIES,
  REVIEWS,
  GALLERY_ITEMS,
  MenuItem,
  Facility,
  Review,
  GalleryItem
} from "./data";
import SaraAssistant from "./components/SaraAssistant";

// Helper for Lucide icons mapping dynamically
const iconMap: Record<string, any> = {
  Wind,
  UserCheck,
  Users,
  Sparkles,
  Zap,
  Gift,
  Briefcase,
  ChefHat,
  Heart
};

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

export default function App() {
  // Navigation & UI States
  const [activeSection, setActiveSection] = useState("home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Menu Filter state
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [menuSearchQuery, setMenuSearchQuery] = useState("");

  // Interactive Cart Drawer state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [recentMeals, setRecentMeals] = useState<MenuItem[]>([]);
  const [justAddedId, setJustAddedId] = useState<string | null>(null);
  const [isCartAnimating, setIsCartAnimating] = useState(false);
  const [orderNotes, setOrderNotes] = useState("");

  // Checkout flow states: "cart" | "info-form" | "summary"
  const [checkoutStep, setCheckoutStep] = useState<"cart" | "info-form" | "summary">("cart");

  // Customer Information State with persistence
  const [customerInfo, setCustomerInfo] = useState(() => {
    try {
      const saved = localStorage.getItem("chatkara_customer_info");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Error loading customer info", e);
    }
    return {
      fullName: "",
      mobileNumber: "",
      emailAddress: "",
      deliveryAddress: "",
      city: "",
      state: "",
      postalCode: "",
      country: "India",
      landmark: ""
    };
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const validateCustomerInfo = (info: typeof customerInfo) => {
    const errors: Record<string, string> = {};
    if (!info.fullName.trim()) {
      errors.fullName = "Full name is required";
    }
    if (!info.mobileNumber.trim()) {
      errors.mobileNumber = "Mobile number is required";
    } else {
      const mobileRegex = /^\+?[0-9\s\-()]{10,15}$/;
      if (!mobileRegex.test(info.mobileNumber.trim())) {
        errors.mobileNumber = "Please enter a valid mobile format (10-15 digits)";
      }
    }
    if (!info.deliveryAddress.trim()) {
      errors.deliveryAddress = "Complete delivery address is required";
    }
    if (!info.city.trim()) {
      errors.city = "City is required";
    }
    if (!info.state.trim()) {
      errors.state = "State is required";
    }
    if (!info.postalCode.trim()) {
      errors.postalCode = "Postal/ZIP code is required";
    }
    if (!info.country.trim()) {
      errors.country = "Country is required";
    }
    if (info.emailAddress.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(info.emailAddress.trim())) {
        errors.emailAddress = "Please enter a valid email address";
      }
    }
    return errors;
  };

  const isCustomerInfoCompleted = () => {
    const errors = validateCustomerInfo(customerInfo);
    return Object.keys(errors).length === 0;
  };

  // Automatically save customer info to localStorage when updated
  useEffect(() => {
    try {
      localStorage.setItem("chatkara_customer_info", JSON.stringify(customerInfo));
    } catch (e) {
      console.error("Error saving customer info", e);
    }
  }, [customerInfo]);

  // Reset checkout step to cart when closed
  useEffect(() => {
    if (!isCartOpen) {
      setCheckoutStep("cart");
      setFormErrors({});
    }
  }, [isCartOpen]);

  // Active Order Tracking State with local persistence
  const [activeOrderTracker, setActiveOrderTracker] = useState<{
    id: string;
    status: "Confirmed" | "Preparing" | "Out for Delivery";
    itemsCount: number;
    total: number;
  } | null>(() => {
    try {
      const saved = localStorage.getItem("chatkara_active_order_tracker");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Error loading active order tracker", e);
    }
    return null;
  });

  // Automatically save/remove active order tracker to/from localStorage when updated
  useEffect(() => {
    try {
      if (activeOrderTracker) {
        localStorage.setItem("chatkara_active_order_tracker", JSON.stringify(activeOrderTracker));
      } else {
        localStorage.removeItem("chatkara_active_order_tracker");
      }
    } catch (e) {
      console.error("Error saving active order tracker", e);
    }
  }, [activeOrderTracker]);

  // Handle active order status transitioning: Confirmed -> Preparing -> Out for Delivery
  useEffect(() => {
    if (!activeOrderTracker) return;

    let timer: NodeJS.Timeout;

    if (activeOrderTracker.status === "Confirmed") {
      timer = setTimeout(() => {
        setActiveOrderTracker(prev => prev ? { ...prev, status: "Preparing" } : null);
      }, 15000); // 15 seconds
    } else if (activeOrderTracker.status === "Preparing") {
      timer = setTimeout(() => {
        setActiveOrderTracker(prev => prev ? { ...prev, status: "Out for Delivery" } : null);
      }, 15000); // 15 seconds
    }

    return () => clearTimeout(timer);
  }, [activeOrderTracker?.status]);

  const handleSaveAndProceed = () => {
    playClickSound();
    const errors = validateCustomerInfo(customerInfo);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    setCheckoutStep("summary");
  };

  // Interactive Reservation Modal
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingStep, setBookingStep] = useState<"form" | "ticket">("form");
  const [bookingDetails, setBookingDetails] = useState({
    name: "",
    phone: "",
    guests: "2",
    date: "",
    time: "19:00",
    eventType: "Casual Dining"
  });
  const [confirmedTicketId, setConfirmedTicketId] = useState("");

  // Gallery Lightbox state
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Reviews Carousel state
  const [reviewIndex, setReviewIndex] = useState(0);



  // Floating background particles
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; size: number; delay: number }[]>([]);

  // Sound effects toggles (optional haptic simulation)
  const playClickSound = () => {
    // Elegant system-like soft tick
    try {
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = context.createOscillator();
      const gain = context.createGain();
      osc.connect(gain);
      gain.connect(context.destination);
      osc.frequency.setValueAtTime(800, context.currentTime);
      gain.gain.setValueAtTime(0.01, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.00001, context.currentTime + 0.08);
      osc.start();
      osc.stop(context.currentTime + 0.08);
    } catch (e) {
      // Ignored if blocked by browser autoplay
    }
  };

  // Generate background particles once
  useEffect(() => {
    const generated = Array.from({ length: 25 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 1,
      delay: Math.random() * 5
    }));
    setParticles(generated);

    // Load recent meals from localStorage
    const stored = localStorage.getItem("chatkara_recent_meals");
    if (stored) {
      try {
        setRecentMeals(JSON.parse(stored));
      } catch (e) {
        console.error("Error reading recent meals", e);
      }
    }
  }, []);

  // Track scrolling for active sections and progress bar
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
          if (totalScroll > 0) {
            setScrollProgress((window.scrollY / totalScroll) * 100);
          }

          // Check active section
          const sections = ["home", "about", "menu", "facilities", "events", "gallery", "reviews", "contact"];
          const scrollPos = window.scrollY + 200;

          for (const section of sections) {
            const el = document.getElementById(section);
            if (el) {
              const top = el.offsetTop;
              const height = el.offsetHeight;
              if (scrollPos >= top && scrollPos < top + height) {
                setActiveSection(section);
              }
            }
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);



  // Auto rotate reviews
  useEffect(() => {
    const interval = setInterval(() => {
      setReviewIndex((prev) => (prev + 1) % REVIEWS.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // Is Restaurant Open based on system/current local time (11:00 AM to 11:00 PM)
  const isRestaurantOpen = () => {
    // Current Indian Local Standard Time hours can be fetched, but let's base it on the provided local time context
    // Local time: 2026-06-28T10:43:28-07:00
    // Let's parse current time or state
    const now = new Date();
    const hours = now.getHours();
    return hours >= 11 && hours < 23;
  };

  // Cart Handlers
  const addToCart = (item: MenuItem) => {
    playClickSound();
    setJustAddedId(item.id);
    setIsCartAnimating(true);
    
    // Clear temporary animation/check-mark states after 1.5 seconds
    setTimeout(() => {
      setJustAddedId((current) => current === item.id ? null : current);
    }, 1500);
    setTimeout(() => {
      setIsCartAnimating(false);
    }, 1500);

    setCart((prev) => {
      const existing = prev.find((i) => i.menuItem.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.menuItem.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { menuItem: item, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const updateCartQuantity = (id: string, delta: number) => {
    playClickSound();
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.menuItem.id === id) {
            return { ...item, quantity: item.quantity + delta };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => {
      const priceVal = parseInt(item.menuItem.price.replace("₹", ""));
      return total + priceVal * item.quantity;
    }, 0);
  };

  const handleCheckoutWhatsApp = () => {
    playClickSound();
    
    // First, validate inputs completely
    const errors = validateCustomerInfo(customerInfo);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setCheckoutStep("info-form");
      return;
    }

    const phone = "919368218143"; // For Hemant Gautam Chatkara Restaurant
    const itemsList = cart
      .map((item) => `• ${item.menuItem.title} x${item.quantity} (${item.menuItem.price})`)
      .join("\n");
    
    const subtotal = getCartTotal();
    const shipping = 40; // Flat Shipping Cost
    const taxes = Math.round(subtotal * 0.05); // 5% GST
    const totalWithFees = subtotal + shipping + taxes;

    const landmarkText = customerInfo.landmark.trim() ? `\n• Landmark: ${customerInfo.landmark.trim()}` : "";
    const emailText = customerInfo.emailAddress.trim() ? `\n• Email: ${customerInfo.emailAddress.trim()}` : "";

    const customerDetailsText = 
`*Customer Details:*
• Name: ${customerInfo.fullName.trim()}
• Mobile: ${customerInfo.mobileNumber.trim()}${emailText}
• Delivery Address: ${customerInfo.deliveryAddress.trim()}${landmarkText}
• City/State/ZIP: ${customerInfo.city.trim()}, ${customerInfo.state.trim()} - ${customerInfo.postalCode.trim()}
• Country: ${customerInfo.country.trim()}`;

    const notesSection = orderNotes.trim() ? `\n\n*Special Instructions:*\n_"${orderNotes.trim()}"_` : "";

    const message = `*Hemant Gautam Chatkara Restaurant - New Order*

${customerDetailsText}

*Order Items:*
${itemsList}${notesSection}

*Payment Summary:*
• Subtotal: ₹${subtotal}
• Shipping Cost: ₹${shipping}
• Taxes (5% GST): ₹${taxes}
• *Total Invoice Amount:* ₹${totalWithFees}

Thank you!`;

    const encoded = encodeURIComponent(message);

    // Save recent meals to localStorage
    setRecentMeals((prev) => {
      const currentItems = cart.map((i) => i.menuItem);
      const combined = [...currentItems, ...prev];
      const unique: MenuItem[] = [];
      const seen = new Set<string>();
      for (const item of combined) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          unique.push(item);
        }
      }
      const updated = unique.slice(0, 3);
      localStorage.setItem("chatkara_recent_meals", JSON.stringify(updated));
      return updated;
    });

    // Set mock active order status tracker
    setActiveOrderTracker({
      id: "HGCR-ORD-" + Math.floor(100000 + Math.random() * 900000),
      status: "Confirmed",
      itemsCount: cart.reduce((acc, curr) => acc + curr.quantity, 0),
      total: totalWithFees
    });

    // Clear notes after placement and reset flow
    setOrderNotes("");
    setCart([]);
    setCheckoutStep("cart");
    setIsCartOpen(false);
    window.open(`https://wa.me/${phone}?text=${encoded}`, "_blank");
  };

  // Booking Submit Handler
  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    playClickSound();
    const ticketId = "HGCR-" + Math.floor(100000 + Math.random() * 900000);
    setConfirmedTicketId(ticketId);
    setBookingStep("ticket");
  };

  // Unique categories for filtering
  const categories = ["All", "🍕 Pizza", "🥟 Momos", "🌯 All Types of Chaap", "🍜 Noodles", "🍟 French Fries", "🥤 Cold Drinks"];

  const filteredMenuItems = MENU_ITEMS.filter((item) => {
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    const matchesSearch = item.title.toLowerCase().includes(menuSearchQuery.toLowerCase()) || 
                          item.description.toLowerCase().includes(menuSearchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="relative min-h-screen bg-[#030303] text-gray-100 overflow-x-hidden selection:bg-amber-500 selection:text-black">

      {/* Subtle Floating Ambient Background Blur Blobs */}
      <div className="absolute top-[10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-gradient-to-tr from-amber-600/10 to-transparent blur-[120px] pointer-events-none" />
      <div className="absolute top-[40%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-bl from-amber-500/5 to-transparent blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[10%] left-[10%] w-[45vw] h-[45vw] rounded-full bg-gradient-to-br from-amber-700/8 to-transparent blur-[130px] pointer-events-none" />

      {/* Floating Sparkle Particles in Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute bg-amber-400/40 rounded-full animate-pulse"
            style={{
              top: `${p.y}%`,
              left: `${p.x}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${3 + p.size}s`,
              opacity: 0.15 + (p.size / 8),
            }}
          />
        ))}
      </div>

      {/* STICKY LIQUID GLASS NAVBAR */}
      <header className="sticky top-0 z-40 w-full glass-navbar shadow-lg transition-all duration-300">
        {/* Scroll Progress Bar */}
        <div
          className="absolute top-0 left-0 h-[3px] bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 transition-all duration-150"
          style={{ width: `${scrollProgress}%` }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo Brand */}
          <a
            href="#home"
            className="flex items-center space-x-3 group clickable"
            onClick={() => {
              setActiveSection("home");
              playClickSound();
            }}
            id="brand-logo"
          >
            <div className="relative w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center shadow-[0_4px_16px_rgba(245,158,11,0.3)] border border-white/20">
              <Utensils className="w-6 h-6 text-black" />
              <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-extrabold text-lg leading-tight tracking-tight bg-gradient-to-r from-white via-gray-100 to-amber-400 bg-clip-text text-transparent">
                CHATKARA
              </span>
              <span className="text-[10px] uppercase tracking-widest text-amber-500/90 font-mono font-medium">
                By Hemant Gautam
              </span>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {[
              { id: "home", label: "Home" },
              { id: "about", label: "About" },
              { id: "menu", label: "Our Menu" },
              { id: "facilities", label: "Facilities" },
              { id: "events", label: "Celebrations" },
              { id: "gallery", label: "Gallery" },
              { id: "contact", label: "Contact" }
            ].map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                onClick={playClickSound}
                className={`relative px-4 py-2 rounded-full font-display text-sm font-medium tracking-wide transition-all duration-300 clickable ${
                  activeSection === link.id
                    ? "text-white bg-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] border border-white/10"
                    : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
                }`}
              >
                {link.label}
                {activeSection === link.id && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute bottom-1 left-4 right-4 h-[1px] bg-amber-400/80 shadow-[0_0_8px_rgba(245,158,11,0.8)]"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </a>
            ))}
          </nav>

          {/* Cart Trigger & Book Table Button */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Cart Trigger */}
            <button
              onClick={() => {
                setIsCartOpen(true);
                playClickSound();
              }}
              className={`relative p-2.5 rounded-xl transition-all duration-300 clickable flex items-center justify-center ${
                isCartAnimating
                  ? "bg-emerald-500/20 border border-emerald-500 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                  : "liquid-glass-btn hover:bg-white/15 text-gray-200 hover:text-amber-400"
              }`}
              title="View Cart"
              id="cart-trigger"
            >
              <AnimatePresence mode="wait">
                {isCartAnimating ? (
                  <motion.div
                    key="animating"
                    initial={{ scale: 0.6, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0.6, rotate: 20 }}
                    className="flex items-center justify-center"
                  >
                    <Check className="w-5 h-5 text-emerald-400" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="normal"
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0.8 }}
                    className="flex items-center justify-center"
                  >
                    <ShoppingCart className="w-5 h-5" />
                  </motion.div>
                )}
              </AnimatePresence>
              {cart.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-black text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-bounce shadow-md">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </button>

            {/* Book Table Button */}
            <button
              onClick={() => {
                setIsBookingOpen(true);
                setBookingStep("form");
                playClickSound();
              }}
              className="px-5 py-2.5 rounded-xl text-sm font-display font-semibold tracking-wide text-black liquid-glass-btn-gold hover:brightness-110 active:scale-95 clickable flex items-center space-x-1.5"
              id="desktop-book-btn"
            >
              <Calendar className="w-4 h-4" />
              <span>Book Table</span>
            </button>
          </div>

          {/* Mobile Menu Toggle & Cart */}
          <div className="flex md:hidden items-center space-x-2">
            {/* Cart Trigger Mobile */}
            <button
              onClick={() => {
                setIsCartOpen(true);
                playClickSound();
              }}
              className={`relative p-2.5 rounded-xl border transition-all duration-300 clickable flex items-center justify-center ${
                isCartAnimating
                  ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                  : "bg-white/5 border-white/10 text-gray-200"
              }`}
              id="mobile-cart-trigger"
            >
              <AnimatePresence mode="wait">
                {isCartAnimating ? (
                  <motion.div
                    key="animating-mob"
                    initial={{ scale: 0.6 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0.6 }}
                    className="flex items-center justify-center"
                  >
                    <Check className="w-5 h-5 text-emerald-400" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="normal-mob"
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0.8 }}
                    className="flex items-center justify-center"
                  >
                    <ShoppingCart className="w-5 h-5" />
                  </motion.div>
                )}
              </AnimatePresence>
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-black text-[10px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-sm">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </button>

            {/* Mobile Hamburger menu */}
            <button
              onClick={() => {
                setMobileMenuOpen(!mobileMenuOpen);
                playClickSound();
              }}
              className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white clickable"
              id="mobile-menu-toggle"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE DRAWER NAVIGATION */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-x-0 top-20 z-30 p-4 mx-4 rounded-2xl glass shadow-2xl md:hidden border border-white/15"
            id="mobile-nav-drawer"
          >
            <div className="flex flex-col space-y-2">
              {[
                { id: "home", label: "Home" },
                { id: "about", label: "About Restaurant" },
                { id: "menu", label: "Delicious Menu" },
                { id: "facilities", label: "Our Facilities" },
                { id: "events", label: "Special Celebrations" },
                { id: "gallery", label: "Visual Gallery" },
                { id: "contact", label: "Contact Us" }
              ].map((link) => (
                <a
                  key={link.id}
                  href={`#${link.id}`}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    playClickSound();
                  }}
                  className={`px-4 py-3 rounded-xl font-display text-base font-medium flex items-center justify-between ${
                    activeSection === link.id
                      ? "text-amber-400 bg-white/5"
                      : "text-gray-300 hover:bg-white/5"
                  }`}
                >
                  <span>{link.label}</span>
                  <ArrowRight className="w-4 h-4 opacity-50" />
                </a>
              ))}

              <div className="pt-4 border-t border-white/10 flex flex-col space-y-3">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setIsBookingOpen(true);
                    setBookingStep("form");
                    playClickSound();
                  }}
                  className="w-full py-3.5 rounded-xl text-center text-black font-display font-semibold liquid-glass-btn-gold"
                  id="mobile-book-btn"
                >
                  Reserve A Table Now
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HERO SECTION */}
      <section
        id="home"
        className="relative min-h-[92dvh] flex items-center justify-center pt-8 pb-16 overflow-hidden"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          
          {/* Left Text Column */}
          <div className="lg:col-span-7 text-left space-y-8 flex flex-col justify-center">
            {/* Premium Chef Badge */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 shadow-[0_4px_12px_rgba(245,158,11,0.06)] max-w-fit"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-mono font-semibold tracking-wider uppercase text-amber-300">
                A Premium Culinary Masterpiece
              </span>
            </motion.div>

            {/* Headline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="space-y-4"
            >
              <h1 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl xl:text-7xl leading-[1.1] tracking-tight">
                Welcome to <br />
                <span className="bg-gradient-to-r from-white via-gray-100 to-amber-400 bg-clip-text text-transparent">
                  Hemant Gautam
                </span>{" "}
                <br />
                <span className="bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 bg-clip-text text-transparent">
                  Chatkara Restaurant
                </span>
              </h1>

              {/* Subheadline */}
              <p className="text-lg sm:text-xl text-gray-300 max-w-xl font-light leading-relaxed flex items-center flex-wrap gap-2">
                <span className="font-medium text-amber-400">Fresh Food</span>
                <span className="text-gray-600">•</span>
                <span className="font-medium text-white">Premium Dining</span>
                <span className="text-gray-600">•</span>
                <span className="font-medium text-amber-400">Unforgettable Taste</span>
              </p>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-gray-400 text-sm sm:text-base max-w-lg leading-relaxed font-light"
            >
              Immerse yourself in our sensory-focused luxury atmosphere inspired by modern glass design. Experience traditional Indian chaaps, freshly kneaded wood-fired pizzas, steaming spicy momos, and delicate noodles crafted with pure precision.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2"
            >
              <a
                href="#menu"
                onClick={playClickSound}
                className="px-8 py-4 rounded-xl text-center text-black font-display font-semibold tracking-wide liquid-glass-btn-gold hover:shadow-[0_12px_40px_rgba(245,158,11,0.4)] transition-all duration-300 flex items-center justify-center space-x-2"
                id="hero-get-started"
              >
                <span>Get Started</span>
                <ArrowRight className="w-5 h-5 text-black" />
              </a>
              <a
                href="#contact"
                onClick={playClickSound}
                className="px-8 py-4 rounded-xl text-center text-white font-display font-semibold tracking-wide liquid-glass-btn hover:bg-white/10 flex items-center justify-center space-x-2"
                id="hero-visit-restaurant"
              >
                <MapPin className="w-5 h-5 text-amber-400" />
                <span>Visit Restaurant</span>
              </a>
            </motion.div>

            {/* Interactive Open Now Status Badge */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex items-center space-x-3 pt-4 text-xs font-mono text-gray-400"
            >
              <div className="flex items-center space-x-1.5">
                <span className={`relative flex h-2.5 w-2.5`}>
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isRestaurantOpen() ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                  <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isRestaurantOpen() ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                </span>
                <span className={isRestaurantOpen() ? "text-emerald-400 font-bold uppercase" : "text-red-400 font-bold uppercase"}>
                  {isRestaurantOpen() ? "Open Now" : "Closed Now"}
                </span>
              </div>
              <span className="text-gray-700">|</span>
              <div className="flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-amber-500/80" />
                <span>11:00 AM - 11:00 PM</span>
              </div>
            </motion.div>
          </div>

          {/* Right 3D Rotating Pizza Asset Column */}
          <div className="lg:col-span-5 flex items-center justify-center relative">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1.2, type: "spring" }}
              className="relative w-full max-w-[420px] aspect-square"
              id="pizza-container"
            >
              {/* Outer Liquid Ring Animation */}
              <div className="absolute inset-[-15px] rounded-full border border-dashed border-amber-500/15 animate-ring" />
              <div className="absolute inset-[-30px] rounded-full border border-double border-white/5 animate-spin" style={{ animationDuration: "35s" }} />

              {/* Glowing Pizza Backdrop Aura */}
              <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/20 to-amber-600/30 rounded-full filter blur-2xl opacity-60 animate-pulse" />

              {/* Floating Basil Leaves Particles */}
              <div className="absolute top-4 left-6 w-8 h-8 bg-emerald-500/20 rounded-full filter blur-md animate-float" style={{ animationDelay: "1s" }} />
              <div className="absolute bottom-10 right-4 w-10 h-10 bg-amber-500/10 rounded-full filter blur-md animate-float" style={{ animationDelay: "3s" }} />

              {/* Rotating 3D-effect Pizza Plate & Image */}
              <div className="w-full h-full rounded-full bg-gradient-to-tr from-black/60 to-transparent p-4 flex items-center justify-center relative">
                {/* 3D Reflection glass plate */}
                <div className="absolute inset-2 rounded-full border border-white/20 glass pointer-events-none shadow-[0_20px_50px_rgba(0,0,0,0.6)]" />

                <motion.img
                  src={MENU_ITEMS[0].image}
                  alt="3D Premium Rotating Wood-Fired Pizza"
                  referrerPolicy="no-referrer"
                  className="w-[92%] h-[92%] object-cover rounded-full shadow-[0_15px_40px_rgba(0,0,0,0.8)] relative z-10 select-none cursor-grab active:cursor-grabbing"
                  style={{ transformStyle: "preserve-3d" }}
                  animate={{ rotate: 360 }}
                  transition={{
                    repeat: Infinity,
                    duration: 25,
                    ease: "linear",
                  }}
                  whileHover={{ scale: 1.04 }}
                />
              </div>

              {/* Hover Badge Indicator */}
              <div className="absolute -bottom-2 -right-2 bg-black/80 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 shadow-lg text-[11px] font-mono tracking-widest text-amber-400">
                🔥 Wood Fired
              </div>
            </motion.div>
          </div>

        </div>
      </section>

      {/* ABOUT SECTION */}
      <section id="about" className="py-24 relative overflow-hidden bg-[#050505] border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <span className="text-xs font-mono font-semibold tracking-widest text-amber-500 uppercase">
              Meet the Visionary
            </span>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl tracking-tight">
              A Legacy of Pure Taste
            </h2>
            <div className="w-16 h-1 bg-amber-500 mx-auto rounded-full" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Image Column */}
            <div className="lg:col-span-6 relative">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/10 group">
                {/* Shimmer Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out z-10" />
                <img
                  src={GALLERY_ITEMS[5].image}
                  alt="Our Premium Interior"
                  referrerPolicy="no-referrer"
                  className="w-full h-[400px] object-cover object-center group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                
                {/* Overlay Floating Card */}
                <div className="absolute bottom-6 left-6 right-6 p-6 glass rounded-2xl border border-white/15">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-400/30">
                      <Award className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-white text-base">Top Gastronomy Award</h4>
                      <p className="text-xs text-gray-400">Recognized for premier food prep & quality</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Info Column */}
            <div className="lg:col-span-6 space-y-8">
              <div className="glass p-8 rounded-3xl border border-white/10 relative overflow-hidden shadow-xl">
                {/* Gloss flare reflection */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-white/5 to-transparent blur-md" />
                
                <span className="text-[10px] font-mono text-amber-500 uppercase tracking-widest font-bold">
                  Owner & Master Chef
                </span>
                <h3 className="font-display font-extrabold text-3xl text-white mt-1 mb-4">
                  Hemant Gautam
                </h3>

                <p className="text-gray-300 leading-relaxed font-light text-base mb-6">
                  "We serve delicious freshly prepared food in a clean, comfortable, air-conditioned environment with professional service and an unforgettable dining experience."
                </p>

                <div className="border-t border-white/10 pt-6 grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <span className="block font-display font-extrabold text-2xl text-amber-400">100%</span>
                    <span className="text-[10px] text-gray-400 uppercase font-mono tracking-wider">Hygienic</span>
                  </div>
                  <div className="text-center border-x border-white/10 px-2">
                    <span className="block font-display font-extrabold text-2xl text-white">Clay</span>
                    <span className="text-[10px] text-gray-400 uppercase font-mono tracking-wider">Tandoor</span>
                  </div>
                  <div className="text-center">
                    <span className="block font-display font-extrabold text-2xl text-amber-400">Premium</span>
                    <span className="text-[10px] text-gray-400 uppercase font-mono tracking-wider">AC Comfort</span>
                  </div>
                </div>
              </div>

              {/* Key Values List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  "Pure ingredients sourced daily",
                  "Air-conditioned spacious hall",
                  "Mouthwatering signature recipes",
                  "Professional service etiquette"
                ].map((val, idx) => (
                  <div key={idx} className="flex items-center space-x-3 text-sm text-gray-300">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-emerald-400" />
                    </div>
                    <span>{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* DELICIOUS MENU SECTION */}
      <section id="menu" className="py-24 bg-[#030303] relative border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
            <span className="text-xs font-mono font-semibold tracking-widest text-amber-500 uppercase">
              Gastronomic Creations
            </span>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl tracking-tight">
              Explore Our Signature Menu
            </h2>
            <div className="w-16 h-1 bg-amber-500 mx-auto rounded-full" />
            <p className="text-gray-400 text-sm sm:text-base font-light">
              Carefully chosen premium fast food, authentic chaaps, and artisanal refreshers.
            </p>
          </div>

          {/* Liquid Style Category Navigation Bar */}
          <div className="flex justify-center mb-10">
            <div className="p-1.5 rounded-2xl glass border border-white/10 flex flex-wrap justify-center items-center gap-1.5 max-w-full">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat);
                    playClickSound();
                  }}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-display font-semibold transition-all duration-300 clickable ${
                    selectedCategory === cat
                      ? "bg-amber-500 text-black shadow-md shadow-amber-500/20"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Liquid Glass Search Bar */}
          <div className="max-w-md mx-auto mb-12 relative z-20">
            <div className="relative group">
              {/* Glowing Background Ring */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl blur opacity-30 group-focus-within:opacity-50 transition duration-300 pointer-events-none" />
              
              <div className="relative flex items-center rounded-2xl glass border border-white/10 px-4 py-3 bg-zinc-950/40 backdrop-blur-md">
                <Search className="w-5 h-5 text-gray-400 group-focus-within:text-amber-500 transition-colors duration-300 mr-3 shrink-0" />
                <input
                  type="text"
                  value={menuSearchQuery}
                  onChange={(e) => setMenuSearchQuery(e.target.value)}
                  placeholder="Search dishes... (e.g. Pizza, Momos, Chaap)"
                  className="w-full bg-transparent border-none text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-0 font-sans"
                />
                
                {menuSearchQuery && (
                  <button
                    onClick={() => {
                      setMenuSearchQuery("");
                      playClickSound();
                    }}
                    className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-all clickable shrink-0"
                    title="Clear Search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Results count indicator */}
            <div className="mt-2.5 flex justify-between items-center px-2">
              <span className="text-[11px] font-mono text-gray-500 uppercase tracking-widest">
                {menuSearchQuery ? "Active Filter" : "All Dishes"}
              </span>
              <span className="text-[11px] font-mono text-gray-400">
                Found <span className="text-amber-500 font-bold">{filteredMenuItems.length}</span> {filteredMenuItems.length === 1 ? "item" : "items"}
              </span>
            </div>
          </div>

          {/* Menu Items Grid */}
          <motion.div
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            id="menu-grid"
          >
            <AnimatePresence mode="popLayout">
              {filteredMenuItems.map((item) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.4 }}
                  key={item.id}
                  className="glass rounded-3xl overflow-hidden border border-white/8 shadow-xl relative group flex flex-col h-full glass-card-hover animate-shimmer"
                >
                  {/* Food Image Container */}
                  <div className="relative aspect-4/3 overflow-hidden bg-black/40">
                    <img
                      src={item.image}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent" />
                    
                    {/* Floating Accent Badge */}
                    {item.badge && (
                      <span className="absolute top-4 left-4 px-3 py-1 rounded-lg text-[10px] font-mono uppercase tracking-wider font-bold bg-amber-500 text-black shadow-md border border-white/20">
                        {item.badge}
                      </span>
                    )}

                    {/* Floating Category Tag */}
                    <span className="absolute bottom-4 left-4 px-2.5 py-1 rounded-md text-[11px] font-medium bg-black/60 backdrop-blur-md text-amber-400 border border-white/10">
                      {item.category.split(" ")[0]}
                    </span>
                  </div>

                  {/* Food Information */}
                  <div className="p-6 flex flex-col flex-grow space-y-4">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-display font-extrabold text-lg text-white group-hover:text-amber-400 transition-colors duration-300">
                        {item.title}
                      </h3>
                      <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-400/30 text-amber-400 font-mono font-bold text-sm">
                        {item.price}
                      </div>
                    </div>

                    <p className="text-gray-400 text-xs sm:text-sm leading-relaxed font-light flex-grow">
                      {item.description}
                    </p>

                    {/* Order Trigger */}
                    <div className="pt-2">
                      <button
                        onClick={() => addToCart(item)}
                        className={`w-full py-3 rounded-xl text-center font-display font-semibold text-xs tracking-wide transition-all duration-300 flex items-center justify-center space-x-2 clickable ${
                          justAddedId === item.id
                            ? "bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                            : "liquid-glass-btn hover:border-amber-500/50 hover:text-amber-400"
                        }`}
                        id={`order-${item.id}`}
                      >
                        <AnimatePresence mode="wait">
                          {justAddedId === item.id ? (
                            <motion.div
                              key="added"
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.8, opacity: 0 }}
                              className="flex items-center space-x-1"
                            >
                              <Check className="w-4 h-4 text-emerald-400" />
                              <span>Added!</span>
                            </motion.div>
                          ) : (
                            <motion.div
                              key="default"
                              initial={{ scale: 0.9, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.9, opacity: 0 }}
                              className="flex items-center space-x-2"
                            >
                              <ShoppingCart className="w-4 h-4" />
                              <span>Order Now</span>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {filteredMenuItems.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="col-span-full py-16 text-center text-gray-400 font-light max-w-md mx-auto space-y-4"
              >
                <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-amber-500">
                  <Search className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-white font-display font-bold text-lg">No Items Found</h4>
                  <p className="text-xs sm:text-sm text-gray-400">
                    We couldn't find any dishes matching "<span className="text-amber-500 font-semibold">{menuSearchQuery}</span>" in this category. Try adjusting your query or category!
                  </p>
                </div>
                <button
                  onClick={() => {
                    setMenuSearchQuery("");
                    setSelectedCategory("All");
                    playClickSound();
                  }}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 text-black text-xs font-semibold hover:bg-amber-400 transition-colors duration-200 clickable inline-flex items-center space-x-1.5 shadow-md shadow-amber-500/10"
                >
                  <span>Reset All Filters</span>
                </button>
              </motion.div>
            )}
          </motion.div>

        </div>
      </section>

      {/* FACILITIES SECTION */}
      <section id="facilities" className="py-24 bg-[#050505] relative border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <span className="text-xs font-mono font-semibold tracking-widest text-amber-500 uppercase">
              First-Class Hospitality
            </span>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl tracking-tight">
              Premium Dining Facilities
            </h2>
            <div className="w-16 h-1 bg-amber-500 mx-auto rounded-full" />
            <p className="text-gray-400 text-sm sm:text-base font-light">
              Designed perfectly with elegant Apple-inspired glass outlines and warm spatial seating.
            </p>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8" id="facilities-grid">
            {FACILITIES.map((fac) => {
              const DynamicIcon = iconMap[fac.iconName] || Heart;
              return (
                <div
                  key={fac.id}
                  className="glass p-8 rounded-3xl border border-white/8 shadow-lg flex flex-col space-y-5 glass-card-hover group animate-shimmer"
                >
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-white/10 flex items-center justify-center shadow-inner group-hover:from-amber-500 group-hover:to-amber-400 group-hover:text-black transition-all duration-500">
                    <DynamicIcon className="w-6 h-6 text-amber-400 group-hover:text-black transition-colors duration-500" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-display font-extrabold text-lg text-white group-hover:text-amber-400 transition-colors duration-300">
                      {fac.title}
                    </h3>
                    <p className="text-gray-400 text-xs sm:text-sm leading-relaxed font-light">
                      {fac.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* SPECIAL EVENTS SECTION (BIRTHDAY & PRIVATE MEETING) */}
      <section id="events" className="py-24 bg-[#030303] relative border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-24">
          
          {/* Birthday Celebrations Sub-section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Info */}
            <div className="lg:col-span-6 space-y-6">
              <span className="text-xs font-mono font-semibold tracking-widest text-amber-500 uppercase">
                Celebrate Milestones
              </span>
              <h2 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl leading-tight">
                Birthday Party Arrangements
              </h2>
              <div className="w-12 h-1 bg-amber-500 rounded-full" />
              
              <p className="text-gray-300 text-base sm:text-lg font-light leading-relaxed">
                Celebrate your special birthday with delicious food, elegant decoration, and memorable moments at Hemant Gautam Chatkara Restaurant.
              </p>

              <p className="text-gray-400 text-sm leading-relaxed font-light">
                Our team handles everything from grand background curtains, fairy lights, custom dining arrangements, personalized menus, to sound setups. Create memorable family albums under our premium interior styling.
              </p>

              <div className="pt-2 flex flex-wrap gap-4">
                <button
                  onClick={() => {
                    setIsBookingOpen(true);
                    setBookingStep("form");
                    setBookingDetails(prev => ({ ...prev, eventType: "Birthday Celebration" }));
                    playClickSound();
                  }}
                  className="px-6 py-3.5 rounded-xl font-display font-semibold text-sm text-black liquid-glass-btn-gold hover:shadow-[0_12px_30px_rgba(245,158,11,0.3)] clickable flex items-center space-x-2"
                  id="book-birthday-btn"
                >
                  <Gift className="w-4 h-4 text-black" />
                  <span>Inquire Birthday Booking</span>
                </button>
              </div>
            </div>

            {/* Right Photo Frame */}
            <div className="lg:col-span-6">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/10 group">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out z-10" />
                <img
                  src={GALLERY_ITEMS[6].image}
                  alt="Beautiful Luxury Birthday Setup"
                  referrerPolicy="no-referrer"
                  className="w-full h-[380px] object-cover group-hover:scale-103 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-md px-3.5 py-1.5 rounded-xl text-xs font-mono text-amber-400 border border-white/10">
                  📸 Real Party Setup
                </div>
              </div>
            </div>
          </div>

          {/* Private Meetings Sub-section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center pt-12">
            {/* Left Photo Frame */}
            <div className="lg:col-span-6 order-last lg:order-first">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/10 group">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out z-10" />
                <img
                  src={GALLERY_ITEMS[5].image}
                  alt="Sleek Private Meeting Space"
                  referrerPolicy="no-referrer"
                  className="w-full h-[380px] object-cover group-hover:scale-103 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-md px-3.5 py-1.5 rounded-xl text-xs font-mono text-amber-400 border border-white/10">
                  💼 Professional Comfort
                </div>
              </div>
            </div>

            {/* Right Info */}
            <div className="lg:col-span-6 space-y-6">
              <span className="text-xs font-mono font-semibold tracking-widest text-amber-500 uppercase">
                Corporate & Business
              </span>
              <h2 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl leading-tight">
                Private Meeting Spaces
              </h2>
              <div className="w-12 h-1 bg-amber-500 rounded-full" />
              
              <p className="text-gray-300 text-base sm:text-lg font-light leading-relaxed">
                Our private meeting space is perfect for business meetings, family discussions, and special gatherings.
              </p>

              <p className="text-gray-400 text-sm leading-relaxed font-light">
                Enjoy fully noise-insulated rooms, premium air-conditioning, high-speed Wi-Fi support, dedicated service staff, and modular menu selections customized specifically to suit business lunch hours or evening high-tea corporate meetups.
              </p>

              <div className="pt-2">
                <button
                  onClick={() => {
                    setIsBookingOpen(true);
                    setBookingStep("form");
                    setBookingDetails(prev => ({ ...prev, eventType: "Business Meeting" }));
                    playClickSound();
                  }}
                  className="px-6 py-3.5 rounded-xl font-display font-semibold text-sm text-white liquid-glass-btn hover:bg-white/10 clickable flex items-center space-x-2"
                  id="book-meeting-btn"
                >
                  <Briefcase className="w-4 h-4 text-amber-400" />
                  <span>Reserve Corporate Space</span>
                </button>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* GALLERY SECTION */}
      <section id="gallery" className="py-24 bg-[#050505] relative border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <span className="text-xs font-mono font-semibold tracking-widest text-amber-500 uppercase">
              Visual Elegance
            </span>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl tracking-tight">
              A Taste Highlighted
            </h2>
            <div className="w-16 h-1 bg-amber-500 mx-auto rounded-full" />
            <p className="text-gray-400 text-sm sm:text-base font-light">
              A mosaic look at our master creations, designed with deep zoom transitions and floating frame styles.
            </p>
          </div>

          {/* Masonry-Style Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" id="gallery-grid">
            {GALLERY_ITEMS.map((item, idx) => (
              <div
                key={item.id}
                onClick={() => {
                  setLightboxIndex(idx);
                  playClickSound();
                }}
                className="relative h-[280px] rounded-3xl overflow-hidden border border-white/8 shadow-lg group cursor-pointer"
              >
                <img
                  src={item.image}
                  alt={item.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-750 ease-out"
                />
                
                {/* Liquid overlay hover effect */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#030303]/90 via-[#030303]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6" />
                
                <div className="absolute inset-0 flex flex-col justify-end p-6 z-10 translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold mb-1">
                    {item.category}
                  </span>
                  <h4 className="font-display font-extrabold text-lg text-white">
                    {item.title}
                  </h4>
                </div>

                {/* Shimmer overlay line */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* CUSTOMER REVIEWS */}
      <section id="reviews" className="py-24 bg-[#030303] relative border-t border-white/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10">
          
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <span className="text-xs font-mono font-semibold tracking-widest text-amber-500 uppercase">
              Guest Impressions
            </span>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl tracking-tight">
              Customer Reviews
            </h2>
            <div className="w-16 h-1 bg-amber-500 mx-auto rounded-full" />
          </div>

          {/* Testimonial Slider Card */}
          <div className="relative glass p-8 sm:p-12 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden" id="reviews-carousel">
            {/* Ambient gold glow in carousel */}
            <div className="absolute bottom-[-50px] right-[-50px] w-64 h-64 bg-amber-500/5 rounded-full filter blur-2xl" />

            <AnimatePresence mode="wait">
              <motion.div
                key={reviewIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.5 }}
                className="space-y-6 text-center sm:text-left flex flex-col sm:flex-row items-center sm:items-start gap-8"
              >
                {/* Photo */}
                <div className="flex-shrink-0">
                  <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-amber-400/30 shadow-[0_4px_16px_rgba(245,158,11,0.2)]">
                    <img
                      src={REVIEWS[reviewIndex].photo}
                      alt={REVIEWS[reviewIndex].name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-4 flex-grow">
                  {/* Stars */}
                  <div className="flex items-center justify-center sm:justify-start space-x-1">
                    {Array.from({ length: REVIEWS[reviewIndex].rating }).map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>

                  <p className="text-lg sm:text-xl text-gray-200 italic font-light leading-relaxed">
                    "{REVIEWS[reviewIndex].text}"
                  </p>

                  <div className="pt-2">
                    <h4 className="font-display font-bold text-white text-base">
                      {REVIEWS[reviewIndex].name}
                    </h4>
                    <p className="text-xs text-amber-500 font-mono tracking-wider uppercase">
                      {REVIEWS[reviewIndex].role}
                    </p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Slider Controls */}
            <div className="flex items-center justify-center sm:justify-end space-x-3 pt-8 border-t border-white/8 mt-8">
              <button
                onClick={() => {
                  setReviewIndex((prev) => (prev - 1 + REVIEWS.length) % REVIEWS.length);
                  playClickSound();
                }}
                className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 clickable"
                title="Previous Review"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  setReviewIndex((prev) => (prev + 1) % REVIEWS.length);
                  playClickSound();
                }}
                className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 clickable"
                title="Next Review"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* CONTACT SECTION */}
      <section id="contact" className="py-24 bg-[#050505] relative border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <span className="text-xs font-mono font-semibold tracking-widest text-amber-500 uppercase">
              Get in Touch
            </span>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl tracking-tight">
              Locate & Contact Us
            </h2>
            <div className="w-16 h-1 bg-amber-500 mx-auto rounded-full" />
            <p className="text-gray-400 text-sm sm:text-base font-light">
              Visit our pristine air-conditioned space in person, or get custom fast catering deliveries.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* Left Contact Cards Column */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Brand Title card */}
              <div className="glass p-6 rounded-2xl border border-white/10 space-y-2">
                <span className="text-[10px] font-mono text-amber-500 uppercase tracking-widest font-bold">
                  Restaurant Profile
                </span>
                <h3 className="font-display font-extrabold text-xl text-white">
                  Hemant Gautam Chatkara Restaurant
                </h3>
                <p className="text-sm text-gray-400 font-light">
                  Owned & Supervised by: <span className="font-semibold text-white">Hemant Gautam</span>
                </p>
              </div>

              {/* Interactive Info cards */}
              {[
                {
                  icon: Phone,
                  title: "Phone Numbers",
                  value: "+91 93682 18143",
                  actionText: "Call Now",
                  actionUrl: "tel:+919368218143"
                },
                {
                  icon: MapPin,
                  title: "Restaurant Address",
                  value: "Maliyon Mandir, Shiv Nagar, Garh Road, Hapur, India",
                  actionText: "Get Directions",
                  actionUrl: "https://maps.google.com/?q=maliyon+mandir+shiv+nagar+garh+road+hapur+india"
                }
              ].map((card, idx) => {
                const CardIcon = card.icon;
                return (
                  <div key={idx} className="glass p-5 rounded-2xl border border-white/8 shadow-md flex items-start space-x-4">
                    <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-white/10 flex items-center justify-center flex-shrink-0 text-amber-400">
                      <CardIcon className="w-5 h-5" />
                    </div>
                    <div className="space-y-1 flex-grow">
                      <h4 className="text-xs font-mono font-bold uppercase text-gray-400">
                        {card.title}
                      </h4>
                      <p className="text-sm text-white font-medium leading-relaxed">
                        {card.value}
                      </p>
                      <a
                        href={card.actionUrl}
                        target="_blank"
                        referrerPolicy="no-referrer"
                        onClick={playClickSound}
                        className="inline-flex items-center space-x-1 text-xs text-amber-400 hover:text-amber-300 font-semibold transition-colors duration-200 pt-1.5 clickable"
                      >
                        <span>{card.actionText}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                );
              })}

              {/* Direct WhatsApp Button */}
              <a
                href="https://wa.me/919368218143?text=Hi%20Hemant,%20I'd%20like%20to%20know%20more%20about%20Hemant%20Gautam%20Chatkara%20Restaurant"
                target="_blank"
                referrerPolicy="no-referrer"
                onClick={playClickSound}
                className="w-full py-4 rounded-xl text-center text-black font-display font-bold text-sm tracking-wide liquid-glass-btn-gold shadow-lg hover:brightness-110 flex items-center justify-center space-x-2 clickable"
                id="direct-whatsapp-btn"
              >
                <MessageCircleIcon className="w-5 h-5 text-black" />
                <span>Contact via WhatsApp</span>
              </a>
            </div>

            {/* Right Map & Hours Column */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Responsive Iframe Map */}
              <div className="relative w-full h-[320px] rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-black">
                <iframe
                  title="Hemant Gautam Chatkara Restaurant Location Map"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d13968.455246714083!2d77.78440939229047!3d28.729352123531983!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390ca934f0df4005%3A0x63fe572b8c9d1df4!2sShiv%20Nagar%2C%20Hapur%2C%20Uttar%20Pradesh%20245101!5e0!3m2!1sen!2sin!4v1680000000000!5m2!1sen!2sin"
                  className="absolute inset-0 w-full h-full border-0 filter invert-[90%] hue-rotate-[180deg] brightness-[88%] contrast-[95%]"
                  allowFullScreen={true}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Opening Hours card */}
              <div className="glass p-6 rounded-2xl border border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-2 text-amber-400">
                    <Clock className="w-4.5 h-4.5" />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider">Opening Hours</span>
                  </div>
                  <p className="text-sm text-gray-300 font-light leading-relaxed">
                    Come visit or order delicious food anytime within schedule.
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-mono text-gray-400 pb-1 border-b border-white/5">
                    <span>Mon - Sun</span>
                    <span className="text-white font-medium">11:00 AM - 11:00 PM</span>
                  </div>
                  <div className="flex justify-between text-xs font-mono text-gray-400">
                    <span>Takeaway Delivery</span>
                    <span className="text-amber-400 font-medium">Available Late</span>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#020202] text-gray-400 border-t border-white/10 pt-16 pb-12 relative overflow-hidden">
        {/* Subtle blur in footer */}
        <div className="absolute bottom-0 left-[30%] w-[30vw] h-[30vw] rounded-full bg-amber-500/5 filter blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          
          {/* Col 1 Brand */}
          <div className="md:col-span-1.5 space-y-4 text-left">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center border border-white/20">
                <Utensils className="w-5.5 h-5.5 text-black" />
              </div>
              <div className="flex flex-col">
                <span className="font-display font-extrabold text-base leading-tight tracking-tight text-white">
                  CHATKARA
                </span>
                <span className="text-[9px] uppercase tracking-widest text-amber-500 font-mono font-medium">
                  By Hemant Gautam
                </span>
              </div>
            </div>
            <p className="text-xs leading-relaxed font-light">
              Designing premium fast dining, tandoor soya chaaps, and wood-fired pizzas with custom aesthetic layouts inspired by modern liquid glass styles.
            </p>
            <div className="flex items-center space-x-3 pt-2">
              {["Twitter", "Instagram", "Facebook", "YouTube"].map((social) => (
                <a
                  key={social}
                  href="#"
                  onClick={playClickSound}
                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-amber-500 hover:text-black transition-all duration-300 flex items-center justify-center border border-white/10 clickable text-xs font-mono"
                  title={`Follow us on ${social}`}
                >
                  {social[0]}
                </a>
              ))}
            </div>
          </div>

          {/* Col 2 Quick Links */}
          <div className="space-y-4 text-left">
            <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-white">
              Restaurant Navigation
            </h4>
            <div className="flex flex-col space-y-2 text-xs">
              <a href="#home" onClick={playClickSound} className="hover:text-amber-400 transition-colors duration-200 clickable">Home Dashboard</a>
              <a href="#about" onClick={playClickSound} className="hover:text-amber-400 transition-colors duration-200 clickable">About Hemant Gautam</a>
              <a href="#menu" onClick={playClickSound} className="hover:text-amber-400 transition-colors duration-200 clickable">Delicious Menu</a>
              <a href="#facilities" onClick={playClickSound} className="hover:text-amber-400 transition-colors duration-200 clickable">Dining Facilities</a>
              <a href="#events" onClick={playClickSound} className="hover:text-amber-400 transition-colors duration-200 clickable">Celebration Slots</a>
            </div>
          </div>

          {/* Col 3 Categories */}
          <div className="space-y-4 text-left">
            <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-white">
              Signature Categories
            </h4>
            <div className="flex flex-col space-y-2 text-xs">
              <button onClick={() => { setSelectedCategory("🍕 Pizza"); playClickSound(); }} className="hover:text-amber-400 transition-colors duration-200 text-left clickable">Wood-Fired Pizza</button>
              <button onClick={() => { setSelectedCategory("🥟 Momos"); playClickSound(); }} className="hover:text-amber-400 transition-colors duration-200 text-left clickable">Steamed Momos</button>
              <button onClick={() => { setSelectedCategory("🌯 All Types of Chaap"); playClickSound(); }} className="hover:text-amber-400 transition-colors duration-200 text-left clickable">Tandoori Malai Chaap</button>
              <button onClick={() => { setSelectedCategory("🍜 Noodles"); playClickSound(); }} className="hover:text-amber-400 transition-colors duration-200 text-left clickable">Hakka Noodles</button>
              <button onClick={() => { setSelectedCategory("🍟 French Fries"); playClickSound(); }} className="hover:text-amber-400 transition-colors duration-200 text-left clickable">Gourmet Fries</button>
            </div>
          </div>

          {/* Col 4 Quick Contact */}
          <div className="space-y-4 text-left">
            <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-white">
              Instant Contact
            </h4>
            <div className="space-y-3 text-xs font-light">
              <p className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <span>Maliyon Mandir, Shiv Nagar, Garh Road, Hapur, India</span>
              </p>
              <p className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <span>+91 93682 18143</span>
              </p>
              <p className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <span>Open Everyday: 11am - 11pm</span>
              </p>
            </div>
          </div>

        </div>

        {/* Bottom copyright line */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center">
          <p className="text-[11px] font-mono tracking-wide">
            &copy; 2026 Hemant Gautam Chatkara Restaurant. All Rights Reserved. Crafted with Liquid Glass.
          </p>
          <div className="flex items-center space-x-4 text-[10px] font-mono">
            <a href="#" onClick={playClickSound} className="hover:text-white transition-colors duration-200 clickable">Privacy Policy</a>
            <span className="text-gray-800">•</span>
            <a href="#" onClick={playClickSound} className="hover:text-white transition-colors duration-200 clickable">Terms of Dining</a>
          </div>
        </div>
      </footer>

      {/* LIQUID GLASS CART DRAWER MODAL */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            {/* Backdrop Blur overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md"
            />

            {/* Sidebar Cart panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed inset-y-0 right-0 z-50 w-full max-w-[440px] bg-black/80 backdrop-blur-2xl border-l border-white/12 shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col"
              id="cart-drawer-panel"
            >
              {/* Header */}
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-400/20 text-amber-400">
                    <ShoppingCart className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-extrabold text-lg text-white">Your Premium Order</h3>
                    <p className="text-[10px] text-gray-400 uppercase font-mono tracking-wider">Checkout via WhatsApp</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    playClickSound();
                  }}
                  className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white clickable"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Cart Items List */}
              <div className="flex-grow overflow-y-auto p-6 space-y-4">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col justify-between">
                    <div className="flex-grow flex flex-col items-center justify-center text-center space-y-4 py-8">
                      <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-500">
                        <ShoppingCart className="w-7 h-7" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-display font-bold text-base text-gray-400">Your cart is empty</h4>
                        <p className="text-xs text-gray-500 max-w-xs font-light">
                          Browse through our delicious items and click "Order Now" to add dishes to your bucket.
                        </p>
                      </div>
                    </div>

                    {/* Recent Orders Section when empty */}
                    {recentMeals.length > 0 && (
                      <div className="mt-6 pt-6 border-t border-white/10 space-y-4">
                        <div className="flex items-center space-x-2 text-amber-400">
                          <History className="w-4 h-4" />
                          <h4 className="font-display font-bold text-xs uppercase tracking-wider font-mono">Recent Ordered Meals</h4>
                        </div>
                        <p className="text-[11px] text-gray-400 text-left">One-click quick re-ordering to populate your cart:</p>
                        <div className="space-y-3 text-left">
                          {recentMeals.map((meal) => (
                            <div 
                              key={meal.id} 
                              className="glass p-3 rounded-xl border border-white/8 hover:border-amber-500/30 transition-all flex items-center justify-between group"
                            >
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/10">
                                  <img 
                                    src={meal.image} 
                                    alt={meal.title} 
                                    referrerPolicy="no-referrer"
                                    className="w-full h-full object-cover" 
                                  />
                                </div>
                                <div className="text-left">
                                  <h5 className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors leading-tight">{meal.title}</h5>
                                  <p className="text-[11px] text-amber-500 font-mono mt-0.5">{meal.price}</p>
                                </div>
                              </div>
                              <button
                                onClick={() => addToCart(meal)}
                                className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500 hover:text-black border border-amber-500/20 text-amber-400 text-xs font-bold transition-all flex items-center space-x-1 clickable"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Reorder</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : checkoutStep === "info-form" ? (
                  <div className="space-y-4 text-left">
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                      <h4 className="font-display font-bold text-base text-amber-400">Customer Information</h4>
                      <span className="text-[10px] font-mono text-gray-500 uppercase">Step 2 of 3</span>
                    </div>

                    {/* Full Name */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-400 font-mono uppercase tracking-wider block">
                        Full Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={customerInfo.fullName}
                        onChange={(e) => setCustomerInfo(prev => ({ ...prev, fullName: e.target.value }))}
                        placeholder="e.g. John Doe"
                        className={`w-full px-3.5 py-2 text-xs rounded-xl bg-white/5 border ${formErrors.fullName ? "border-rose-500" : "border-white/10"} text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 transition-all duration-200`}
                      />
                      {formErrors.fullName && <p className="text-[10px] text-rose-500 font-mono mt-1">{formErrors.fullName}</p>}
                    </div>

                    {/* Mobile Number */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-400 font-mono uppercase tracking-wider block">
                        Mobile Number (Required) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={customerInfo.mobileNumber}
                        onChange={(e) => setCustomerInfo(prev => ({ ...prev, mobileNumber: e.target.value }))}
                        placeholder="e.g. 9119100100"
                        className={`w-full px-3.5 py-2 text-xs rounded-xl bg-white/5 border ${formErrors.mobileNumber ? "border-rose-500" : "border-white/10"} text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 transition-all duration-200`}
                      />
                      {formErrors.mobileNumber && <p className="text-[10px] text-rose-500 font-mono mt-1">{formErrors.mobileNumber}</p>}
                    </div>

                    {/* Email Address */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-400 font-mono uppercase tracking-wider block">
                        Email Address (Optional)
                      </label>
                      <input
                        type="email"
                        value={customerInfo.emailAddress}
                        onChange={(e) => setCustomerInfo(prev => ({ ...prev, emailAddress: e.target.value }))}
                        placeholder="e.g. john@example.com"
                        className={`w-full px-3.5 py-2 text-xs rounded-xl bg-white/5 border ${formErrors.emailAddress ? "border-rose-500" : "border-white/10"} text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 transition-all duration-200`}
                      />
                      {formErrors.emailAddress && <p className="text-[10px] text-rose-500 font-mono mt-1">{formErrors.emailAddress}</p>}
                    </div>

                    {/* Complete Delivery Address */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-400 font-mono uppercase tracking-wider block">
                        Complete Delivery Address (Required) <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        value={customerInfo.deliveryAddress}
                        onChange={(e) => setCustomerInfo(prev => ({ ...prev, deliveryAddress: e.target.value }))}
                        placeholder="Street address, apartment, suite, etc."
                        className={`w-full px-3.5 py-2 text-xs rounded-xl bg-white/5 border ${formErrors.deliveryAddress ? "border-rose-500" : "border-white/10"} text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 transition-all duration-200 h-16 resize-none`}
                      />
                      {formErrors.deliveryAddress && <p className="text-[10px] text-rose-500 font-mono mt-1">{formErrors.deliveryAddress}</p>}
                    </div>

                    {/* Landmark */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-400 font-mono uppercase tracking-wider block">
                        Landmark (Optional)
                      </label>
                      <input
                        type="text"
                        value={customerInfo.landmark}
                        onChange={(e) => setCustomerInfo(prev => ({ ...prev, landmark: e.target.value }))}
                        placeholder="e.g. Near Maliyon Mandir"
                        className="w-full px-3.5 py-2 text-xs rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 transition-all duration-200"
                      />
                    </div>

                    {/* City & State (Two column layout) */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] text-gray-400 font-mono uppercase tracking-wider block">
                          City <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={customerInfo.city}
                          onChange={(e) => setCustomerInfo(prev => ({ ...prev, city: e.target.value }))}
                          placeholder="e.g. Hapur"
                          className={`w-full px-3.5 py-2 text-xs rounded-xl bg-white/5 border ${formErrors.city ? "border-rose-500" : "border-white/10"} text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 transition-all duration-200`}
                        />
                        {formErrors.city && <p className="text-[10px] text-rose-500 font-mono mt-1">{formErrors.city}</p>}
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-gray-400 font-mono uppercase tracking-wider block">
                          State <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={customerInfo.state}
                          onChange={(e) => setCustomerInfo(prev => ({ ...prev, state: e.target.value }))}
                          placeholder="e.g. Uttar Pradesh"
                          className={`w-full px-3.5 py-2 text-xs rounded-xl bg-white/5 border ${formErrors.state ? "border-rose-500" : "border-white/10"} text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 transition-all duration-200`}
                        />
                        {formErrors.state && <p className="text-[10px] text-rose-500 font-mono mt-1">{formErrors.state}</p>}
                      </div>
                    </div>

                    {/* Postal Code & Country (Two column layout) */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] text-gray-400 font-mono uppercase tracking-wider block">
                          Postal/ZIP Code <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={customerInfo.postalCode}
                          onChange={(e) => setCustomerInfo(prev => ({ ...prev, postalCode: e.target.value }))}
                          placeholder="e.g. 245101"
                          className={`w-full px-3.5 py-2 text-xs rounded-xl bg-white/5 border ${formErrors.postalCode ? "border-rose-500" : "border-white/10"} text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 transition-all duration-200`}
                        />
                        {formErrors.postalCode && <p className="text-[10px] text-rose-500 font-mono mt-1">{formErrors.postalCode}</p>}
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-gray-400 font-mono uppercase tracking-wider block">
                          Country <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={customerInfo.country}
                          onChange={(e) => setCustomerInfo(prev => ({ ...prev, country: e.target.value }))}
                          placeholder="e.g. India"
                          className={`w-full px-3.5 py-2 text-xs rounded-xl bg-white/5 border ${formErrors.country ? "border-rose-500" : "border-white/10"} text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 transition-all duration-200`}
                        />
                        {formErrors.country && <p className="text-[10px] text-rose-500 font-mono mt-1">{formErrors.country}</p>}
                      </div>
                    </div>
                  </div>
                ) : checkoutStep === "summary" ? (
                  <div className="space-y-5 text-left">
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                      <h4 className="font-display font-bold text-base text-amber-400">Order Checkout Summary</h4>
                      <span className="text-[10px] font-mono text-gray-500 uppercase">Step 3 of 3</span>
                    </div>

                    {/* Customer Information Card */}
                    <div className="glass p-4 rounded-2xl border border-white/8 space-y-3 shadow-md relative overflow-hidden bg-white/[0.02]">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-amber-400">
                          <UserCheck className="w-4 h-4" />
                          <h5 className="text-xs font-display font-bold uppercase tracking-wider font-mono">Customer Information</h5>
                        </div>
                        <button
                          onClick={() => { setCheckoutStep("info-form"); playClickSound(); }}
                          className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500 hover:text-black border border-amber-500/20 text-amber-400 text-[10px] font-bold transition-all flex items-center space-x-1.5 clickable"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit Details</span>
                        </button>
                      </div>

                      <div className="space-y-1.5 text-xs text-gray-300">
                        <div className="grid grid-cols-3 gap-1">
                          <span className="text-gray-400 font-mono text-[10px] uppercase">Name:</span>
                          <span className="col-span-2 text-white font-medium">{customerInfo.fullName}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-1">
                          <span className="text-gray-400 font-mono text-[10px] uppercase">Mobile:</span>
                          <span className="col-span-2 text-white font-medium">{customerInfo.mobileNumber}</span>
                        </div>
                        {customerInfo.emailAddress && (
                          <div className="grid grid-cols-3 gap-1">
                            <span className="text-gray-400 font-mono text-[10px] uppercase">Email:</span>
                            <span className="col-span-2 text-white font-medium">{customerInfo.emailAddress}</span>
                          </div>
                        )}
                        <div className="grid grid-cols-3 gap-1">
                          <span className="text-gray-400 font-mono text-[10px] uppercase">Address:</span>
                          <span className="col-span-2 text-white leading-snug">
                            {customerInfo.deliveryAddress}
                            {customerInfo.landmark && <span className="block text-[11px] text-gray-400 mt-0.5 font-light">Landmark: {customerInfo.landmark}</span>}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-1">
                          <span className="text-gray-400 font-mono text-[10px] uppercase">Location:</span>
                          <span className="col-span-2 text-white font-medium">
                            {customerInfo.city}, {customerInfo.state} - {customerInfo.postalCode}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-1">
                          <span className="text-gray-400 font-mono text-[10px] uppercase">Country:</span>
                          <span className="col-span-2 text-white font-medium">{customerInfo.country}</span>
                        </div>
                      </div>
                    </div>

                    {/* Ordered Products Section */}
                    <div className="space-y-2.5">
                      <div className="flex items-center space-x-2 text-amber-400">
                        <Utensils className="w-4 h-4" />
                        <h5 className="text-xs font-display font-bold uppercase tracking-wider font-mono">Ordered Products</h5>
                      </div>
                      
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {cart.map((item) => (
                          <div
                            key={item.menuItem.id}
                            className="glass p-3 rounded-xl border border-white/5 flex items-center justify-between"
                          >
                            <div className="flex items-center space-x-2.5">
                              <div className="w-9 h-9 rounded-lg overflow-hidden border border-white/10 flex-shrink-0">
                                <img
                                  src={item.menuItem.image}
                                  alt={item.menuItem.title}
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="text-left min-w-0">
                                <h6 className="text-xs font-bold text-white truncate leading-tight">{item.menuItem.title}</h6>
                                <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                                  Qty: {item.quantity} × {item.menuItem.price}
                                </p>
                              </div>
                            </div>
                            <span className="text-xs font-mono font-bold text-white">
                              ₹{parseInt(item.menuItem.price.replace("₹", "")) * item.quantity}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {cart.map((item) => (
                      <div
                        key={item.menuItem.id}
                        className="glass p-4 rounded-2xl border border-white/8 shadow-md flex items-center space-x-4 relative overflow-hidden"
                      >
                        <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-white/10">
                          <img
                            src={item.menuItem.image}
                            alt={item.menuItem.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-grow space-y-1">
                          <h4 className="font-display font-bold text-sm text-white leading-snug">
                            {item.menuItem.title}
                          </h4>
                          <p className="text-xs text-amber-400 font-mono font-semibold">
                            {item.menuItem.price}
                          </p>
                          
                          {/* Quantity adjust block */}
                          <div className="flex items-center space-x-2.5 pt-1.5">
                            <button
                              onClick={() => updateCartQuantity(item.menuItem.id, -1)}
                              className="p-1 rounded-md bg-white/5 border border-white/10 hover:bg-white/15 text-gray-300 clickable"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-sm font-mono text-white font-medium">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateCartQuantity(item.menuItem.id, 1)}
                              className="p-1 rounded-md bg-white/5 border border-white/10 hover:bg-white/15 text-gray-300 clickable"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Item Total */}
                        <div className="text-right flex flex-col justify-between h-full">
                          <span className="text-sm font-mono font-bold text-white">
                            ₹{parseInt(item.menuItem.price.replace("₹", "")) * item.quantity}
                          </span>
                        </div>
                      </div>
                    ))}

                    {/* Recent Orders Section when NOT empty */}
                    {recentMeals.length > 0 && (
                      <div className="mt-8 pt-6 border-t border-white/10 space-y-3">
                        <div className="flex items-center space-x-2 text-amber-400">
                          <History className="w-4 h-4" />
                          <h4 className="font-display font-bold text-xs uppercase tracking-wider font-mono">Recent Ordered Meals</h4>
                        </div>
                        <p className="text-[10px] text-gray-400 text-left">Quickly add another from your favorites:</p>
                        <div className="grid grid-cols-1 gap-2">
                          {recentMeals.map((meal) => (
                            <div 
                              key={meal.id} 
                              className="glass px-3 py-2.5 rounded-xl border border-white/5 flex items-center justify-between group hover:border-white/10 transition-all"
                            >
                              <div className="flex items-center space-x-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/10 flex-shrink-0">
                                  <img 
                                    src={meal.image} 
                                    alt={meal.title} 
                                    referrerPolicy="no-referrer"
                                    className="w-full h-full object-cover" 
                                  />
                                </div>
                                <div className="min-w-0 text-left">
                                  <h5 className="text-[11px] font-bold text-white truncate group-hover:text-amber-400 transition-colors leading-none">{meal.title}</h5>
                                  <p className="text-[10px] text-amber-500 font-mono mt-1">{meal.price}</p>
                                </div>
                              </div>
                              <button
                                onClick={() => addToCart(meal)}
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-amber-500 hover:text-black border border-white/10 hover:border-amber-500 text-gray-300 text-xs font-bold transition-all flex items-center justify-center clickable"
                                title="Add to order again"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Checkout Calculation Panel */}
              {cart.length > 0 && (
                <div className="p-6 border-t border-white/10 bg-black/40 space-y-4">
                  {checkoutStep === "cart" ? (
                    <>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-gray-400 font-mono">
                          <span>Subtotal</span>
                          <span>₹{getCartTotal()}</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-400 font-mono">
                          <span>SGST / CGST Tax</span>
                          <span className="text-emerald-400 font-medium">₹0.00 (Free)</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-400 font-mono">
                          <span>Delivery Charge</span>
                          <span className="text-emerald-400 font-medium">₹0.00 (Free)</span>
                        </div>
                        <div className="h-[1px] bg-white/10 my-1" />
                        <div className="flex justify-between text-base font-display font-extrabold text-white">
                          <span>Total Invoice</span>
                          <span className="text-amber-400 font-mono">₹{getCartTotal()}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          playClickSound();
                          if (isCustomerInfoCompleted()) {
                            setCheckoutStep("summary");
                          } else {
                            setCheckoutStep("info-form");
                          }
                        }}
                        className="w-full py-4 rounded-xl text-center text-black font-display font-bold text-sm tracking-wide liquid-glass-btn-gold shadow-lg hover:brightness-110 flex items-center justify-center space-x-2.5 clickable"
                        id="checkout-proceed-btn"
                      >
                        <span>Proceed to Checkout</span>
                        <ArrowRight className="w-4 h-4 text-black animate-pulse" />
                      </button>
                    </>
                  ) : checkoutStep === "info-form" ? (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => { playClickSound(); setCheckoutStep("cart"); }}
                          className="py-3 px-4 rounded-xl text-center text-white font-display font-bold text-xs bg-white/5 border border-white/10 hover:bg-white/15 hover:border-white/20 transition-all flex items-center justify-center space-x-1.5 clickable"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                          <span>Back to Cart</span>
                        </button>
                        <button
                          onClick={handleSaveAndProceed}
                          className="py-3 px-4 rounded-xl text-center text-black font-display font-bold text-xs liquid-glass-btn-gold hover:brightness-110 shadow-md transition-all flex items-center justify-center space-x-1.5 clickable"
                        >
                          <span>Save & Continue</span>
                          <ChevronRight className="w-3.5 h-3.5 text-black" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Preparation Notes / Special Instructions Input */}
                      <div className="space-y-1.5 text-left">
                        <label htmlFor="order-notes" className="text-[10px] text-gray-400 font-mono uppercase tracking-wider block">
                          Preparation Notes & Instructions
                        </label>
                        <textarea
                          id="order-notes"
                          value={orderNotes}
                          onChange={(e) => setOrderNotes(e.target.value)}
                          placeholder="e.g. Make it extra spicy, less oil, or any allergies..."
                          maxLength={180}
                          className="w-full px-3.5 py-2 text-xs rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 transition-all duration-200 resize-none h-14"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-gray-400 font-mono">
                          <span>Subtotal</span>
                          <span>₹{getCartTotal()}</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-400 font-mono">
                          <span>Shipping & Delivery Cost</span>
                          <span>₹40</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-400 font-mono">
                          <span>Taxes (5% GST)</span>
                          <span>₹{Math.round(getCartTotal() * 0.05)}</span>
                        </div>
                        <div className="h-[1px] bg-white/10 my-1" />
                        <div className="flex justify-between text-base font-display font-extrabold text-white">
                          <span>Total Amount</span>
                          <span className="text-amber-400 font-mono">
                            ₹{getCartTotal() + 40 + Math.round(getCartTotal() * 0.05)}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <button
                          onClick={handleCheckoutWhatsApp}
                          className="w-full py-4 rounded-xl text-center text-black font-display font-bold text-sm tracking-wide liquid-glass-btn-gold shadow-lg hover:brightness-110 flex items-center justify-center space-x-2.5 clickable"
                          id="checkout-whatsapp-btn"
                        >
                          <MessageCircleIcon className="w-5 h-5 text-black" />
                          <span>Place Order via WhatsApp</span>
                        </button>
                        
                        <button
                          onClick={() => { setCheckoutStep("info-form"); playClickSound(); }}
                          className="w-full text-center text-[10px] text-gray-400 hover:text-amber-400 font-mono uppercase tracking-widest transition-colors block clickable"
                        >
                          ← Change Customer Information
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* RESERVATION / PARTY ENQUIRY MODAL */}
      <AnimatePresence>
        {isBookingOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop Blur overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsBookingOpen(false)}
              className="fixed inset-0 bg-black/75 backdrop-blur-md"
            />

            {/* Liquid Ticket container */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-black/80 backdrop-blur-2xl border border-white/15 w-full max-w-[500px] rounded-3xl overflow-hidden shadow-2xl relative z-10 flex flex-col"
              id="booking-modal-panel"
            >
              {/* Header */}
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-400/20 text-amber-400">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-extrabold text-lg text-white">Table Booking Ticket</h3>
                    <p className="text-[10px] text-gray-400 uppercase font-mono tracking-wider">Fast-track Enquiry</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsBookingOpen(false);
                    playClickSound();
                  }}
                  className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white clickable"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Step 1: Booking Form */}
              {bookingStep === "form" ? (
                <form onSubmit={handleBookingSubmit} className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Event Type selection */}
                    <div className="col-span-2 space-y-1.5">
                      <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider font-semibold">Event / Dining Type</label>
                      <select
                        value={bookingDetails.eventType}
                        onChange={(e) => setBookingDetails({ ...bookingDetails, eventType: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 transition-all duration-300"
                        required
                      >
                        <option value="Casual Dining" className="bg-[#0e0e0e] text-white">🍽️ Casual Dining Setup</option>
                        <option value="Birthday Celebration" className="bg-[#0e0e0e] text-white">🎉 Birthday Party arrangements</option>
                        <option value="Business Meeting" className="bg-[#0e0e0e] text-white">💼 Corporate / Business discussion</option>
                        <option value="Family Reunion" className="bg-[#0e0e0e] text-white">👨‍👩‍👧‍👦 Large Family Reunion</option>
                        <option value="Private Gathering" className="bg-[#0e0e0e] text-white">🔒 Private Custom Gathering</option>
                      </select>
                    </div>

                    {/* Name input */}
                    <div className="col-span-2 space-y-1.5">
                      <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider font-semibold">Contact Full Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Rahul Sharma"
                        value={bookingDetails.name}
                        onChange={(e) => setBookingDetails({ ...bookingDetails, name: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition-all duration-300"
                        required
                      />
                    </div>

                    {/* Phone input */}
                    <div className="col-span-2 space-y-1.5">
                      <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider font-semibold">Phone Number</label>
                      <input
                        type="tel"
                        placeholder="e.g. +91 93682 18143"
                        value={bookingDetails.phone}
                        onChange={(e) => setBookingDetails({ ...bookingDetails, phone: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition-all duration-300"
                        required
                      />
                    </div>

                    {/* Guest Count */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider font-semibold">Guests count</label>
                      <select
                        value={bookingDetails.guests}
                        onChange={(e) => setBookingDetails({ ...bookingDetails, guests: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 transition-all duration-300"
                      >
                        {[1, 2, 4, 6, 8, 12, "15+"].map((g) => (
                          <option key={g} value={g} className="bg-[#0e0e0e] text-white">{g} Patrons</option>
                        ))}
                      </select>
                    </div>

                    {/* Dining Date */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider font-semibold">Dining Date</label>
                      <input
                        type="date"
                        value={bookingDetails.date}
                        onChange={(e) => setBookingDetails({ ...bookingDetails, date: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 transition-all duration-300"
                        required
                      />
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      className="w-full py-4 rounded-xl text-center text-black font-display font-semibold text-sm tracking-wide liquid-glass-btn-gold shadow-lg hover:brightness-110 flex items-center justify-center space-x-2 clickable"
                      id="submit-booking-form"
                    >
                      <span>Generate Confirmation Ticket</span>
                      <ArrowRight className="w-5 h-5 text-black" />
                    </button>
                  </div>
                </form>
              ) : (
                /* Step 2: Confirmed Ticket Receipt styling */
                <div className="p-6 space-y-6 relative overflow-hidden">
                  {/* Watermark logo */}
                  <div className="absolute top-[35%] left-[35%] w-32 h-32 text-amber-500/5 pointer-events-none">
                    <Utensils className="w-full h-full" />
                  </div>

                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
                      <Check className="w-6 h-6" />
                    </div>
                    <h4 className="font-display font-black text-xl text-white">Table Reserved successfully!</h4>
                    <p className="text-xs text-gray-400">Present this Ticket ID upon visiting for fast-track dining entry.</p>
                  </div>

                  {/* Glass Ticket layout */}
                  <div className="glass p-5 rounded-2xl border border-white/12 space-y-4 relative bg-white/3 animate-shimmer">
                    {/* Left/Right ticket notches */}
                    <div className="absolute left-[-11px] top-1/2 -translate-y-1/2 w-5 h-5 bg-black border-r border-white/12 rounded-full z-10" />
                    <div className="absolute right-[-11px] top-1/2 -translate-y-1/2 w-5 h-5 bg-black border-l border-white/12 rounded-full z-10" />

                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[9px] font-mono text-amber-400 uppercase tracking-widest font-bold">Patron Name</span>
                        <h5 className="font-display font-bold text-white text-base">{bookingDetails.name}</h5>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] font-mono text-amber-400 uppercase tracking-widest font-bold">Ticket Code</span>
                        <h5 className="font-mono font-bold text-white text-sm">{confirmedTicketId}</h5>
                      </div>
                    </div>

                    <div className="border-t border-dashed border-white/15 my-3" />

                    <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                      <div>
                        <span className="text-gray-400 block mb-0.5">Setup Type:</span>
                        <span className="text-white font-semibold">{bookingDetails.eventType}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block mb-0.5">Patron Count:</span>
                        <span className="text-white font-semibold">{bookingDetails.guests} People</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block mb-0.5">Scheduled Date:</span>
                        <span className="text-white font-semibold">{bookingDetails.date}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block mb-0.5">Entry Hour:</span>
                        <span className="text-white font-semibold">{bookingDetails.time}</span>
                      </div>
                    </div>
                  </div>

                  {/* Confirm CTAs */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setIsBookingOpen(false);
                        playClickSound();
                      }}
                      className="flex-grow py-3.5 rounded-xl text-center font-display font-semibold text-xs text-white bg-white/5 border border-white/10 hover:bg-white/10 transition-colors duration-200 clickable"
                    >
                      Close Window
                    </button>
                    <button
                      onClick={() => {
                        // Forward ticket info to whatsapp
                        playClickSound();
                        const phone = "919368218143";
                        const message = `*Hemant Gautam Chatkara Restaurant - Reservation Confirmed*\n\nHey Hemant, I've reserved a slot:\n\n• *Ticket Code:* ${confirmedTicketId}\n• *Name:* ${bookingDetails.name}\n• *Guests:* ${bookingDetails.guests}\n• *Type:* ${bookingDetails.eventType}\n• *Date:* ${bookingDetails.date}\n• *Time:* ${bookingDetails.time}\n\nSee you soon!`;
                        const encoded = encodeURIComponent(message);
                        window.open(`https://wa.me/${phone}?text=${encoded}`, "_blank");
                      }}
                      className="flex-grow py-3.5 rounded-xl text-center text-black font-display font-bold text-xs liquid-glass-btn-gold shadow-md flex items-center justify-center space-x-1 clickable"
                    >
                      <MessageCircleIcon className="w-4 h-4 text-black" />
                      <span>Send to WhatsApp</span>
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* GALLERY LIGHTBOX VIEWER */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
            {/* Close trigger clicking outside */}
            <div className="absolute inset-0" onClick={() => setLightboxIndex(null)} />

            {/* Lightbox content panel */}
            <div className="relative z-10 w-full max-w-5xl flex flex-col items-center justify-center space-y-4">
              
              {/* Image Frame */}
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="relative rounded-3xl overflow-hidden max-h-[75dvh] max-w-full border border-white/15 shadow-2xl bg-black"
              >
                <img
                  src={GALLERY_ITEMS[lightboxIndex].image}
                  alt={GALLERY_ITEMS[lightboxIndex].title}
                  referrerPolicy="no-referrer"
                  className="max-h-[75dvh] w-auto max-w-full object-contain mx-auto"
                />
                
                {/* Title overlay info bar */}
                <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black/90 to-transparent flex flex-col text-left">
                  <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest font-bold mb-1">
                    {GALLERY_ITEMS[lightboxIndex].category}
                  </span>
                  <h4 className="font-display font-extrabold text-lg sm:text-xl text-white">
                    {GALLERY_ITEMS[lightboxIndex].title}
                  </h4>
                </div>
              </motion.div>

              {/* Slider Controls */}
              <div className="flex items-center space-x-6">
                <button
                  onClick={() => {
                    setLightboxIndex((prev) => (prev !== null ? (prev - 1 + GALLERY_ITEMS.length) % GALLERY_ITEMS.length : null));
                    playClickSound();
                  }}
                  className="p-3 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/15 clickable"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <span className="text-xs font-mono text-gray-400">
                  {lightboxIndex + 1} / {GALLERY_ITEMS.length}
                </span>
                <button
                  onClick={() => {
                    setLightboxIndex((prev) => (prev !== null ? (prev + 1) % GALLERY_ITEMS.length : null));
                    playClickSound();
                  }}
                  className="p-3 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/15 clickable"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>

              {/* Close Button top-right */}
              <button
                onClick={() => {
                  setLightboxIndex(null);
                  playClickSound();
                }}
                className="absolute top-4 right-4 p-2.5 rounded-full bg-black/60 border border-white/15 text-gray-300 hover:text-white clickable"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Active Order Status Tracker */}
      <AnimatePresence>
        {activeOrderTracker && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-4 left-4 md:left-6 z-40 max-w-md w-[calc(100vw-2rem)] md:w-96 glass p-5 rounded-2xl border border-amber-500/30 shadow-2xl bg-black/95 text-left overflow-hidden"
          >
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10 relative">
              <div className="flex items-center space-x-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-duration-1000"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <h4 className="font-display font-extrabold text-xs md:text-sm text-white tracking-wide">Live Order Tracker</h4>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="text-[9px] font-mono bg-white/10 px-2 py-0.5 rounded-md text-amber-300 font-bold uppercase tracking-wider">
                  {activeOrderTracker.id}
                </span>
                <button
                  onClick={() => {
                    playClickSound();
                    setActiveOrderTracker(null);
                  }}
                  className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors clickable"
                  title="Dismiss Tracker"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Main content */}
            <div className="mt-4 space-y-4">
              {/* Order Info */}
              <div className="flex justify-between text-xs text-gray-300">
                <span>Items Ordered: <strong className="text-white font-mono">{activeOrderTracker.itemsCount}</strong></span>
                <span>Total Bill: <strong className="text-amber-400 font-mono">₹{activeOrderTracker.total}</strong></span>
              </div>

              {/* Status Visual Progress Bar */}
              <div className="relative pt-1">
                {/* Gray progress background bar */}
                <div className="overflow-hidden h-1.5 text-xs flex rounded bg-white/10">
                  <motion.div
                    initial={{ width: "0%" }}
                    animate={{
                      width: 
                        activeOrderTracker.status === "Confirmed" ? "15%" :
                        activeOrderTracker.status === "Preparing" ? "50%" :
                        "100%"
                    }}
                    transition={{ type: "spring", stiffness: 80, damping: 15 }}
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                  />
                </div>
              </div>

              {/* Flow Steps layout */}
              <div className="grid grid-cols-3 gap-1 pt-1">
                {/* Step 1: Confirmed */}
                <div className="text-center flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                    activeOrderTracker.status === "Confirmed" 
                      ? "bg-amber-500 text-black font-extrabold ring-4 ring-amber-500/20 scale-110" 
                      : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                  }`}>
                    {activeOrderTracker.status !== "Confirmed" ? (
                      <Check className="w-4 h-4 stroke-[3]" />
                    ) : (
                      <Package className="w-4 h-4 animate-bounce" />
                    )}
                  </div>
                  <span className="text-[10px] mt-1.5 font-bold font-display text-white tracking-wide block">Confirmed</span>
                  <span className="text-[8px] text-gray-400 font-mono mt-0.5 leading-tight">Order Received</span>
                </div>

                {/* Step 2: Preparing */}
                <div className="text-center flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                    activeOrderTracker.status === "Preparing"
                      ? "bg-amber-500 text-black font-extrabold ring-4 ring-amber-500/20 scale-110"
                      : activeOrderTracker.status === "Confirmed"
                        ? "bg-white/5 text-gray-400 border border-white/10"
                        : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                  }`}>
                    {activeOrderTracker.status === "Out for Delivery" ? (
                      <Check className="w-4 h-4 stroke-[3]" />
                    ) : (
                      <ChefHat className={`w-4 h-4 ${activeOrderTracker.status === "Preparing" ? "animate-pulse" : ""}`} />
                    )}
                  </div>
                  <span className="text-[10px] mt-1.5 font-bold font-display tracking-wide block transition-colors duration-300" style={{
                    color: activeOrderTracker.status === "Confirmed" ? "rgba(156, 163, 175, 0.4)" : "#ffffff"
                  }}>Preparing</span>
                  <span className="text-[8px] text-gray-400 font-mono mt-0.5 leading-tight">Chef Cooking</span>
                </div>

                {/* Step 3: Out for Delivery */}
                <div className="text-center flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                    activeOrderTracker.status === "Out for Delivery"
                      ? "bg-amber-500 text-black font-extrabold ring-4 ring-amber-500/20 scale-110"
                      : "bg-white/5 text-gray-400 border border-white/10"
                  }`}>
                    <Truck className={`w-4 h-4 ${activeOrderTracker.status === "Out for Delivery" ? "animate-bounce" : ""}`} />
                  </div>
                  <span className="text-[10px] mt-1.5 font-bold font-display tracking-wide block transition-colors duration-300" style={{
                    color: activeOrderTracker.status !== "Out for Delivery" ? "rgba(156, 163, 175, 0.4)" : "#ffffff"
                  }}>On the Way</span>
                  <span className="text-[8px] text-gray-400 font-mono mt-0.5 leading-tight">Out for Delivery</span>
                </div>
              </div>

              {/* Status Message Footer */}
              <div className="bg-white/5 rounded-xl p-2.5 border border-white/5 flex items-center space-x-2.5 mt-2">
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <p className="text-[10.5px] text-gray-300 leading-normal">
                  {activeOrderTracker.status === "Confirmed" && (
                    <>Your order has been sent to Chatkara Restaurant. Awaiting shop confirmation via WhatsApp.</>
                  )}
                  {activeOrderTracker.status === "Preparing" && (
                    <>Chef is preparing your sizzling food with premium ingredients and hygienic controls.</>
                  )}
                  {activeOrderTracker.status === "Out for Delivery" && (
                    <>Our hot & fresh food is out for delivery! The delivery driver is headed to your address.</>
                  )}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <SaraAssistant />
    </div>
  );
}

// Simple custom inline SVG loader icon since we only use lucide-react standard icons, but we want a WhatsApp styled logo!
function MessageCircleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={props.className || "w-5 h-5"}
      {...props}
    >
      <path d="M12.004 2c-5.518 0-10 4.482-10 10 0 1.745.452 3.442 1.312 4.935l-1.312 4.793 4.912-1.288c1.452.801 3.084 1.226 4.757 1.226 5.517 0 10-4.482 10-10s-4.483-10-10-10zm.004 18c-1.545 0-3.054-.413-4.385-1.196l-.314-.186-2.923.766.78-2.846-.204-.325c-.846-1.347-1.293-2.917-1.293-4.546 0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8zm4.672-6.52c-.255-.127-1.51-.745-1.745-.829-.234-.085-.404-.128-.574.128-.17.255-.658.829-.807.999-.149.17-.297.191-.553.064-.255-.128-1.077-.397-2.051-1.266-.758-.677-1.27-1.513-1.419-1.768-.149-.255-.016-.393.111-.519.115-.113.255-.297.383-.446.127-.149.17-.255.255-.425.085-.17.042-.319-.021-.446-.064-.128-.574-1.381-.786-1.892-.206-.502-.413-.432-.574-.44l-.49-.009c-.17 0-.446.064-.68.319-.234.255-.893.871-.893 2.125s.914 2.465 1.041 2.635c.127.17 1.8 2.748 4.36 3.853.608.263 1.083.421 1.452.538.611.194 1.167.167 1.605.101.488-.074 1.51-.617 1.722-1.211.213-.595.213-1.105.149-1.211-.064-.107-.234-.17-.488-.297z" />
    </svg>
  );
}
