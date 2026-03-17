const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const { protect, authorize } = require('../middleware/auth');
const PDFDocument = require('pdfkit');
const { stringify } = require('csv-stringify/sync');

router.get('/sales/pdf', protect, authorize('admin', 'vendedor'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Se requiere fecha de inicio y fin' });
    }

    const sales = await Sale.getSalesByDateRange(startDate, endDate);

    const doc = new PDFDocument({ margin: 50 });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=ventas_${startDate}_${endDate}.pdf`);

    doc.pipe(res);

    doc.fontSize(20).text('StockFlow - Reporte de Ventas', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Período: ${startDate} al ${endDate}`, { align: 'center' });
    doc.moveDown();

    let totalRevenue = 0;
    let totalItems = 0;

    sales.forEach((sale, index) => {
      doc.fontSize(10).text(`Venta #${index + 1} - ${new Date(sale.createdAt).toLocaleString()}`, { bold: true });
      doc.text(`Cliente: ${sale.customer.name}`);
      doc.text(`Vendedor: ${sale.sellerName}`);
      
      sale.items.forEach(item => {
        doc.text(`  - ${item.productName} x${item.quantity} = $${item.subtotal.toFixed(2)}`);
        totalItems += item.quantity;
      });
      
      doc.text(`Total: $${sale.total.toFixed(2)}`, { bold: true });
      doc.moveDown();
      totalRevenue += sale.total;
    });

    doc.moveDown();
    doc.fontSize(14).text('Resumen', { bold: true });
    doc.fontSize(12).text(`Total de ventas: ${sales.length}`);
    doc.text(`Total de productos vendidos: ${totalItems}`);
    doc.text(`Ingresos totales: $${totalRevenue.toFixed(2)}`);

    doc.moveDown();
    doc.fontSize(8).text(`Reportes generado el ${new Date().toLocaleString()}`, { align: 'center' });

    doc.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al generar PDF' });
  }
});

router.get('/products/csv', protect, authorize('admin'), async (req, res) => {
  try {
    const products = await Product.find({ active: true }).sort({ name: 1 });

    const data = products.map(p => ({
      Nombre: p.name,
      Descripción: p.description || '',
      Categoría: p.category,
      Precio: p.price,
      Costo: p.cost,
      Stock: p.stock,
      'Stock Mínimo': p.minStock,
      'Código de Barras': p.barcode || '',
      '¿Stock Bajo?': p.stock < p.minStock ? 'SÍ' : 'NO'
    }));

    const csv = stringify(data, { header: true });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=inventario.csv');
    res.send(csv);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al generar CSV' });
  }
});

router.get('/sales/csv', protect, authorize('admin', 'vendedor'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Se requiere fecha de inicio y fin' });
    }

    const sales = await Sale.getSalesByDateRange(startDate, endDate);

    const data = [];
    
    sales.forEach(sale => {
      sale.items.forEach(item => {
        data.push({
          Fecha: new Date(sale.createdAt).toLocaleString(),
          'N° Venta': sale._id.toString(),
          Cliente: sale.customer.name,
          Producto: item.productName,
          Cantidad: item.quantity,
          'Precio Unitario': item.unitPrice,
          Subtotal: item.subtotal,
          'Método de Pago': sale.paymentMethod,
          Vendedor: sale.sellerName,
          Estado: sale.status
        });
      });
    });

    const csv = stringify(data, { header: true });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=ventas_${startDate}_${endDate}.csv`);
    res.send(csv);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al generar CSV' });
  }
});

router.get('/summary', protect, authorize('admin'), async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    let startDate = new Date();
    switch (period) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }

    const [salesSummary, topProducts, lowStockProducts, categoryStats] = await Promise.all([
      Sale.aggregate([
        { $match: { createdAt: { $gte: startDate }, status: 'completada' } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$total' },
            totalSales: { $sum: 1 },
            totalItems: { $sum: { $size: '$items' } }
          }
        }
      ]),
      Sale.aggregate([
        { $match: { createdAt: { $gte: startDate }, status: 'completada' } },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.product',
            name: { $first: '$items.productName' },
            totalSold: { $sum: '$items.quantity' },
            totalRevenue: { $sum: '$items.subtotal' }
          }
        },
        { $sort: { totalSold: -1 } },
        { $limit: 10 }
      ]),
      Product.find({
        $expr: { $lt: ['$stock', '$minStock'] },
        active: true
      }).sort({ stock: 1 }),
      Sale.aggregate([
        { $match: { createdAt: { $gte: startDate }, status: 'completada' } },
        { $unwind: '$items' },
        {
          $lookup: {
            from: 'products',
            localField: 'items.product',
            foreignField: '_id',
            as: 'productInfo'
          }
        },
        { $unwind: '$productInfo' },
        {
          $group: {
            _id: '$productInfo.category',
            totalSold: { $sum: '$items.quantity' },
            totalRevenue: { $sum: '$items.subtotal' }
          }
        },
        { $sort: { totalRevenue: -1 } }
      ])
    ]);

    res.json({
      summary: salesSummary[0] || { totalRevenue: 0, totalSales: 0, totalItems: 0 },
      topProducts,
      lowStockProducts,
      categoryStats
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener resumen' });
  }
});

module.exports = router;
