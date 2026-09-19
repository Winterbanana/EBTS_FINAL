import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Package, Search, Camera, AlertTriangle, ImageIcon } from 'lucide-react';
import { Equipment } from '../types';
import { QRScanner } from './QRScanner';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface EquipmentListProps {
  equipment: Equipment[];
}

export function EquipmentList({ equipment }: EquipmentListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Available' | 'Borrowed'>('All');
  const [showScanner, setShowScanner] = useState(false);
  const [scannedQR, setScannedQR] = useState('');

  // Dynamically extract unique categories from equipment
  const availableCategories = Array.from(new Set(equipment.map(item => item.category))).sort();

  const filteredEquipment = equipment.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.qrcode.includes(searchTerm) ||
                         item.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'All' || item.category === filterCategory;
    const matchesStatus = filterStatus === 'All' || item.status === filterStatus || 
                         (filterStatus === 'Available' && item.status === 'Missing'); // Include missing in filters
    const matchesScanned = !scannedQR || item.qrcode === scannedQR;
    return matchesSearch && matchesCategory && matchesStatus && matchesScanned;
  });

  // Helper function to get quality condition color
  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'Excellent': return 'bg-green-100 text-green-700 border-green-300';
      case 'Good': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'Fair': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'Poor': return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'Damaged': return 'bg-red-100 text-red-700 border-red-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const handleQRScan = (result: string) => {
    setScannedQR(result);
    setSearchTerm(result);
  };

  const clearScan = () => {
    setScannedQR('');
    setSearchTerm('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl text-gray-800">Equipment Inventory</h2>
        <button
          onClick={() => setShowScanner(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors shadow-md"
        >
          <Camera className="w-4 h-4" />
          Scan QR Code
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label htmlFor="search" className="block mb-2 text-sm text-gray-700">
              Search Equipment
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="search"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, ID, or QR code..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-gray-50"
              />
              {scannedQR && (
                <button
                  onClick={clearScan}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-500 hover:text-gray-700"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="category" className="block mb-2 text-sm text-gray-700">
              Category
            </label>
            <select
              id="category"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-blue-50"
            >
              <option value="All">All Categories</option>
              {availableCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="status" className="block mb-2 text-sm text-gray-700">
              Status
            </label>
            <select
              id="status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-gray-50"
            >
              <option value="All">All Status</option>
              <option value="Available">Available</option>
              <option value="Borrowed">Borrowed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Equipment Types</p>
          <p className="text-2xl text-gray-800">{filteredEquipment.length}</p>
          <p className="text-xs text-gray-500 mt-1">
            {filteredEquipment.reduce((sum, e) => sum + e.totalStock, 0)} total units
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Available Stock</p>
          <p className="text-2xl text-green-600">
            {filteredEquipment.reduce((sum, e) => sum + e.availableStock, 0)}
          </p>
          <p className="text-xs text-gray-500 mt-1">units ready to borrow</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Borrowed Stock</p>
          <p className="text-2xl text-orange-600">
            {filteredEquipment.reduce((sum, e) => sum + e.borrowedStock, 0)}
          </p>
          <p className="text-xs text-gray-500 mt-1">units in use</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Utilization Rate</p>
          <p className="text-2xl text-blue-600">
            {filteredEquipment.reduce((sum, e) => sum + e.totalStock, 0) > 0
              ? Math.round((filteredEquipment.reduce((sum, e) => sum + e.borrowedStock, 0) / filteredEquipment.reduce((sum, e) => sum + e.totalStock, 0)) * 100)
              : 0}%
          </p>
          <p className="text-xs text-gray-500 mt-1">equipment in use</p>
        </div>
      </div>

      {/* Equipment Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEquipment.map(item => (
          <div
            key={item.id}
            className={`rounded-lg shadow-sm p-5 border-2 transition-all ${
              item.availableStock === 0
                ? 'bg-red-50 border-red-200 hover:border-red-400'
                : item.availableStock < 2
                ? 'bg-yellow-50 border-yellow-200 hover:border-yellow-400'
                : 'bg-white border-green-200 hover:border-green-400'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg mb-1 text-gray-800">
                  {item.name}
                </h3>
                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                  {item.category}
                </span>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={`px-3 py-1 text-xs rounded-full ${
                  item.availableStock === 0
                    ? 'bg-red-100 text-red-700'
                    : item.availableStock < 2
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-green-100 text-green-700'
                }`}>
                  {item.availableStock === 0 ? 'Out of Stock' : item.availableStock < 2 ? 'Low Stock' : 'In Stock'}
                </span>
                <span className="text-xs text-gray-500">
                  {item.availableStock}/{item.totalStock}
                </span>
              </div>
            </div>

            {/* Equipment Photo & QR Code Side by Side */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {/* Equipment Photo */}
              <div className="rounded-lg overflow-hidden border bg-gray-50 border-gray-200">
                {item.photoUrl ? (
                  <ImageWithFallback
                    src={item.photoUrl}
                    alt={item.name}
                    className="w-full h-32 object-cover"
                  />
                ) : (
                  <div className="w-full h-32 flex items-center justify-center bg-gray-200">
                    <ImageIcon className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <div className="p-2 bg-white border-t border-gray-200">
                  <p className="text-xs text-gray-600 text-center">Equipment Photo</p>
                </div>
              </div>

              {/* QR Code */}
              <div className="p-3 rounded-lg flex flex-col items-center justify-center border bg-gray-50 border-gray-200">
                <QRCodeSVG
                  value={item.qrcode}
                  size={90}
                  level="H"
                  includeMargin={true}
                  fgColor="#1F2937"
                />
                <div className="mt-2">
                  <p className="text-xs text-gray-600 text-center">QR Code</p>
                </div>
              </div>
            </div>

            <div className={`space-y-2 text-sm ${item.status === 'Missing' ? 'text-gray-600' : 'text-gray-600'}`}>
              {/* Stock Availability - Prominent Display */}
              <div className="pt-2 pb-2 border-t border-b border-blue-200 bg-blue-50 rounded px-3 -mx-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-gray-700">Available Stock:</span>
                  <span className="text-2xl text-green-600">{item.availableStock}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-gray-600">
                  <span>Total Stock:</span>
                  <span>{item.totalStock} units</span>
                </div>
                {item.borrowedStock > 0 && (
                  <div className="flex justify-between items-center text-xs text-orange-600 mt-1">
                    <span>Currently Borrowed:</span>
                    <span>{item.borrowedStock} unit{item.borrowedStock > 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between">
                <span>Equipment ID:</span>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-800">
                  {item.id}
                </code>
              </div>
              <div className="flex justify-between">
                <span>QR Code:</span>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-800">
                  {item.qrcode}
                </code>
              </div>
              <div className="flex justify-between items-center">
                <span>Condition:</span>
                <span className={`px-2 py-1 text-xs rounded border ${getConditionColor(item.qualityCondition)}`}>
                  {item.qualityCondition}
                </span>
              </div>
              {item.conditionNotes && (
                <div className="pt-1">
                  <p className="text-xs text-gray-500">{item.conditionNotes}</p>
                </div>
              )}
              {item.borrowedStock > 0 && item.borrowedBy && (
                <div className="pt-2 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">Currently Borrowed:</p>
                  <p className="text-sm text-gray-800">{item.borrowedBy}</p>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs">Due Date:</span>
                    <span className="text-xs text-orange-600">{item.dueDate}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredEquipment.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center border border-gray-200">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No equipment found</p>
          <p className="text-sm text-gray-500 mt-1">Try adjusting your search or filters</p>
        </div>
      )}

      {/* QR Scanner Modal */}
      {showScanner && (
        <QRScanner
          onScan={handleQRScan}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
}