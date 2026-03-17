const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  productBarcode: {
    type: String
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'La cantidad debe ser al menos 1']
  },
  unitPrice: {
    type: Number,
    required: true
  },
  subtotal: {
    type: Number,
    required: true
  }
});

const saleSchema = new mongoose.Schema({
  items: {
    type: [saleItemSchema],
    required: true,
    validate: [arr => arr.length > 0, 'La venta debe tener al menos un producto']
  },
  customer: {
    name: {
      type: String,
      trim: true,
      default: 'Cliente Mostrador'
    },
    email: {
      type: String,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    }
  },
  subtotal: {
    type: Number,
    required: true
  },
  tax: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['efectivo', 'tarjeta', 'transferencia', 'mixto'],
    default: 'efectivo'
  },
  status: {
    type: String,
    enum: ['completada', 'cancelada', 'pendiente'],
    default: 'completada'
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sellerName: {
    type: String,
    required: true
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

saleSchema.index({ createdAt: -1 });
saleSchema.index({ 'customer.name': 1 });
saleSchema.index({ seller: 1 });
saleSchema.index({ status: 1 });

saleSchema.statics.getSalesByDateRange = async function(startDate, endDate) {
  return this.find({
    createdAt: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    },
    status: 'completada'
  }).populate('seller', 'name').sort({ createdAt: -1 });
};

module.exports = mongoose.model('Sale', saleSchema);
