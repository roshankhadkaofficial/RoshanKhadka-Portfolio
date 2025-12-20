export default {
  async fetch(request) {
    if (request.method === "POST") {
      const formData = await request.formData();
      const token = formData.get("cf-turnstile-response");

      // 1. Verify Turnstile
      const verify = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        body: new URLSearchParams({
          secret: "0x4AAAAAACHkuwUxaQ4WUnhW7C_zsXi_Yhs",   // from Cloudflare Turnstile dashboard
          response: token
        })
      });

      const result = await verify.json();
      if (!result.success) {
        return new Response("Captcha failed", { status: 400 });
      }

      // 2. Extract form fields
      const name = formData.get("name");
      const email = formData.get("email");
      const message = formData.get("message");

      // 3. Send email via SendGrid API
      const send = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          "Authorization": "Bearer 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", // from SendGrid dashboard
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          personalizations: [
            { to: [{ email: "roshankhadkaofficial@gmail.com" }] } // destination
          ],
          from: { email: "roshankhadkaofficial@gmail.com" },       // verified single sender
          subject: "New Contact Form Submission",
          content: [
            {
              type: "text/plain",
              value: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`
            }
          ]
        })
      });

      if (send.ok) {
        return new Response("Form submitted successfully!", { status: 200 });
      } else {
        return new Response("Error sending email", { status: 500 });
      }
    }

    return new Response("Method not allowed", { status: 405 });
  }
};