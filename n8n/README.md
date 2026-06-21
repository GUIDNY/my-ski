# n8n — booking confirmation email

When a customer pays, PayPlus calls our `/api/payplus/callback`, which forwards
the transaction to an n8n webhook. n8n then emails the customer a branded
booking confirmation.

## Setup (one time)

1. In n8n: **Workflows → Import from File** → choose `skishare-booking-email.json`.
2. Open the **Send email (Gmail)** node → connect your Gmail account
   (skishareteam@gmail.com) as a credential. (Or replace it with an
   "Send Email" SMTP node if you prefer.)
3. **Activate** the workflow (toggle top-right).
4. Copy the **Production webhook URL** from the Webhook node
   (looks like `https://<your-n8n>/webhook/skishare-booking`).
5. Send me that URL — I'll set it as `N8N_WEBHOOK_URL` in Vercel, and every
   paid order will trigger the email automatically.

## Notes
- The email is HTML (renders nicely in Gmail/Apple Mail). For a PDF attachment,
  add an "HTML to PDF" node before the Gmail node and attach its output.
- Make sure the PayPlus payment page is set to **collect the customer's email**
  so the callback includes it.
- The Code node defensively looks for the email/name/amount in the PayPlus
  payload; if PayPlus changes field names, adjust it there.
