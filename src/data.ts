const pizzaHero = "/src/assets/images/pizza_hero_1782668640257.jpg";
const momosLuxury = "/src/assets/images/momos_luxury_1782668652103.jpg";
const chaapLuxury = "/src/assets/images/chaap_luxury_1782668664578.jpg";
const diningHall = "/src/assets/images/dining_hall_1782668677775.jpg";
const noodlesLuxury = "/src/assets/images/noodles_luxury_1782668695059.jpg";
const friesLuxury = "/src/assets/images/fries_luxury_1782668706922.jpg";
const birthdayPartyLuxury = "/src/assets/images/birthday_party_luxury_1782668719188.jpg";

export interface MenuItem {
  id: string;
  title: string;
  category: string;
  description: string;
  price: string;
  image: string;
  badge?: string;
}

export const MENU_ITEMS: MenuItem[] = [
  {
    id: "pizza-1",
    title: "Wood-Fired Pizza Royale",
    category: "🍕 Pizza",
    description: "Crisp hand-tossed artisan crust topped with premium fresh mozzarella, organic cherry tomatoes, fresh basil leaves, and a luxurious drizzle of extra virgin olive oil.",
    price: "₹349",
    image: pizzaHero,
    badge: "Chef's Special"
  },
  {
    id: "momos-1",
    title: "Steamed Himalayan Dumplings",
    category: "🥟 Momos",
    description: "Hand-crafted delicate parcels filled with seasoned farm-fresh chopped vegetables and soft cottage cheese, served with our signature spicy red pepper dip.",
    price: "₹189",
    image: momosLuxury,
    badge: "Best Seller"
  },
  {
    id: "chaap-1",
    title: "Signature Tandoori Malai Chaap",
    category: "🌯 All Types of Chaap",
    description: "Tender organic soya pieces slow-roasted in our traditional clay tandoor, lavishly folded with thick fresh cream, spiced butter, and garden-picked herbs.",
    price: "₹249",
    image: chaapLuxury,
    badge: "Must Try"
  },
  {
    id: "noodles-1",
    title: "Gourmet Vegetable Hakka Noodles",
    category: "🍜 Noodles",
    description: "Wok-tossed premium noodles paired with crunchy julienne bell peppers, organic carrots, baby corn, and scallions with a dash of fine dark artisanal soy.",
    price: "₹199",
    image: noodlesLuxury
  },
  {
    id: "fries-1",
    title: "Rosemary & Sea Salt French Fries",
    category: "🍟 French Fries",
    description: "Double-cooked crispy gold potato fingers tossed gently in hand-harvested sea salt, cracked black pepper, and premium aromatic fresh garden rosemary.",
    price: "₹129",
    image: friesLuxury
  },
  {
    id: "drinks-1",
    title: "Crafted Soda & Elixirs",
    category: "🥤 Cold Drinks",
    description: "Chilled selection of premium artisanal sodas, vibrant fresh mint mojitos, and carbonated local favorites served over hand-carved crystal clear block ice.",
    price: "₹79",
    image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=600"
  }
];

export interface Facility {
  id: string;
  title: string;
  description: string;
  iconName: string;
}

