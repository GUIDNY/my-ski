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
