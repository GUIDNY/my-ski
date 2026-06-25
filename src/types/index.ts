export type Apartment = {
  id: string;
  name: string;
  type: string;
  beds: number;
  baths: number;
  sqm: number;
  max_guests?: number | null;
  map_url?: string | null;
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
  equipment?: boolean;
  cancel: string;
  service: string;
  total_eur: number;
  status: "awaiting" | "hold" | "approved" | "cancelled";
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  payplus_transaction_uid?: string | null;
  amount_ils?: number | null;
  transfer_details?: string | null;
  group_id?: string | null;
  shares_total?: number | null;
  extra_apartment_name?: string | null;
  ops?: Record<string, boolean> | null;
  created_at: string;
};

export type SeasonRental = {
  id: string;
  name: string;
  area: string;
  beds: number;
  sleeps: number;
  price_per_month: number;
  monthly_prices?: Record<string, number> | null;
  min_months: number;
  available_from: string | null;
  available_to: string | null;
  images: string[];
  amenities: string[];
  description: string;
  available: boolean;
  created_at: string;
};
