const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
  try {
    const { startDate, endDate, product, seller, page = 1, limit = 20 } = req.query;
    
    let query = {};

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    if (product) {
      query['items.product'] = product;
    }

    if (seller) {
      query.seller = seller;
    }

    query.status = { $ne: 'cancelada' };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [sales, total] = await Promise.all([
      Sale.find(query)
        .populate('seller', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Sale.countDocuments(query)
    ]);

    res.json({
      sales,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener ventas' });
  }
});

router.get('/stats', protect, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [
      todaySales,
      todayRevenue,
      weekSales,
      weekRevenue,
      totalSales
    ] = await Promise.all([
      Sale.countDocuments({
        createdAt: { $gte: today, $lt: tomorrow },
        status: 'completada'
      }),
      Sale.aggregate([
        {
          $match: {
            createdAt: { $gte: today, $lt: tomorrow },
            status: 'completada'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$total' }
          }
        }
      ]),
      Sale.countDocuments({
        createdAt: { $gte: weekAgo },
        status: 'completada'
      }),
      Sale.aggregate([
        {
          $match: {
            createdAt: { $gte: weekAgo },
            status: 'completada'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$total' }
          }
        }
      ]),
      Sale.countDocuments({ status: 'completada' })
    ]);

    const dailySales = await Sale.aggregate([
      {
        $match: {
          createdAt: { $gte: weekAgo },
          status: 'completada'
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          revenue: { $sum: '$total' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      todaySales,
      todayRevenue: todayRevenue[0]?.total || 0,
      weekSales,
      weekRevenue: weekRevenue[0]?.total || 0,
      totalSales,
      dailySales
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener estadísticas' });
  }
});

router.get('/recent', protect, async (req, res) => {
  try {
    const sales = await Sale.find({ status: 'completada' })
      .populate('seller', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json(sales);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener ventas recientes' });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate('seller', 'name email');

    if (!sale) {
      return res.status(404).json({ message: 'Venta no encontrada' });
    }

    res.json(sale);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener venta' });
  }
});

router.post('/', protect, async (req, res) => {
  const session = await Product.startSession();
  session.startTransaction();

  try {
    const { items, customer, paymentMethod, discount, notes } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'La venta debe tener al menos un producto' });
    }

    const saleItems = [];
    let subtotal = 0;

    for (const item of items) {
      const product = await Product.findById(item.productId).session(session);
      
      if (!product) {
        await session.abortTransaction();
        return res.status(404).json({ message: `Producto no encontrado: ${item.productId}` });
      }

      if (product.stock < item.quantity) {
        await session.abortTransaction();
        return res.status(400).json({ 
          message: `Stock insuficiente para ${product.name}. Stock actual: ${product.stock}` 
        });
      }

      const itemSubtotal = product.price * item.quantity;
      subtotal += itemSubtotal;

      saleItems.push({
        product: product._id,
        productName: product.name,
        productBarcode: product.barcode,
        quantity: item.quantity,
        unitPrice: product.price,
        subtotal: itemSubtotal
      });

      product.stock -= item.quantity;
      await product.save({ session });
    }

    const tax = 0;
    const total = subtotal - (discount || 0);

    const sale = await Sale.create([{
      items: saleItems,
      customer: customer || { name: 'Cliente Mostrador' },
      subtotal,
      tax,
      discount: discount || 0,
      total,
      paymentMethod: paymentMethod || 'efectivo',
      seller: req.user._id,
      sellerName: req.user.name,
      notes
    }], { session });

    await session.commitTransaction();

    const populatedSale = await Sale.findById(sale[0]._id)
      .populate('seller', 'name');

    const io = req.app.get('io');
    if (io) {
      io.emit('newSale', populatedSale);
      io.emit('stockUpdated');
    }

    res.status(201).json(populatedSale);
  } catch (error) {
    await session.abortTransaction();
    console.error(error);
    res.status(500).json({ message: 'Error al crear venta' });
  } finally {
    session.endSession();
  }
});

router.put('/:id/cancel', protect, authorize('admin', 'vendedor'), async (req, res) => {
  const session = await Product.startSession();
  session.startTransaction();

  try {
    const sale = await Sale.findById(req.params.id).session(session);

    if (!sale) {
      return res.status(404).json({ message: 'Venta no encontrada' });
    }

    if (sale.status === 'cancelada') {
      return res.status(400).json({ message: 'La venta ya está cancelada' });
    }

    for (const item of sale.items) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stock: item.quantity } },
        { session }
      );
    }

    sale.status = 'cancelada';
    await sale.save({ session });

    await session.commitTransaction();

    const io = req.app.get('io');
    if (io) {
      io.emit('saleCancelled', sale);
      io.emit('stockUpdated');
    }

    res.json({ message: 'Venta cancelada', sale });
  } catch (error) {
    await session.abortTransaction();
    console.error(error);
    res.status(500).json({ message: 'Error al cancelar venta' });
  } finally {
    session.endSession();
  }
});

module.exports = router;
