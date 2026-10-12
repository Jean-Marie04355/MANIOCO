export const getOtpTemplate = (otpCode: string) => {
  const digits = otpCode.split('');
  const digitsHtml = digits
    .map(
      (char) => `
    <td style="background-color: #FAF6F5; border: 2px solid #EAD8D4; border-radius: 16px; width: 52px; height: 64px; text-align: center; font-size: 32px; font-weight: 900; color: #9E4E3B; font-family: 'Outfit', 'Segoe UI', sans-serif; padding: 0; box-shadow: 0 4px 10px rgba(92, 45, 22, 0.04);">${char}</td>
  `,
    )
    .join('<td style="width: 8px;"></td>');

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vérification Manioco</title>
    <style>
        body { margin: 0; padding: 0; background-color: #fcfbf7; font-family: 'Outfit', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; -webkit-font-smoothing: antialiased; }
        .wrapper { width: 100%; table-layout: fixed; background-color: #fcfbf7; padding: 40px 0; }
        .container { max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 32px; border: 1px solid rgba(92, 69, 19, 0.08); box-shadow: 0 20px 50px rgba(92, 69, 19, 0.04); text-align: center; }
        .content { padding: 50px; }
        .logo { font-size: 32px; font-weight: 900; color: #5c2d16; letter-spacing: -1px; margin-bottom: 5px; }
        .logo-dot { color: #F4A261; }
        .subtitle { font-size: 10px; font-weight: 900; color: #c5a059; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 40px; }
        .title { font-size: 26px; font-weight: 900; color: #5c2d16; text-transform: uppercase; font-style: italic; letter-spacing: -0.5px; margin-bottom: 20px; }
        .body-text { font-size: 14px; color: #5c2d16; opacity: 0.8; line-height: 1.6; margin-bottom: 30px; }
        .otp-container { margin: 30px 0; }
        .footer { font-size: 11px; color: #5c2d16; opacity: 0.4; margin-top: 40px; border-top: 1px solid rgba(92, 69, 19, 0.08); padding-top: 30px; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <div class="content">
                <div class="logo">Mani<span class="logo-dot">o</span>c<span class="logo-dot">o</span></div>
                <div class="subtitle">Excellence & Tradition</div>
                
                <div class="title">Vérification</div>
                <p class="body-text">
                    Pour finaliser votre connexion sécurisée au portail d'administration Manioco, veuillez saisir le code de vérification à 6 chiffres suivant :
                </p>
                
                <div class="otp-container">
                    <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin: 30px auto;">
                        <tr>
                            ${digitsHtml}
                        </tr>
                    </table>
                </div>
                
                <p class="body-text" style="font-size: 13px; margin-top: 20px;">
                    Ce code de sécurité à usage unique expire dans 15 minutes. Ne le partagez jamais.
                </p>
                
                <div class="footer">
                    <p>&copy; ${new Date().getFullYear()} Manioco. Tous droits réservés.</p>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
`;
};

export const getOrderConfirmationTemplate = (
  orderId: string,
  totalAmount?: number,
  items?: any[],
) => {
  const itemsHtml =
    items && items.length > 0
      ? `
      <div style="margin-top: 30px; background: #fcfbf7; padding: 25px; border-radius: 20px; border: 1px dashed rgba(92, 69, 19, 0.15); text-align: left;">
        <h3 style="color: #5c2d16; margin-top: 0; font-size: 16px; font-weight: 900; text-transform: uppercase;">Détails de la commande</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 2px solid #5c2d16;">
              <th style="padding: 10px 5px; text-align: left; font-size: 12px; color: #5c2d16; text-transform: uppercase;">Produit</th>
              <th style="padding: 10px 5px; text-align: center; font-size: 12px; color: #5c2d16; text-transform: uppercase;">Qté</th>
              <th style="padding: 10px 5px; text-align: right; font-size: 12px; color: #5c2d16; text-transform: uppercase;">Prix</th>
            </tr>
          </thead>
          <tbody>
            ${items
              .map(
                (item) => `
              <tr style="border-bottom: 1px solid rgba(92, 69, 19, 0.08);">
                <td style="padding: 12px 5px; font-size: 13px; color: #5c2d16;">${item.productName || 'Produit'}</td>
                <td style="padding: 12px 5px; text-align: center; font-size: 13px; color: #5c2d16;">${item.quantity}</td>
                <td style="padding: 12px 5px; text-align: right; font-size: 13px; font-weight: bold; color: #5c2d16;">${item.price} CFA</td>
              </tr>
            `,
              )
              .join('')}
          </tbody>
        </table>
        <div style="margin-top: 20px; text-align: right; font-size: 18px; font-weight: 900; color: #c8602a;">
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
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirmation de commande Manioco</title>
    <style>
        body { margin: 0; padding: 0; background-color: #fcfbf7; font-family: 'Outfit', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; -webkit-font-smoothing: antialiased; }
        .wrapper { width: 100%; table-layout: fixed; background-color: #fcfbf7; padding: 40px 0; }
        .container { max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 32px; border: 1px solid rgba(92, 69, 19, 0.08); box-shadow: 0 20px 50px rgba(92, 69, 19, 0.04); text-align: center; }
        .content { padding: 50px; }
        .logo { font-size: 32px; font-weight: 900; color: #5c2d16; letter-spacing: -1px; margin-bottom: 5px; }
        .logo-dot { color: #F4A261; }
        .subtitle { font-size: 10px; font-weight: 900; color: #c5a059; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 40px; }
        .badge { background-color: #27ae60; color: white; padding: 6px 18px; border-radius: 20px; font-size: 11px; font-weight: 900; text-transform: uppercase; display: inline-block; letter-spacing: 1px; margin-bottom: 30px; }
        .title { font-size: 26px; font-weight: 900; color: #5c2d16; text-transform: uppercase; font-style: italic; letter-spacing: -0.5px; margin-bottom: 20px; }
        .body-text { font-size: 14px; color: #5c2d16; opacity: 0.8; line-height: 1.6; margin-bottom: 30px; }
        .footer { font-size: 11px; color: #5c2d16; opacity: 0.4; margin-top: 40px; border-top: 1px solid rgba(92, 69, 19, 0.08); padding-top: 30px; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <div class="content">
                <div class="logo">Mani<span class="logo-dot">o</span>c<span class="logo-dot">o</span></div>
                <div class="subtitle">Excellence & Tradition</div>
                
                <div class="badge">Commande Confirmée</div>
                
                <div class="title">Merci de votre confiance !</div>
                <p class="body-text">
                    Nous préparons votre commande <strong>#${orderId}</strong> avec le plus grand soin.
                </p>
                
                ${itemsHtml}
                
                <p class="body-text" style="margin-top: 30px; font-size: 13px;">
                    Nous vous enverrons un nouvel e-mail dès que vos produits seront en route.
                </p>
                
                <div class="footer">
                    <p>Des questions ? Notre service client est à votre écoute.</p>
                    <p>&copy; ${new Date().getFullYear()} Manioco. Tous droits réservés.</p>
                </div>
            </div>
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
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Réinitialisation Manioco</title>
    <style>
        body { margin: 0; padding: 0; background-color: #fcfbf7; font-family: 'Outfit', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; -webkit-font-smoothing: antialiased; }
        .wrapper { width: 100%; table-layout: fixed; background-color: #fcfbf7; padding: 40px 0; }
        .container { max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 32px; border: 1px solid rgba(92, 69, 19, 0.08); box-shadow: 0 20px 50px rgba(92, 69, 19, 0.04); text-align: center; }
        .content { padding: 50px; }
        .logo { font-size: 32px; font-weight: 900; color: #5c2d16; letter-spacing: -1px; margin-bottom: 5px; }
        .logo-dot { color: #F4A261; }
        .subtitle { font-size: 10px; font-weight: 900; color: #c5a059; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 40px; }
        .title { font-size: 26px; font-weight: 900; color: #5c2d16; text-transform: uppercase; font-style: italic; letter-spacing: -0.5px; margin-bottom: 20px; }
        .body-text { font-size: 14px; color: #5c2d16; opacity: 0.8; line-height: 1.6; margin-bottom: 30px; }
        .btn-container { margin: 30px 0; }
        .btn { background-color: #c8602a; color: #ffffff !important; padding: 18px 36px; border-radius: 16px; text-decoration: none; font-weight: 900; display: inline-block; box-shadow: 0 10px 20px rgba(200, 96, 42, 0.2); font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }
        .fallback-container { background-color: #fcfbf7; border: 1px dashed rgba(92, 69, 19, 0.15); border-radius: 16px; padding: 20px; margin-top: 30px; text-align: left; }
        .fallback-title { font-size: 12px; font-weight: 900; color: #5c2d16; text-transform: uppercase; margin-bottom: 8px; }
        .fallback-link { color: #c8602a; word-break: break-all; font-size: 13px; text-decoration: underline; font-weight: bold; }
        .footer { font-size: 11px; color: #5c2d16; opacity: 0.4; margin-top: 40px; border-top: 1px solid rgba(92, 69, 19, 0.08); padding-top: 30px; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <div class="content">
                <div class="logo">Mani<span class="logo-dot">o</span>c<span class="logo-dot">o</span></div>
                <div class="subtitle">Excellence & Tradition</div>
                
                <div class="title">Récupération</div>
                <p class="body-text">
                    Vous avez demandé à réinitialiser le mot de passe de votre compte Manioco. Pour choisir un nouveau sésame, cliquez simplement sur le bouton ci-dessous :
                </p>
                
                <div class="btn-container">
                    <a href="${resetLink}" class="btn">Réinitialiser le mot de passe</a>
                </div>
                
                <div class="fallback-container">
                    <div class="fallback-title">Lien alternatif</div>
                    <p class="body-text" style="font-size: 13px; margin: 0 0 10px 0; opacity: 0.6;">
                        Si le bouton ci-dessus ne fonctionne pas, copiez et collez l'adresse suivante dans votre navigateur :
                    </p>
                    <a href="${resetLink}" class="fallback-link">${resetLink}</a>
                </div>
                
                <p class="body-text" style="font-size: 13px; margin-top: 30px;">
                    Ce lien de récupération est valable pendant 60 minutes. Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail en toute sécurité.
                </p>
                
                <div class="footer">
                    <p>&copy; ${new Date().getFullYear()} Manioco. Tous droits réservés.</p>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
`;
