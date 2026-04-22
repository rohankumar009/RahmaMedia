const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const OWNER_EMAIL = "ramlline10@gmail.com";
const FROM_ADDRESS = "Rahma Media <noreply@rahma.media>";
const REPLY_TO = "ramlline10@gmail.com";

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { name, email, phone, project, message, preference, lang } = req.body || {};
  const isArabic = String(lang).trim() === "ar";

  if (!String(name ?? "").trim() || !String(email ?? "").trim() || !String(message ?? "").trim()) {
    return res.status(400).json({ error: "Required fields missing" });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Invalid email address" });
  }

  const firstName = String(name).trim().split(/\s+/)[0];

  try {
    await Promise.all([
      resend.emails.send({
        from: FROM_ADDRESS,
        reply_to: REPLY_TO,
        to: OWNER_EMAIL,
        subject: "New Website Inquiry",
        html: ownerEmail({ name, email, phone, project, message, preference }),
      }),
      resend.emails.send({
        from: FROM_ADDRESS,
        reply_to: REPLY_TO,
        to: String(email).trim(),
        subject: isArabic ? "لقد استلمنا طلبك" : "We Received Your Inquiry",
        html: isArabic ? customerEmailAr({ firstName }) : customerEmail({ firstName }),
      }),
    ]);

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Resend error:", err);
    return res.status(500).json({ error: "Failed to send email. Please try again." });
  }
};

function ownerEmail({ name, email, phone, project, message, preference }) {
  const row = (label, value) =>
    value
      ? `<tr>
          <td style="padding:0.5rem 0;vertical-align:top;width:130px;font-size:0.75rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:rgba(69,40,41,0.5);white-space:nowrap;">${label}</td>
          <td style="padding:0.5rem 0;font-size:0.9rem;color:#452829;">${esc(value)}</td>
        </tr>`
      : "";

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/></head><body style="margin:0;padding:0;background:#f8f0e5;font-family:Inter,system-ui,sans-serif;">
  <div style="max-width:580px;margin:0 auto;padding:2rem 1.5rem;">
    <div style="background:#fff;border-radius:12px;padding:2rem 2.25rem;border:1px solid rgba(107,58,42,0.12);">
      <p style="margin:0 0 0.35rem;font-size:0.72rem;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:rgba(69,40,41,0.45);">Rahma Media</p>
      <h1 style="margin:0 0 1.75rem;font-size:1.35rem;font-weight:700;color:#452829;">New Website Inquiry</h1>
      <table style="width:100%;border-collapse:collapse;">
        ${row("Full Name", name)}
        ${row("Email", email)}
        ${row("Phone", phone)}
        ${row("Project Type", project)}
        ${row("Preferred Contact", preference)}
      </table>
      <hr style="border:none;border-top:1px solid rgba(107,58,42,0.1);margin:1.25rem 0;"/>
      <p style="margin:0 0 0.4rem;font-size:0.72rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:rgba(69,40,41,0.5);">Project Goals</p>
      <p style="margin:0;font-size:0.9rem;color:#452829;line-height:1.7;white-space:pre-wrap;">${esc(message)}</p>
    </div>
  </div>
</body></html>`;
}

function customerEmail({ firstName }) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/></head><body style="margin:0;padding:0;background:#f8f0e5;font-family:Inter,system-ui,sans-serif;">
  <div style="max-width:580px;margin:0 auto;padding:2rem 1.5rem;">
    <div style="background:#fff;border-radius:12px;padding:2rem 2.25rem;border:1px solid rgba(107,58,42,0.12);">
      <p style="margin:0 0 0.35rem;font-size:0.72rem;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:rgba(69,40,41,0.45);">Rahma Media</p>
      <h1 style="margin:0 0 1.25rem;font-size:1.35rem;font-weight:700;color:#452829;">We Received Your Inquiry</h1>
      <p style="margin:0 0 0.9rem;font-size:0.925rem;color:rgba(69,40,41,0.75);line-height:1.7;">Hi ${esc(firstName)},</p>
      <p style="margin:0 0 0.9rem;font-size:0.925rem;color:rgba(69,40,41,0.75);line-height:1.7;">Thank you for reaching out to Rahma Media. We've received your inquiry and our team will review it shortly.</p>
      <p style="margin:0 0 1.5rem;font-size:0.925rem;color:rgba(69,40,41,0.75);line-height:1.7;">We typically respond within 24 hours. We look forward to learning more about your project and helping you build something great.</p>
      <hr style="border:none;border-top:1px solid rgba(107,58,42,0.1);margin:0 0 1rem;"/>
      <p style="margin:0;font-size:0.8rem;color:rgba(69,40,41,0.4);"><strong style="color:#452829;">Rahma Media</strong> &mdash; Crafted for launch momentum.</p>
    </div>
  </div>
</body></html>`;
}

function customerEmailAr({ firstName }) {
  const greeting = firstName
    ? `السلام عليكم ${esc(firstName)}،`
    : "السلام عليكم،";

  return `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="utf-8"/>
<link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap" rel="stylesheet"/>
</head><body style="margin:0;padding:0;background:#f8f0e5;font-family:'Tajawal',system-ui,sans-serif;direction:rtl;">
  <div style="max-width:580px;margin:0 auto;padding:2rem 1.5rem;">
    <div style="background:#fff;border-radius:12px;padding:2rem 2.25rem;border:1px solid rgba(107,58,42,0.12);text-align:right;">
      <p style="margin:0 0 0.35rem;font-size:0.72rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:rgba(69,40,41,0.45);">Rahma Media</p>
      <h1 style="margin:0 0 1.25rem;font-size:1.35rem;font-weight:700;color:#452829;">لقد استلمنا طلبك</h1>
      <p style="margin:0 0 0.9rem;font-size:0.975rem;color:rgba(69,40,41,0.85);line-height:1.9;">${greeting}</p>
      <p style="margin:0 0 0.9rem;font-size:0.975rem;color:rgba(69,40,41,0.75);line-height:1.9;">شكراً لتواصلك مع رحمة ميديا.</p>
      <p style="margin:0 0 0.9rem;font-size:0.975rem;color:rgba(69,40,41,0.75);line-height:1.9;">لقد استلمنا طلبك وسيقوم فريقنا بمراجعته قريباً.</p>
      <p style="margin:0 0 1.5rem;font-size:0.975rem;color:rgba(69,40,41,0.75);line-height:1.9;">نقوم عادةً بالرد خلال 24 ساعة، ونتطلع لمعرفة المزيد عن مشروعك ومساعدتك في بنائه.</p>
      <hr style="border:none;border-top:1px solid rgba(107,58,42,0.1);margin:0 0 1rem;"/>
      <p style="margin:0;font-size:0.8rem;color:rgba(69,40,41,0.4);"><strong style="color:#452829;">رحمة ميديا</strong></p>
    </div>
  </div>
</body></html>`;
}

function esc(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
