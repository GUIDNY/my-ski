// The apartment columns anyone may see. Left out on purpose: the supplier's
// own price and reference (source_price_per_night, source_ref) and the owner
// payments; those are for the admin only.
export const PUBLIC_APARTMENT_COLUMNS =
  "id,name,type,beds,baths,sqm,max_guests,map_url,price_per_night,images,amenities,description,available,created_at,source,available_weeks";
