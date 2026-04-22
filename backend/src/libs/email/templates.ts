export const getOtpTemplate = (otpCode: string) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { width: 80%; margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; }
    .header { background: #f4f4f4; padding: 10px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { padding: 20px; text-align: center; }
    .otp { font-size: 24px; font-weight: bold; color: #e67e22; letter-spacing: 5px; margin: 20px 0; }
    .footer { font-size: 12px; color: #777; text-align: center; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Vérification Afrigari</h2>
    </div>
    <div class="content">
      <p>Bonjour,</p>
      <p>Voici votre code de vérification OTP pour accéder à votre portail administrateur :</p>
      <div class="otp">${otpCode}</div>
      <p>Ce code est valable pour les 15 prochaines minutes. Ne le partagez avec personne.</p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Afrigari. Tous droits réservés.</p>
    </div>
  </div>
</body>
</html>
`;

export const getOrderConfirmationTemplate = (orderId: string, totalAmount?: number, items?: any[]) => {
  const itemsHtml = items && items.length > 0 
    ? `
      <div style="margin-top: 20px; border-top: 1px solid #eee; padding-top: 10px;">
        <h3>Détails de la commande :</h3>
        <table style="width: 100%; text-align: left;">
          <thead>
            <tr>
              <th>Produit</th>
              <th>Quantité</th>
              <th>Prix</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(item => `
              <tr>
                <td>${item.productName || 'Produit'}</td>
                <td>${item.quantity}</td>
                <td>${item.price} €</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div style="margin-top: 10px; text-align: right; font-weight: bold;">
          Total : ${totalAmount} €
        </div>
      </div>
    `
    : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f9f9f9; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .header { border-bottom: 2px solid #27ae60; padding-bottom: 20px; text-align: center; }
    .header h2 { color: #27ae60; margin: 0; }
    .content { padding: 20px 0; }
    .order-id { font-weight: bold; color: #27ae60; }
    .footer { font-size: 12px; color: #777; text-align: center; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px; }
    table { width: 100%; border-collapse: collapse; }
    th { padding: 10px; border-bottom: 1px solid #eee; }
    td { padding: 10px; border-bottom: 1px solid #eee; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Merci pour votre commande !</h2>
    </div>
    <div class="content">
      <p>Bonjour,</p>
      <p>Nous avons bien reçu votre commande <span class="order-id">#${orderId}</span>.</p>
      <p>Elle est en cours de traitement et nous vous informerons dès qu'elle sera prête à être expédiée.</p>
      ${itemsHtml}
    </div>
    <div class="footer">
      <p>Vous avez des questions ? Contactez notre support.</p>
      <p>&copy; ${new Date().getFullYear()} Afrigari. Tous droits réservés.</p>
    </div>
  </div>
</body>
</html>
`;
};
