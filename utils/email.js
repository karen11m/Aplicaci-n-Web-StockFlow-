const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const sendLowStockAlert = async (products) => {
  if (!process.env.ADMIN_EMAIL) {
    console.log('Admin email not configured, skipping notification');
    return;
  }

  const productList = products.map(p => 
    `- ${p.name}: ${p.stock} unidades (mínimo: ${p.minStock})`
  ).join('\n');

  const mailOptions = {
    from: process.env.SMTP_USER,
    to: process.env.ADMIN_EMAIL,
    subject: '⚠️ Alerta: Productos con Stock Bajo',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Alerta de Stock Bajo</h2>
        <p>Los siguientes productos tienen stock inferior al mínimo:</p>
        <div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <pre style="white-space: pre-wrap; font-family: Arial, sans-serif;">${productList}</pre>
        </div>
        <p style="color: #6b7280; font-size: 14px;">
          Por favor, reponga el inventario a la brevedad.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #9ca3af; font-size: 12px;">StockFlow - Sistema de Gestión de Inventario</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Low stock alert email sent');
  } catch (error) {
    console.error('Error sending email:', error.message);
  }
};

const sendWelcomeEmail = async (user) => {
  if (!process.env.ADMIN_EMAIL) return;

  const mailOptions = {
    from: process.env.SMTP_USER,
    to: user.email,
    subject: 'Bienvenido a StockFlow',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">¡Bienvenido a StockFlow!</h2>
        <p>Hola <strong>${user.name}</strong>,</p>
        <p>Tu cuenta ha sido creada exitosamente.</p>
        <ul>
          <li><strong>Email:</strong> ${user.email}</li>
          <li><strong>Rol:</strong> ${user.role}</li>
        </ul>
        <p>Ahora puedes acceder al sistema y comenzar a gestionar tu inventario.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #9ca3af; font-size: 12px;">StockFlow - Sistema de Gestión de Inventario</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending welcome email:', error.message);
  }
};

module.exports = { sendLowStockAlert, sendWelcomeEmail };
