import { ProcessEnv } from "../env";
import { log } from "../logs/logger";
import { transporter } from "./mailer";

const commonStyles = `<style>
  body {
      font-family: 'Inter', sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f4f4f4;
      color: #333333;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
  }
  .email-container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #ffffff;
      padding: 30px;
      border-radius: 12px;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
      border: 1px solid #e0e0e0;
  }
  .email-header {
      text-align: center;
      margin-bottom: 30px;
  }
  .email-header h1 {
      color: #1a202c;
      font-size: 28px;
      margin: 0;
  }
  .email-content p {
      font-size: 16px;
      line-height: 1.6;
      margin-bottom: 15px;
  }
  .button-container {
      text-align: center;
      margin: 30px 0;
  }
  .button {
      display: inline-block;
      padding: 14px 28px;
      font-size: 18px;
      font-weight: bold;
      color: #ffffff;
      background-color: #007bff;
      border-radius: 8px;
      text-decoration: none;
      transition: background-color 0.3s ease;
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 6px rgba(0, 123, 255, 0.2);
  }
  .button:hover {
      background-color: #0056b3;
  }
  .reset-link {
      word-break: break-all;
      font-size: 14px;
      color: #007bff;
      text-decoration: underline;
  }
  .email-footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #eeeeee;
      font-size: 14px;
      color: #777777;
  }
  @media only screen and (max-width: 600px) {
      .email-container {
          padding: 20px;
          margin: 10px;
          border-radius: 0;
      }
      .email-header h1 {
          font-size: 24px;
      }
      .email-content p {
          font-size: 15px;
      }
      .button {
          padding: 12px 24px;
          font-size: 16px;
      }
      .email-footer {
          font-size: 13px;
      }
  }
</style>`;

export function generatePasswordResetEmailTemplate(
  name: string,
  link: string,
  email: string
) {
  return `<!DOCTYPE html>
    <html lang="en">
    <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset hasła do aplikacji Moje Konie</title>
    ${commonStyles}
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <h1>Reset hasła do aplikacji Moje Konie</h1>
        </div>
        <div class="email-content">
            <p>Dzień dobry, ${name},</p>
            <p>przesyłamy link resetu hasła do aplikacji Moje Konie dla konta: ${email}.</p>
            <p>Aby zresetować hasło należy kliknąć w podany niżej przycisk lub otworzyć link znajdujący się obok. Link wygaśnie w ciągu 24h z powodów bezpieczeństwa.</p>
            <div class="button-container">
                <a href="${link}" class="button">Reset hasła</a>
            </div>
            <p><a href="${link}" class="reset-link">${link}</a></p>
            <p>Jeśli nie zgłaszałeś prośby resetu hasła zignoruj ten email. Hasło pozostanie bez zmian.</p>
            <p>Zalecamy wybór złożonego i unikalnego hasła, które nie jest wykorzystywane w innych usługach.</p>
        </div>
        <div class="email-footer">
            <p>Pozdrawiamy!</p>
        </div>
    </div>
</body>
</html>
    `;
}

export function generateAccountConfirmationEmailTemplate(
  name: string,
  link: string,
  email: string
) {
  return `<!DOCTYPE html>
    <html lang="en">
    <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Potwierdzenie konta</title>
    ${commonStyles}
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <h1>Potwierdzenie konta</h1>
        </div>
        <div class="email-content">
            <p>Dzień dobry, ${name},</p>
            <p>zostało założone konto do aplikacji Moje Konie.</p>
            <p>Aby ukończyć proces rejestracji w podany niżej przycisk lub otworzyć link znajdujący się obok.  Link wygaśnie w ciągu 24h z powodów bezpieczeństwa.</p>
            <div class="button-container">
                <a href="${link}" class="button">Confirm account ${email}</a>
            </div>
            <p><a href="${link}" class="reset-link">${link}</a></p>
        </div>
    </div>
</body>
</html>
    `;
}

export async function sendResetPasswordEmail(
  email: string,
  name: string,
  url: string
) {
  const mailOptions = {
    from: ProcessEnv.EMAIL_USER,
    to: email,
    subject: "🔑 Reset hasła do aplikacji Moje Konie",
    html: generatePasswordResetEmailTemplate(name, url, email),
  };

  try {
    await transporter.sendMail(mailOptions);
    log("Email", "info", "Sent password reset email to " + email);
  } catch (error) {
    log(
      "Email",
      "error",
      `Error ecountered when sending password reset email to ${email}:`,
      error as Error
    );
  }
}

export async function sendAccountConfirmationEmail(
  email: string,
  name: string,
  url: string
) {
  const mailOptions = {
    from: ProcessEnv.EMAIL_USER,
    to: email,
    subject: "👋 Rejestracja w aplikacji Moje Konie",
    html: generateAccountConfirmationEmailTemplate(name, url, email),
  };

  try {
    await transporter.sendMail(mailOptions);
    log("Email", "info", "Sent account confirmation email to " + email);
  } catch (error) {
    log(
      "Email",
      "error",
      `Error ecountered when sending account confirmation email to ${email}:`,
      error as Error
    );
  }
}
