import { useState, useRef } from 'react';
import { X, Package, Camera, QrCode, CheckCircle, AlertCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Equipment } from '../types';

interface AddEquipmentModalProps {
  onClose: () => void;
  onAddEquipment: (equipment: Equipment) => void;
  existingEquipment: Equipment[];
}

export function AddEquipmentModal({ onClose, onAddEquipment, existingEquipment }: AddEquipmentModalProps) {
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('WCC');
  const [category, setCategory] = useState<Equipment['category']>('Culinary');
  const [program, setProgram] = useState('BS Culinary');
  const [stock, setStock] = useState(10);
  const [condition, setCondition] = useState<Equipment['qualityCondition']>('Excellent');
  const [photoUrl, setPhotoUrl] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate unique QR code
  const generateQRCode = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `EQP-${category.replace(/\s+/g, '-').toUpperCase()}-${timestamp}-${random}`;
  };

  const [qrCode] = useState(generateQRCode());

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Photo size must be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrl(reader.result as string);
        setError('');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    // Clear previous errors
    setError('');

    // Validation
    if (!name.trim()) {
      setError('Please enter equipment name');
      return;
    }

    if (name.trim().length < 3) {
      setError('Equipment name must be at least 3 characters');
      return;
    }

    if (stock < 1 || stock > 10) {
      setError('Stock must be between 1 and 10');
      return;
    }

    if (!Number.isInteger(stock)) {
      setError('Stock must be a whole number');
      return;
    }

    // Check if QR code already exists
    const qrExists = existingEquipment.some(eq => eq.qrcode === qrCode);
    if (qrExists) {
      setError('QR code already exists. Please close and try again.');
      return;
    }

    // Check if equipment name already exists in the same category
    const nameExists = existingEquipment.some(
      eq => eq.name.toLowerCase() === name.trim().toLowerCase() && eq.category === category
    );
    if (nameExists) {
      setError(`An equipment named "${name.trim()}" already exists in ${category} category`);
      return;
    }

    // Create new equipment
    const newEquipment: Equipment = {
      id: `eq-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      name: name.trim(),
      brand: brand.trim(),
      category,
      program,
      qrcode: qrCode,
      photoUrl: photoUrl || undefined,
      totalStock: stock,
      availableStock: stock,
      borrowedStock: 0,
      status: 'Available',
      qualityCondition: condition,
      lastConditionUpdate: new Date().toISOString().split('T')[0],
    };

    onAddEquipment(newEquipment);
    setShowSuccess(true);

    setTimeout(() => {
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 to-black text-white p-6 sticky top-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl">Add New Equipment</h3>
                <p className="text-sm text-blue-200 mt-1">Add equipment to your inventory</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {!showSuccess ? (
          <div className="p-6">
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="space-y-6">
              {/* Equipment Name and Category - Single Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Equipment Name */}
                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    Equipment Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Phillips Screwdriver Set"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Brand <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="e.g., WCC, Tolsen, Hawch"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Equipment['category'])}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Culinary">Culinary</option>
                    <option value="Hospitality">Hospitality</option>
                    <option value="Aviation Maintenance">Aviation Maintenance</option>
                    <option value="Science/Health-related">Science/Health-related</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-2">Program <span className="text-red-500">*</span></label>
                  <select value={program} onChange={(e) => setProgram(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg">
                    <option>BS Culinary</option>
                    <option>BS Hospitality Management</option>
                    <option>BS Aviation</option>
                    <option>BS General Science</option>
                  </select>
                </div>
              </div>

              {/* Stock and Condition - Single Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Stock */}
                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    Stock Quantity (Max: 10) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    step="1"
                    value={stock}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 1;
                      setStock(Math.min(10, Math.max(1, value)));
                    }}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    Current: {stock} / 10 (Maximum allowed per item)
                  </p>
                </div>

                {/* Condition */}
                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    Condition <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value as Equipment['qualityCondition'])}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Excellent">Excellent - Brand New</option>
                    <option value="Good">Good - Minimal Wear</option>
                    <option value="Fair">Fair - Visible Wear</option>
                    <option value="Poor">Poor - Heavy Wear</option>
                    <option value="Damaged">Damaged - Needs Repair</option>
                  </select>
                </div>
              </div>

              {/* Photo Upload Section - Full Width with Better Visibility */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Camera className="w-5 h-5 text-blue-700" />
                  <label className="text-sm text-blue-900">
                    Equipment Photo <span className="text-gray-600">(Optional)</span>
                  </label>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />

                {!photoUrl ? (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex flex-col items-center justify-center gap-3 px-6 py-8 border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-500 hover:bg-blue-100 transition-colors bg-white"
                  >
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                      <Camera className="w-8 h-8 text-blue-600" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-blue-900">Click to upload equipment photo</p>
                      <p className="text-xs text-gray-600 mt-1">PNG, JPG up to 5MB</p>
                    </div>
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className="relative rounded-lg overflow-hidden border-2 border-blue-300 bg-white">
                      <img
                        src={photoUrl}
                        alt="Equipment preview"
                        className="w-full h-64 object-cover"
                      />
                      <button
                        onClick={() => setPhotoUrl('')}
                        className="absolute top-3 right-3 p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-lg"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      <Camera className="w-4 h-4" />
                      <span className="text-sm">Change Photo</span>
                    </button>
                  </div>
                )}
              </div>

              {/* QR Code and Summary Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* QR Code Preview */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border-2 border-blue-200">
                  <div className="flex items-center gap-2 mb-4">
                    <QrCode className="w-5 h-5 text-blue-800" />
                    <h4 className="text-blue-900">Auto-Generated QR Code</h4>
                  </div>

                  <div className="bg-white rounded-lg p-6 flex flex-col items-center">
                    <QRCodeSVG
                      value={qrCode}
                      size={180}
                      level="H"
                      includeMargin={true}
                      fgColor="#1e3a8a"
                    />
                    <p className="text-xs text-gray-600 mt-3 text-center break-all font-mono">
                      {qrCode}
                    </p>
                  </div>

                  <div className="mt-4 text-xs text-blue-800 space-y-1">
                    <p>✓ Unique QR code generated</p>
                    <p>✓ Ready for printing</p>
                    <p>✓ High error correction level</p>
                  </div>
                </div>

                {/* Summary Card */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h4 className="text-sm text-gray-700 mb-3">Equipment Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="text-gray-900 font-medium">{name || 'Not set'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Category:</span>
                      <span className="text-gray-900">{category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Stock:</span>
                      <span className="text-gray-900 font-medium">{stock} units</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Condition:</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        condition === 'Excellent' ? 'bg-green-100 text-green-800' :
                        condition === 'Good' ? 'bg-blue-100 text-blue-800' :
                        condition === 'Fair' ? 'bg-yellow-100 text-yellow-800' :
                        condition === 'Poor' ? 'bg-orange-100 text-orange-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {condition}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Photo:</span>
                      <span className={`font-medium ${photoUrl ? 'text-green-600' : 'text-gray-400'}`}>
                        {photoUrl ? '✓ Uploaded' : 'Not uploaded'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!name.trim()}
                className={`flex-1 py-3 rounded-lg transition-colors ${
                  name.trim()
                    ? 'bg-gradient-to-r from-blue-800 to-black text-white hover:from-blue-900 hover:to-gray-900'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Add Equipment
              </button>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-xl text-gray-900 mb-2">Equipment Added Successfully!</h3>
            <p className="text-sm text-gray-600">
              {name} has been added to your inventory with {stock} units.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
