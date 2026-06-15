export const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '')
    .replace(/-+/g, '-')
    .trim();
};

// Create a slug from apartment ID or name
export const createApartmentSlug = (apt: any): string => {
  // Use a combination of ID and name for readability
  const nameSlug = generateSlug(apt.name);
  return `${apt.id.slice(0, 8)}`;
};

export const createSlugMap = (apartments: any[]) => {
  return Object.fromEntries(
    apartments.map(apt => [createApartmentSlug(apt), apt])
  );
};
