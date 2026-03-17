const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Sale = require('../models/Sale');
const { protect, authorize } = require('../middleware/auth');
const { sendLowStockAlert } = require('../utils/email');

router.get('/', protect, async (req, res) => {
  try {
    const { search, category, lowStock, page = 1, limit = 20 } = req.query;
    
    let query = { active: true };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { barcode: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) {
      query.category = category;
    }

    if (lowStock === 'true') {
      query.$expr = { $lt: ['$stock', '$minStock'] };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [products, total] = await Promise.all([
      Product.find(query)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Product.countDocuments(query)
    ]);

    res.json({
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener productos' });
  }
});

router.get('/low-stock', protect, async (req, res) => {
  try {
    const products = await Product.find({
      $expr: { $lt: ['$stock', '$minStock'] },
      active: true
    }).sort({ stock: 1 });

    if (products.length > 0) {
      sendLowStockAlert(products);
    }

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error al verificar stock bajo' });
  }
});

router.get('/categories', protect, async (req, res) => {
  try {
    const categories = await Product.distinct('category', { active: true });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener categorías' });
  }
});

router.get('/barcode/:barcode', protect, async (req, res) => {
  try {
    const product = await Product.findOne({ 
      barcode: req.params.barcode,
      active: true 
    });

    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Error al buscar producto' });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener producto' });
  }
});

router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, description, price, cost, stock, minStock, barcode, image, category } = req.body;

    const existingProduct = await Product.findOne({ barcode });
    if (barcode && existingProduct) {
      return res.status(400).json({ message: 'El código de barras ya está en uso' });
    }

    const product = await Product.create({
      name,
      description,
      price,
      cost: cost || 0,
      stock: stock || 0,
      minStock: minStock || 10,
      barcode,
      image: image || '/placeholder.png',
      category: category || 'General'
    });

    res.status(201).json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al crear producto' });
  }
});

router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, description, price, cost, stock, minStock, barcode, image, category, active } = req.body;

    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    if (barcode && barcode !== product.barcode) {
      const existingProduct = await Product.findOne({ barcode });
      if (existingProduct) {
        return res.status(400).json({ message: 'El código de barras ya está en uso' });
      }
    }

    product = await Product.findByIdAndUpdate(
      req.params.id,
      { name, description, price, cost, stock, minStock, barcode, image, category, active, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (product.stock < product.minStock) {
      sendLowStockAlert([product]);
    }

    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar producto' });
  }
});

router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    const hasSales = await Sale.findOne({ 'items.product': req.params.id });
    
    if (hasSales) {
      product.active = false;
      await product.save();
      return res.json({ message: 'Producto desactivado (tiene ventas asociadas)' });
    }

    await product.deleteOne();
    res.json({ message: 'Producto eliminado' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar producto' });
  }
});

module.exports = router;
