import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Package, Search, Camera, AlertTriangle, ImageIcon } from 'lucide-react';
import { BorrowRequest, Equipment } from '../types';
import { QRScanner } from './QRScanner';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { getInventoryMetrics } from '../inventoryMetrics';

interface EquipmentListProps {
  equipment: Equipment[];
  requests: BorrowRequest[];
}

export function EquipmentList({ equipment, requests }: EquipmentListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Available' | 'Borrowed'>('All');
  const [showScanner, setShowScanner] = useState(false);
  const [scannedQR, setScannedQR] = useState('');
  const inventoryMetrics = getInventoryMetrics(equipment, requests);

  // Dynamically extract unique categories from equipment
  const availableCategories = Array.from(new Set(equipment.map(item => item.category))).sort();

  const filteredEquipment = equipment.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.qrcode.includes(searchTerm) ||
                         item.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'All' || item.category === filterCategory;
    const itemMetrics = inventoryMetrics.byEquipmentId.get(item.id);
    const matchesStatus = filterStatus === 'All' ||
               (filterStatus === 'Available' && (itemMetrics?.available || 0) > 0) ||
               (filterStatus === 'Borrowed' && (itemMetrics?.borrowed || 0) > 0);
    const matchesScanned = !scannedQR || item.qrcode === scannedQR;
    return matchesSearch && matchesCategory && matchesStatus && matchesScanned;
  });

  const equipmentGroups = filterCategory === 'All'
    ? Array.from(filteredEquipment.reduce((groups, item) => {
        const key = item.photoUrl ? `${item.name.toLowerCase()}|${item.photoUrl}` : item.id;
        const group = groups.get(key) || [];
        group.push(item);
        groups.set(key, group);
        return groups;
      }, new Map<string, Equipment[]>()).values())
    : filteredEquipment.map(item => [item]);

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
          <p className="text-2xl text-gray-800">{equipmentGroups.length}</p>
          <p className="text-xs text-gray-500 mt-1">
            {filteredEquipment.reduce((sum, e) => sum + (inventoryMetrics.byEquipmentId.get(e.id)?.total || 0), 0)} total units
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Available Stock</p>
          <p className="text-2xl text-green-600">
            {filteredEquipment.reduce((sum, e) => sum + (inventoryMetrics.byEquipmentId.get(e.id)?.available || 0), 0)}
          </p>
          <p className="text-xs text-gray-500 mt-1">units ready to borrow</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Borrowed Stock</p>
          <p className="text-2xl text-orange-600">
            {filteredEquipment.reduce((sum, e) => sum + (inventoryMetrics.byEquipmentId.get(e.id)?.borrowed || 0), 0)}
          </p>
          <p className="text-xs text-gray-500 mt-1">units in use</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Utilization Rate</p>
          <p className="text-2xl text-blue-600">
            {filteredEquipment.reduce((sum, e) => sum + (inventoryMetrics.byEquipmentId.get(e.id)?.total || 0), 0) > 0
              ? Math.round((filteredEquipment.reduce((sum, e) => sum + (inventoryMetrics.byEquipmentId.get(e.id)?.borrowed || 0), 0) / filteredEquipment.reduce((sum, e) => sum + (inventoryMetrics.byEquipmentId.get(e.id)?.total || 0), 0)) * 100)
              : 0}%
          </p>
          <p className="text-xs text-gray-500 mt-1">equipment in use</p>
        </div>
      </div>

      {/* Equipment Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {equipmentGroups.map(group => {
          const item = group[0];
          const totalStock = group.reduce((sum, equipmentItem) => sum + (inventoryMetrics.byEquipmentId.get(equipmentItem.id)?.total || 0), 0);
          const availableStock = group.reduce((sum, equipmentItem) => sum + (inventoryMetrics.byEquipmentId.get(equipmentItem.id)?.available || 0), 0);
          const borrowedStock = group.reduce((sum, equipmentItem) => sum + (inventoryMetrics.byEquipmentId.get(equipmentItem.id)?.borrowed || 0), 0);
          const categories = Array.from(new Set(group.map(equipmentItem => equipmentItem.category)));
          const programs = Array.from(new Set(group.map(equipmentItem => equipmentItem.program).filter(Boolean)));

          return (
          <div
            key={group.map(equipmentItem => equipmentItem.id).join('|')}
            className={`rounded-lg shadow-sm p-5 border-2 transition-all ${
              availableStock === 0
                ? 'bg-red-50 border-red-200 hover:border-red-400'
                : availableStock < 2
                ? 'bg-yellow-50 border-yellow-200 hover:border-yellow-400'
                : 'bg-white border-green-200 hover:border-green-400'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg mb-1 text-gray-800">
                  {item.name}
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {item.brand && <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">{item.brand}</span>}
                  {categories.map(category => <span key={category} className="text-xs px-2 py-1 bg-blue-50 text-blue-800 rounded">{category}</span>)}
                </div>
                {programs.length > 0 && <p className="mt-1 text-xs text-gray-500">{programs.join(' · ')}</p>}
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={`px-3 py-1 text-xs rounded-full ${
                  availableStock === 0
                    ? 'bg-red-100 text-red-700'
                    : availableStock < 2
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-green-100 text-green-700'
                }`}>
                  {availableStock === 0 ? 'Out of Stock' : availableStock < 2 ? 'Low Stock' : 'In Stock'}
                </span>
                <span className="text-xs text-gray-500">
                  {availableStock}/{totalStock}
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
              <div className="p-2 rounded-lg flex flex-wrap items-center justify-center gap-2 border bg-gray-50 border-gray-200">
                {group.map(equipmentItem => (
                  <div key={equipmentItem.id} className="flex flex-col items-center">
                    <QRCodeSVG value={equipmentItem.qrcode} size={group.length > 1 ? 62 : 90} level="H" includeMargin={true} fgColor="#1F2937" />
                    {group.length > 1 && <span className="text-[10px] text-gray-600">{equipmentItem.category}</span>}
                  </div>
                ))}
                <p className="w-full text-xs text-gray-600 text-center">QR Code{group.length > 1 ? 's' : ''}</p>
              </div>
            </div>

            <div className={`space-y-2 text-sm ${item.status === 'Missing' ? 'text-gray-600' : 'text-gray-600'}`}>
              {/* Stock Availability - Prominent Display */}
              <div className="pt-2 pb-2 border-t border-b border-blue-200 bg-blue-50 rounded px-3 -mx-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-gray-700">Available Stock:</span>
                  <span className="text-2xl text-green-600">{availableStock}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-gray-600">
                  <span>Total Stock:</span>
                  <span>{totalStock} units</span>
                </div>
                {borrowedStock > 0 && (
                  <div className="flex justify-between items-center text-xs text-orange-600 mt-1">
                    <span>Currently Borrowed:</span>
                    <span>{borrowedStock} unit{borrowedStock > 1 ? 's' : ''}</span>
                  </div>
                )}
                {group.length > 1 && (
                  <div className="mt-2 space-y-1 border-t border-blue-200 pt-2">
                    {group.map(equipmentItem => (
                      <div key={equipmentItem.id} className="flex justify-between text-xs text-gray-600">
                        <span>{equipmentItem.category} stock:</span>
                        <span>{inventoryMetrics.byEquipmentId.get(equipmentItem.id)?.available || 0}/{inventoryMetrics.byEquipmentId.get(equipmentItem.id)?.total || 0}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-between">
                <span>Equipment ID:</span>
                <span className="flex flex-wrap justify-end gap-1">{group.map(equipmentItem => <code key={equipmentItem.id} className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-800">{equipmentItem.id}</code>)}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span>Item Status:</span>
                <span className="flex flex-wrap justify-end gap-1">{group.map(equipmentItem => (
                  <span key={equipmentItem.id} className={`text-xs px-2 py-1 rounded ${
                    equipmentItem.status === 'Missing' ? 'bg-red-100 text-red-700' :
                    equipmentItem.status === 'Unavailable' ? 'bg-orange-100 text-orange-700' :
                    equipmentItem.status === 'Borrowed' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {equipmentItem.id}: {equipmentItem.status}
                  </span>
                ))}</span>
              </div>
              <div className="flex justify-between">
                <span>QR Code:</span>
                <span className="flex flex-wrap justify-end gap-1">{group.map(equipmentItem => <code key={equipmentItem.id} className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-800">{equipmentItem.qrcode}</code>)}</span>
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
              {group.filter(equipmentItem => equipmentItem.borrowedStock > 0 && equipmentItem.borrowedBy).map(equipmentItem => (
                <div key={equipmentItem.id} className="pt-2 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">Currently Borrowed:</p>
                  <p className="text-sm text-gray-800">{equipmentItem.borrowedBy}</p>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs">Due Date:</span>
                    <span className="text-xs text-orange-600">{equipmentItem.dueDate}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          );
        })}
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