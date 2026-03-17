const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre del producto es requerido'],
    trim: true,
    maxlength: [100, 'El nombre no puede exceder 100 caracteres']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'La descripción no puede exceder 500 caracteres']
  },
  price: {
    type: Number,
    required: [true, 'El precio es requerido'],
    min: [0, 'El precio no puede ser negativo']
  },
  cost: {
    type: Number,
    default: 0,
    min: [0, 'El costo no puede ser negativo']
  },
  stock: {
    type: Number,
    required: [true, 'El stock es requerido'],
    min: [0, 'El stock no puede ser negativo'],
    default: 0
  },
  minStock: {
    type: Number,
    default: 10,
    min: [0, 'El stock mínimo no puede ser negativo']
  },
  barcode: {
    type: String,
    trim: true,
    unique: true,
    sparse: true
  },
  image: {
    type: String,
    default: '/placeholder.png'
  },
  category: {
    type: String,
    trim: true,
    default: 'General'
  },
  active: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

productSchema.index({ name: 'text', barcode: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ stock: 1 });

productSchema.virtual('isLowStock').get(function() {
  return this.stock < this.minStock;
});

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);
