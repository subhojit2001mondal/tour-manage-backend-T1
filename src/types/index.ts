export type Region = "North" | "South" | "East" | "West" | "Central" | "Northeast" | "Islands";
export type AgencyTier = "budget" | "standard" | "premium";
export type VehicleType = "Sedan" | "SUV" | "Tempo Traveller" | "Mini Bus" | "Luxury Coach" | "4x4 Jeep" | "Train + Cab" | "Flight + Cab" | "Boat/Houseboat" | "Other";
export type MealPlan = "No meals" | "Breakfast only" | "Breakfast + Dinner" | "All meals";
export type CuisineType = "Veg" | "Non-veg" | "Veg & Non-veg";
export type HotelCategory = "Budget" | "3-star" | "4-star" | "5-star" | "Heritage" | "Resort" | "Homestay" | "Houseboat" | "Camp";
export type HotelOccupancy = "Single" | "Double sharing" | "Triple sharing";
export type DepartureStatus = "open" | "limited" | "full" | "closed";
export type BookingStatus = "held" | "confirmed" | "cancelled" | "completed" | "refunded";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type PayoutStatus = "pending" | "settled";
export type ChatMode = "bot" | "human";
export type ChatStatus = "open" | "waiting_for_staff" | "closed";
export type CallbackStatus = "new" | "called" | "closed";
export type StaffRole = "owner" | "support";

export interface Destination {
  id: string;
  name: string;
  state: string;
  region: Region;
  description: string;
  coverImageUrl: string;
  galleryUrls: string[];
  bestSeason: string;
  tags: string[];
  featured: boolean;
  active: boolean;
  isDemo?: boolean;
}

export interface Agency {
  id: string;
  name: string;
  logoUrl: string;
  description: string;
  tier: AgencyTier;
  rating: number;
  verified: boolean;
  phone: string;
  email: string;
  city: string;
  commissionPercent: number;
  active: boolean;
  isDemo?: boolean;
}

export interface VehicleInfo {
  type: VehicleType;
  vehicleName: string;
  ac: boolean;
  seatingCapacity: number;
  stationOrAirportPickup: boolean;
  details: string;
  imageUrl?: string;
}

export interface FoodInfo {
  mealPlan: MealPlan;
  cuisine: CuisineType;
  jainOnRequest: boolean;
  details: string;
}

export interface HotelInfo {
  hotelName: string;
  category: HotelCategory;
  roomType: string;
  occupancy: HotelOccupancy;
  amenities: string[];
  details: string;
  imageUrls: string[];
}

export interface ItineraryDay {
  day: number;
  title: string;
  details: string;
}

export interface TourPackage {
  id: string;
  agencyId: string;
  destinationId: string;
  title: string;
  days: number;
  nights: number;
  pricePerPerson: number;
  inclusions: string[];
  exclusions: string[];
  itinerary: ItineraryDay[];
  cancellationPolicy: string;
  maxGroupSize: number;
  imageUrls: string[];
  rating: number;
  active: boolean;
  vehicle: VehicleInfo;
  food: FoodInfo;
  hotel: HotelInfo;
  isDemo?: boolean;
}

export interface Departure {
  id: string;
  packageId: string;
  agencyId: string;
  destinationId: string;
  date: string; // ISO date string
  seatsTotal: number;
  seatsBooked: number;
  seatsHeld: number;
  priceOverride?: number;
  status: DepartureStatus;
  isDemo?: boolean;
}

export interface Customer {
  uid: string;
  name: string;
  phone: string;
  email: string;
  createdAt: string;
  isDemo?: boolean;
}

export interface Traveler {
  name: string;
  age: number;
}

export interface Booking {
  id: string;
  bookingCode: string;
  customerId: string;
  packageId: string;
  agencyId: string;
  destinationId: string;
  departureId: string;
  travelDate: string;
  travelers: Traveler[];
  totalAmount: number;
  commissionAmount: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  holdExpiresAt?: string;
  agencyPayoutStatus: PayoutStatus;
  notes?: string;
  createdAt: string;
  isDemo?: boolean;
}

export interface Chat {
  id: string;
  customerId: string;
  mode: ChatMode;
  status: ChatStatus;
  assignedStaffId?: string;
  lastMessage: string;
  lastMessageAt: string;
  isDemo?: boolean;
}

export interface ChatMessage {
  id: string;
  sender: "customer" | "bot" | "staff";
  text: string;
  createdAt: string;
  isDemo?: boolean;
}

export interface CallbackRequest {
  id: string;
  customerId?: string;
  name: string;
  phone: string;
  topic: string;
  status: CallbackStatus;
  createdAt: string;
  isDemo?: boolean;
}

export interface Staff {
  uid: string;
  name: string;
  email: string;
  role: StaffRole;
  active: boolean;
  isDemo?: boolean;
}

export interface CompanySettings {
  companyName: string;
  supportPhones: string[];
  supportEmail: string;
  supportHours: string;
  whatsappNumber: string;
  aboutText: string;
  termsUrl: string;
  isDemo?: boolean;
}
