/**
 * Israeli holidays that fall in a Saturday-to-Saturday week of the season
 * (dates from Hebcal: Hanukkah 4 to 12.12.2026, Pesach 21 to 28.4.2027), with
 * the guide about skiing then. Shown next to the week in the package table and
 * the week picker. Add next season's when its weeks open.
 */
export const HOLIDAY_WEEKS: Record<string, { label: string; href: string }> = {
  "2026-12-05": { label: "חנוכה", href: "/guide/חופשת-סקי-בחנוכה" },
  "2027-04-17": { label: "פסח", href: "/guide/חופשת-סקי-בפסח" },
  "2027-04-24": { label: "פסח", href: "/guide/חופשת-סקי-בפסח" },
};
