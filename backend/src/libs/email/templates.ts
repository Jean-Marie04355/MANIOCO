export const getOtpTemplate = (otpCode: string) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { margin: 0; padding: 0; background-color: #f4f4f4; }
        .container {
            font-family: 'Outfit', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 600px;
            margin: 20px auto;
            padding: 40px;
            border-radius: 16px;
            background: linear-gradient(145deg, #ffffff, #f0f0f0);
            box-shadow: 20px 20px 60px #d9d9d9, -20px -20px 60px #ffffff;
        }
        .header {
            text-align: center;
            padding-bottom: 30px;
            border-bottom: 1px solid rgba(26, 46, 34, 0.1);
        }
        .logo {
            font-size: 28px;
            font-weight: 800;
            color: #1a2e22;
            letter-spacing: 2px;
            text-transform: uppercase;
        }
        .content {
            padding: 40px 0;
            text-align: center;
        }
        .title {
            font-size: 24px;
            color: #1a2e22;
            margin-bottom: 10px;
            font-weight: 700;
        }
        .otp-container {
            margin: 30px 0;
        }
        .otp-code {
            font-size: 42px;
            font-weight: 900;
            letter-spacing: 8px;
            color: #c5a059;
            padding: 20px 40px;
            background: #1a2e22;
            display: inline-block;
            border-radius: 12px;
            box-shadow: 0 10px 20px rgba(26, 46, 34, 0.2);
        }
        .info-text {
            color: #666;
            line-height: 1.6;
            font-size: 16px;
        }
        .footer {
            text-align: center;
            font-size: 13px;
            color: #999;
            padding-top: 30px;
            border-top: 1px solid rgba(26, 46, 34, 0.1);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">AFRIGARI</div>
        </div>
        <div class="content">
            <div class="title">Vérification de sécurité</div>
            <p class="info-text">Utilisez le code suivant pour sécuriser votre connexion :</p>
            <div class="otp-container">
                <div class="otp-code">${otpCode}</div>
            </div>
            <p class="info-text">Ce code est personnel et expirera dans 15 minutes.</p>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Afrigari. Excellence & Tradition.</p>
        </div>
    </div>
</body>
</html>
`;

export const getOrderConfirmationTemplate = (
  orderId: string,
  totalAmount?: number,
  items?: any[],
) => {
  const itemsHtml =
    items && items.length > 0
      ? `
      <div style="margin-top: 30px; background: #f9f9f9; padding: 20px; border-radius: 12px;">
        <h3 style="color: #1a2e22; margin-top: 0;">Détails de la commande</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 2px solid #1a2e22;">
              <th style="padding: 10px; text-align: left;">Produit</th>
              <th style="padding: 10px; text-align: center;">Qté</th>
              <th style="padding: 10px; text-align: right;">Prix</th>
            </tr>
          </thead>
          <tbody>
            ${items
              .map(
                (item) => `
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 12px 10px;">${item.productName || 'Produit'}</td>
                <td style="padding: 12px 10px; text-align: center;">${item.quantity}</td>
                <td style="padding: 12px 10px; text-align: right;">${item.price} CFA</td>
              </tr>
            `,
              )
              .join('')}
          </tbody>
        </table>
        <div style="margin-top: 20px; text-align: right; font-size: 20px; font-weight: bold; color: #1a2e22;">
          Total: ${totalAmount} CFA
        </div>
      </div>
    `
      : '';

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Outfit', sans-serif; }
        .container { max-width: 600px; margin: 20px auto; background: #ffffff; padding: 40px; border-radius: 16px; }
        .header { text-align: center; border-bottom: 2px solid #c5a059; padding-bottom: 20px; }
        .logo { font-size: 28px; font-weight: 800; color: #1a2e22; }
        .status-badge { background: #27ae60; color: white; padding: 5px 15px; border-radius: 20px; font-size: 14px; display: inline-block; margin-top: 10px; }
        .footer { text-align: center; font-size: 12px; color: #999; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">AFRIGARI</div>
            <div class="status-badge">Commande Confirmée</div>
        </div>
        <div style="padding: 30px 0;">
            <h2 style="color: #1a2e22;">Merci pour votre confiance !</h2>
            <p>Nous préparons votre commande <strong>#${orderId}</strong> avec le plus grand soin.</p>
            ${itemsHtml}
            <p style="margin-top: 30px;">Nous vous enverrons un nouvel e-mail dès que vos produits seront en route.</p>
        </div>
        <div class="footer">
            <p>Des questions ? Notre service client est à votre écoute.</p>
            <p>&copy; ${new Date().getFullYear()} Afrigari. Tous droits réservés.</p>
        </div>
    </div>
</body>
</html>
`;
};

export const getResetPasswordTemplate = (resetLink: string) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Outfit', sans-serif; }
        .container { max-width: 600px; margin: 20px auto; background: #ffffff; padding: 40px; border-radius: 16px; text-align: center; }
        .btn { background: #1a2e22; color: #ffffff !important; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; display: inline-block; margin: 30px 0; box-shadow: 0 10px 20px rgba(26,46,34,0.2); }
        .logo { font-size: 28px; font-weight: 800; color: #1a2e22; margin-bottom: 30px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">AFRIGARI</div>
        <h2 style="color: #1a2e22;">Réinitialisation de mot de passe</h2>
        <p>Vous avez demandé à changer votre mot de passe. Pas d'inquiétude, cliquez simplement sur le bouton ci-dessous :</p>
        <a href="${resetLink}" class="btn">Changer mon mot de passe</a>
        <p style="color: #666; font-size: 14px;">Ce lien est valable pendant 60 minutes.</p>
        <p style="color: #999; font-size: 12px; margin-top: 40px;">Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail en toute sécurité.</p>
    </div>
</body>
</html>
`;
