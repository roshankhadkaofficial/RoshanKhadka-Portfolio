export default {
  async fetch(request, env) {
    if (request.method === "POST") {
      const formData = await request.formData();
      const token = formData.get("cf-turnstile-response");

      // 1. Verify Turnstile
      const verify = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        body: new URLSearchParams({
          secret: env.TURNSTILE_SECRET_KEY,
          response: token
        })
      });

      const result = await verify.json();
      if (!result.success) {
        const captchaHtml = `
          <!DOCTYPE html>
          <html>
          <head>
          <title>Captcha Failed</title>
          </head>
          <body style="font-family:sans-serif;
          text-align:center;
          padding:50px;
          background:#ffecec;">
            <h1 style="color:#d9534f;">❌ Captcha Failed</h1>
            <p>Please try again.</p>
            <a href="https://khadkapurna.com.np">Back to Home</a>
          </body></html>`;
        return new Response(captchaHtml, { status: 400, headers: { "Content-Type": "text/html" } });
      }

      // 2. Extract form fields
      const name = formData.get("name");
      const email = formData.get("email");
      const message = formData.get("message");

      // 3. Send email via SendGrid API
      const send = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.SENDGRID_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: "roshankhadkaofficial@gmail.com" }] }],
          from: { email: "contact@khadkapurna.com.np" }, // verified sender
          reply_to: { email: "roshankhadkaofficial@gmail.com" },
          subject: "New Contact Form Submission",
          content: [
            { type: "text/plain", value: `Name: ${name}\nEmail: ${email}\nMessage: ${message}` },
            { type: "text/html", value: `<p><strong>Name:</strong> ${name}<br><strong>Email:</strong> ${email}<br><strong>Message:</strong><br>${message}</p>` }
          ]
        })
      });

      if (send.ok) {
        const successHtml = `
          <!DOCTYPE html>
          <html><head><title>Thank You</title></head>
          <body style="font-family:sans-serif;
          text-align:center;padding:50px;
          background:#e6f7ff;">
            <h1 style="color:#2c7be5;">✅ Thank You!</h1>
            <p>Your message has been sent successfully.<br>I’ll get back to you soon.</p>
            <a href="https://khadkapurna.com.np">Back to Home</a>
          </body></html>`;
        return new Response(successHtml, { status: 200, headers: { "Content-Type": "text/html; charset=UTF-8"} });
      } else {
        const errorText = await send.text();
        const errorHtml = `
          <!DOCTYPE html>
          <html><head><title>Error</title></head>
          <body style="font-family:sans-serif;text-align:center;padding:50px;background:#ffecec;">
            <h1 style="color:#d9534f;">❌ Error Sending Email</h1>
            <p>${errorText}</p>
            <a href="https://khadkapurna.com.np">Back to Home</a>
          </body></html>`;
        return new Response(errorHtml, { status: 500, headers: { "Content-Type": "text/html; charset=UTF-8" } });
      }
    }

    return new Response("Method not allowed", { status: 405 });
  }
};