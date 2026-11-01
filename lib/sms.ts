type TicketCreatedSmsInput = {
  recipient: string;
  clientName: string;
  jobTitle: string;
  ticketId: string;
  followUpLink: string;
};

type FitsmsResponse =
  | { status: "success"; data?: { status?: string; ruid?: string } }
  | { status: "error"; message?: string };

function normalizeRecipient(phone: string) {
  const recipient = phone.replace(/\D/g, "");
  if (recipient.length < 10) throw new Error("The customer's phone number is invalid.");
  return recipient;
}

export async function sendTicketCreatedSms({
  recipient,
  clientName,
  jobTitle,
  ticketId,
  followUpLink,
}: TicketCreatedSmsInput) {
  const apiKey = process.env.FITSMS_API_KEY;
  if (!apiKey) throw new Error("FITSMS_API_KEY is not configured.");

  const response = await fetch(process.env.FITSMS_API_URL ?? "https://app.fitsms.lk/api/v4/sms/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      recipient: normalizeRecipient(recipient),
      sender_id: process.env.FITSMS_SENDER_ID ?? "YourName",
      type: "plain",
      message: `Hello ${clientName}, ticket ${ticketId} (${jobTitle}) was created. Track it here: ${followUpLink}`,
      expiry_time: 3600,
    }),
    cache: "no-store",
  });

  let result: FitsmsResponse;
  try {
    result = (await response.json()) as FitsmsResponse;
  } catch {
    throw new Error(`Fitsms returned an invalid response (HTTP ${response.status}).`);
  }

  if (!response.ok || result.status !== "success") {
    throw new Error(result.status === "error" ? result.message ?? "Fitsms rejected the SMS." : `Fitsms returned HTTP ${response.status}.`);
  }
}
