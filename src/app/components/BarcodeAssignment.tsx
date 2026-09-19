import { useState } from 'react';
import Barcode from 'react-barcode';
import { Plus, Edit, CheckCircle, BarChart3 } from 'lucide-react';
import { Equipment } from '../types';

interface BarcodeAssignmentProps {
  equipment: Equipment[];
  onUpdateEquipment: (equipment: Equipment[]) => void;
}

export function BarcodeAssignment({ equipment, onUpdateEquipment }: BarcodeAssignmentProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Arnis' as 'Arnis' | 'Basketball' | 'Laptop',
    qrcode: '',
  });

  const generateBarcode = () => {
    return `123456789${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingId) {
      // Update existing equipment
      const updatedEquipment = equipment.map(item =>
        item.id === editingId
          ? { ...item, name: formData.name, category: formData.category, qrcode: formData.qrcode }
          : item
      );
      onUpdateEquipment(updatedEquipment);
      setEditingId(null);
    } else {
      // Add new equipment
      const newEquipment: Equipment = {
        id: `EQ${Date.now()}`,
        name: formData.name,
        category: formData.category,
        qrcode: formData.qrcode,
        status: 'Available',
      };
      onUpdateEquipment([...equipment, newEquipment]);
      setShowAddForm(false);
    }

    setFormData({ name: '', category: 'Arnis', qrcode: '' });
  };

  const handleEdit = (item: Equipment) => {
    setEditingId(item.id);
    setFormData({
      name: item.name,
      category: item.category,
      qrcode: item.qrcode,
    });
    setShowAddForm(true);
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingId(null);
    setFormData({ name: '', category: 'Arnis', qrcode: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl">Barcode Assignment</h2>
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Equipment
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg mb-4">{editingId ? 'Edit Equipment' : 'Add New Equipment'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block mb-2 text-sm text-gray-700">
                  Equipment Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="e.g., Laptop Dell 1"
                  required
                />
              </div>

              <div>
                <label htmlFor="category" className="block mb-2 text-sm text-gray-700">
                  Category
                </label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="Arnis">Arnis</option>
                  <option value="Basketball">Basketball</option>
                  <option value="Laptop">Laptop</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="barcode" className="block mb-2 text-sm text-gray-700">
                  Barcode
                </label>
                <div className="flex gap-2">
                  <input
                    id="barcode"
                    type="text"
                    value={formData.qrcode}
                    onChange={(e) => setFormData({ ...formData, qrcode: e.target.value })}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Enter barcode or generate"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, qrcode: generateBarcode() })}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Generate
                  </button>
                </div>
              </div>

              {formData.qrcode && (
                <div className="md:col-span-2 bg-gray-50 p-4 rounded-lg flex justify-center">
                  <Barcode value={formData.qrcode} height={60} width={1.5} fontSize={12} />
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                {editingId ? 'Update Equipment' : 'Add Equipment'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Equipment List */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg mb-4">Equipment List with Barcodes</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {equipment.map(item => (
            <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="mb-1">{item.name}</h4>
                  <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                    {item.category}
                  </span>
                </div>
                <button
                  onClick={() => handleEdit(item)}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-white p-3 rounded border border-gray-200 mb-3 flex justify-center">
                <Barcode value={item.qrcode} height={50} width={1.5} fontSize={12} />
              </div>

              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Equipment ID:</span>
                  <span>{item.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={
                    item.status === 'Available' ? 'text-green-600' : 'text-red-600'
                  }>
                    {item.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {equipment.length === 0 && (
          <div className="text-center py-12">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No equipment added yet</p>
            <p className="text-sm text-gray-500 mt-1">Click "Add Equipment" to get started</p>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="mb-2">Barcode Information</h4>
        <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
          <li>Barcodes are unique identifiers for each equipment item</li>
          <li>Use the "Generate" button to automatically create a barcode</li>
          <li>You can also manually enter custom barcodes</li>
          <li>Ensure each barcode is unique across all equipment</li>
          <li>Barcodes help in quick identification and tracking</li>
        </ul>
      </div>
    </div>
  );
}