import { Resend } from "resend";

type TicketCreatedEmailInput = {
  recipient: string;
  clientName: string;
  jobTitle: string;
  ticketId: string;
  followUpLink: string;
};

export async function sendTicketCreatedEmail({
  recipient,
  clientName,
  jobTitle,
  ticketId,
  followUpLink,
}: TicketCreatedEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not configured.");

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev",
    to: recipient,
    template: {
      id: "tick_crt-mail",
      variables: {
        client_name: clientName,
        job_title: jobTitle,
        ticket_id: ticketId,
        follow_up_link: followUpLink,
      },
    },
  });

  if (error) throw new Error(error.message);
}
