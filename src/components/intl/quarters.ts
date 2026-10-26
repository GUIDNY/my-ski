/** The village quarters of Val Thorens (lib/residences Q), in English and French. */
export const QUARTER_NAME: Record<"en" | "fr", Record<string, { short: string; long: string }>> = {
  en: {
    Caron: { short: "Caron quarter", long: "Caron (village centre)" },
    Péclet: { short: "Péclet quarter", long: "Péclet (upper village)" },
    Arolles: { short: "Arolles quarter", long: "Arolles (village entrance)" },
    Slalom: { short: "Slalom quarter", long: "Slalom (quiet, by the pistes)" },
    Balcons: { short: "Les Balcons", long: "Les Balcons (quiet, chalets)" },
    Soleil: { short: "Soleil quarter", long: "Soleil (lower village)" },
  },
  fr: {
    Caron: { short: "Quartier Caron", long: "Caron (centre du village)" },
    Péclet: { short: "Quartier Péclet", long: "Péclet (haut du village)" },
    Arolles: { short: "Quartier Arolles", long: "Arolles (entrée du village)" },
    Slalom: { short: "Quartier Slalom", long: "Slalom (calme, au pied des pistes)" },
    Balcons: { short: "Les Balcons", long: "Les Balcons (calme, chalets)" },
    Soleil: { short: "Quartier Soleil", long: "Soleil (bas du village)" },
  },
};