export const FACILITIES: Facility[] = [
  {
    id: "fac-1",
    title: "Fully Air-Conditioned Dining Hall",
    description: "Stay perfectly cool in a highly refined, premium climate-controlled space designed for peak comfort.",
    iconName: "Wind"
  },
  {
    id: "fac-2",
    title: "Professional Waiter Service",
    description: "Attentive, immaculate, and highly professional service crew trained to accommodate your every request.",
    iconName: "UserCheck"
  },
  {
    id: "fac-3",
    title: "Comfortable Family Seating",
    description: "Generous seating booths and quiet alcoves tailored perfectly for family gatherings and dining together.",
    iconName: "Users"
  },
  {
    id: "fac-4",
    title: "Hygienic State-of-the-Art Kitchen",
    description: "Pristine, sparkling clean kitchen facilities executing the highest global hygiene standards and food safety.",
    iconName: "Sparkles"
  },
  {
    id: "fac-5",
    title: "Express Fast Food Service",
    description: "Rapid, premium preparation keeping dishes piping hot, ensuring zero waiting hassle for busy patrons.",
    iconName: "Zap"
  },
  {
    id: "fac-6",
    title: "Birthday Party Arrangements",
    description: "Fully customized premium decorations, bespoke cake tables, and sound setups for unforgettable milestones.",
    iconName: "Gift"
  },
  {
    id: "fac-7",
    title: "Private Business Meeting Space",
    description: "A private, quiet, air-conditioned zone optimized with comfortable seating for business chats and focus.",
    iconName: "Briefcase"
  },
  {
    id: "fac-8",
    title: "Elegant Group Dining",
    description: "Large-format long dining configurations to comfortably accommodate corporate teams, friends, and reunions.",
    iconName: "ChefHat"
  },
  {
    id: "fac-9",
    title: "Luxurious Cozy Interior",
    description: "Apple-inspired warm minimalist wooden decor, liquid glass partitions, and premium leather seating.",
    iconName: "Heart"
  }
];

export interface Review {
  id: string;
  name: string;
  role: string;
  rating: number;
  text: string;
  photo: string;
}

export const REVIEWS: Review[] = [
  {
    id: "rev-1",
    name: "Arjun Sharma",
    role: "Local Food Critic",
    rating: 5,
    text: "The Malai Chaap here is on another level. It literally melts in your mouth! The Liquid Glass UI of their brand matches the actual physical dining space—clean, modern, minimalist, and extremely high-end. Pure luxury dining.",
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200"
  },
  {
    id: "rev-2",
    name: "Priyanka Patel",
    role: "Frequent Diner",
    rating: 5,
    text: "We hosted my daughter's birthday party here last week and the experience was exceptional. The decorations were incredibly beautiful, the service team was professional, and the hot wood-fired pizzas were loved by all.",
    photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200"
  },
  {
    id: "rev-3",
    name: "Vikram Malhotra",
    role: "Business Executive",
    rating: 5,
    text: "Their private meeting space is outstanding. It is quiet, fully air-conditioned, and has a very comfortable atmosphere. We had a great business discussion followed by delicious noodles and starters. Excellent!",
    photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200"
  },
  {
    id: "rev-4",
    name: "Sneha Gupta",
    role: "Food Enthusiast",
    rating: 5,
    text: "Pristine hygiene and unmatched taste! The open kitchen is spotless, and you can see the care they take in making every plate of Momos. Hemant Gautam Chatkara is hands-down the best premium restaurant in town.",
    photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200"
  }
];

export interface GalleryItem {
  id: string;
  title: string;
  category: string;
  image: string;
}

export const GALLERY_ITEMS: GalleryItem[] = [
  {
    id: "gal-1",
    title: "Wood-Fired Pizza Crust",
    category: "Pizza",
    image: pizzaHero
  },
  {
    id: "gal-2",
    title: "Steaming Himalayan Dumplings",
    category: "Momos",
    image: momosLuxury
  },
  {
    id: "gal-3",
    title: "Signature Malai Chaap Platters",
    category: "Chaap",
    image: chaapLuxury
  },
  {
    id: "gal-4",
    title: "Wok-Tossed Hakka Noodles",
    category: "Noodles",
    image: noodlesLuxury
  },
  {
    id: "gal-5",
    title: "Crispy Rosemary Sea Salt Fries",
    category: "French Fries",
    image: friesLuxury
  },
  {
    id: "gal-6",
    title: "Premium AC Dining Hall Setup",
    category: "Interior",
    image: diningHall
  },
  {
    id: "gal-7",
    title: "Golden Birthday Celebration Setup",
    category: "Birthday Setup",
    image: birthdayPartyLuxury
  },
  {
    id: "gal-8",
    title: "Cozy Ambient Seating & Lounges",
    category: "Dining Area",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800"
  }
];
