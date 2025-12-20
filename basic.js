  const SECRET_KEY = '0x4AAAAAACHkuwUxaQ4WUnhW7C_zsXi_Yhs';

async function validateTurnstile(token, remoteip) {
const formData = new FormData();
formData.append('secret', SECRET_KEY);
formData.append('response', token);
formData.append('remoteip', remoteip);

      try {
          const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
              method: 'POST',
              body: formData
          });

          const result = await response.json();
          return result;
      } catch (error) {
          console.error('Turnstile validation error:', error);
          return { success: false, 'error-codes': ['internal-error'] };
      }

}

// Usage in form handler
async function handleFormSubmission(request) {
const body = await request.formData();
const token = body.get('cf-turnstile-response');
const ip = request.headers.get('CF-Connecting-IP') ||
request.headers.get('X-Forwarded-For') ||
'unknown';

      const validation = await validateTurnstile(token, ip);

      if (validation.success) {
          // Token is valid - process the form
          console.log('Valid submission from:', validation.hostname);
          return processForm(body);
      } else {
          // Token is invalid - reject the submission
          console.log('Invalid token:', validation['error-codes']);
          return new Response('Invalid verification', { status: 400 });
      }

}