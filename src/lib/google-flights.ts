// Build Google Flights' `tfs` query parameter (protobuf-encoded round trip).
// Structure reverse-engineered from real Google Flights URLs. Shared by the
// apartment page (as the link a customer actually clicks) and the
// server-side flight-price scraper, so the displayed price and the page it
// links to are always the exact same query — using btoa instead of Buffer
// so this one file works in both the browser and the Node API route.
function buildTfs(outDate: string, retDate: string, origin: string, dest: string): string {
  const enc = (s: string) => s.split("").map(c => c.charCodeAt(0));
  const makeLeg = (date: string, from: string, to: string) => {
    const leg = [
      0x12, 0x0a, ...enc(date),
      0x6a, 0x07, 0x08, 0x01, 0x12, 0x03, ...enc(from),
      0x72, 0x07, 0x08, 0x01, 0x12, 0x03, ...enc(to),
    ];
    return [0x1a, leg.length, ...leg];
  };
  const bytes = [0x08, 0x01, 0x10, 0x02, ...makeLeg(outDate, origin, dest), ...makeLeg(retDate, dest, origin)];
  return btoa(String.fromCharCode(...bytes));
}

export function buildGoogleFlightsUrl(outDate: string, retDate: string, origin: string, dest: string): string {
  const tfs = buildTfs(outDate, retDate, origin, dest);
  return `https://www.google.com/travel/flights?hl=en&gl=us&curr=EUR&tfs=${tfs}`;
}
