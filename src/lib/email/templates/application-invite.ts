interface ApplicationInviteEmailProps {
  recipientName?: string;
  coachName: string;
  customMessage?: string;
  applicationUrl: string;
}

export function generateApplicationInviteEmail({
  recipientName,
  coachName,
  customMessage,
  applicationUrl,
}: ApplicationInviteEmailProps): { html: string; text: string; subject: string } {
  const greeting = recipientName ? `Hi ${recipientName},` : "Hi there,";

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Start Your Fitness Journey</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: #9a7b4f; padding: 30px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                Strenx Fitness
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #1a1a1a; font-size: 16px; line-height: 1.6;">
                ${greeting}
              </p>

              <p style="margin: 0 0 20px; color: #1a1a1a; font-size: 16px; line-height: 1.6;">
                ${coachName} has invited you to start your personalized fitness journey with Strenx Fitness.
              </p>

              ${customMessage ? `
              <div style="margin: 20px 0; padding: 20px; background-color: #f8f5f0; border-left: 4px solid #9a7b4f; border-radius: 4px;">
                <p style="margin: 0; color: #4a4a4a; font-size: 15px; line-height: 1.6; font-style: italic;">
                  "${customMessage}"
                </p>
                <p style="margin: 10px 0 0; color: #9a7b4f; font-size: 14px; font-weight: 600;">
                  - ${coachName}
                </p>
              </div>
              ` : ""}

              <p style="margin: 20px 0; color: #1a1a1a; font-size: 16px; line-height: 1.6;">
                To get started, please complete your application form. This will help us understand your goals and create a customized program just for you.
              </p>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${applicationUrl}" style="display: inline-block; background-color: #9a7b4f; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 2px 4px rgba(154, 123, 79, 0.3);">
                  Start Your Application
                </a>
              </div>

              <!-- Info Box -->
              <div style="margin: 30px 0; padding: 16px 20px; background-color: #e8f4ea; border-radius: 8px;">
                <p style="margin: 0; color: #2d6a4f; font-size: 14px; line-height: 1.5;">
                  <strong>Note:</strong> You can save your progress and continue later. Your application will be saved automatically as you complete each section.
                </p>
              </div>

              <p style="margin: 20px 0 0; color: #666666; font-size: 14px; line-height: 1.6;">
                If the button above doesn't work, copy and paste this link into your browser:
              </p>
              <p style="margin: 8px 0 0; word-break: break-all;">
                <a href="${applicationUrl}" style="color: #9a7b4f; font-size: 14px;">${applicationUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f5f0; padding: 24px 40px; border-top: 1px solid #e8e0d5;">
              <p style="margin: 0 0 8px; color: #666666; font-size: 14px; text-align: center;">
                Questions? Reply to this email or contact us at support@strenx.com
              </p>
              <p style="margin: 0; color: #999999; font-size: 12px; text-align: center;">
                &copy; ${new Date().getFullYear()} Strenx Fitness. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
${greeting}

${coachName} has invited you to start your personalized fitness journey with Strenx Fitness.

${customMessage ? `Message from ${coachName}:\n"${customMessage}"\n` : ""}

To get started, please complete your application form. This will help us understand your goals and create a customized program just for you.

Start your application here: ${applicationUrl}

Note: You can save your progress and continue later. Your application will be saved automatically as you complete each section.

---
Questions? Contact us at support@strenx.com
(c) ${new Date().getFullYear()} Strenx Fitness. All rights reserved.
  `.trim();

  const subject = `${coachName} has invited you to start your fitness journey`;

  return { html, text, subject };
}
