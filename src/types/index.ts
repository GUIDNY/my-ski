export type Apartment = {
  id: string;
  name: string;
  type: string;
  beds: number;
  baths: number;
  sqm: number;
  price_per_night: number;
  images: string[];
  amenities: string[];
  description: string;
  available: boolean;
  created_at: string;
};

export type Booking = {
  id: string;
  apartment_id: string;
  check_in: string;
  check_out: string;
  guests: number;
  total_price: number;
  status: "pending" | "confirmed" | "cancelled";
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  add_ons: {
    ski_pass?: boolean;
    transfer?: boolean;
    flight?: boolean;
    insurance?: boolean;
    agent?: boolean;
  };
  created_at: string;
  apartment?: Apartment;
};

export type SkiPass = {
  id: string;
  name: string;
  duration_days: number;
  price: number;
  type: "adult" | "child" | "senior";
  available: boolean;
};

export type Order = {
  id: string;
  code: string;
  apartment_id: string | null;
  apartment_name: string;
  area: string;
  checkin: string | null;
  checkout: string | null;
  guests: number;
  nights: number;
  ski_pass: boolean;
  transfer: boolean;
  cancel: string;
  service: string;
  total_eur: number;
  status: "awaiting" | "hold" | "approved" | "cancelled";
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  created_at: string;
};

export type SeasonRental = {
  id: string;
  name: string;
  area: string;
  beds: number;
  sleeps: number;
  price_per_month: number;
  min_months: number;
  available_from: string | null;
  available_to: string | null;
  images: string[];
  amenities: string[];
  description: string;
  available: boolean;
  created_at: string;
};
