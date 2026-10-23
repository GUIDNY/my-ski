import { redirect } from "next/navigation";

// The old booking form's thank-you page: bookings are in "האזור שלי" now.
export default function OldBookConfirmPage() {
  redirect("/my");
}
