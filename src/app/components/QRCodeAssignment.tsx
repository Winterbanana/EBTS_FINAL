import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import Barcode from 'react-barcode';
import { QrCode, Save, Plus, Download } from 'lucide-react';
import { Equipment } from '../types';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface QRCodeAssignmentProps {
  equipment: Equipment[];
  onUpdateEquipment: (equipment: Equipment[]) => void;
}

export function QRCodeAssignment({ equipment, onUpdateEquipment }: QRCodeAssignmentProps) {
  const [selectedId, setSelectedId] = useState('');
  const [newQRCode, setNewQRCode] = useState('');
  const [showAddNew, setShowAddNew] = useState(false);
  const [newEquipment, setNewEquipment] = useState({
    name: '',
    brand: 'WCC',
    category: 'Culinary' as Equipment['category'],
    program: 'BS Culinary',
    qrcode: '',
  });

  const handleAssignQR = () => {
    if (!selectedId || !newQRCode) return;

    const updated = equipment.map(e =>
      e.id === selectedId ? { ...e, qrcode: newQRCode } : e
    );
    onUpdateEquipment(updated);
    setSelectedId('');
    setNewQRCode('');
  };

  const handleAddEquipment = () => {
    if (!newEquipment.name || !newEquipment.qrcode) return;

    const prefix = newEquipment.category.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() || 'EQ';
    const count = equipment.filter(e => e.category === newEquipment.category).length + 1;
    const id = `${prefix}${String(count).padStart(3, '0')}`;

    const newEq: Equipment = {
      id,
      name: newEquipment.name,
      brand: newEquipment.brand,
      category: newEquipment.category,
      program: newEquipment.program,
      qrcode: newEquipment.qrcode,
      photoUrl: undefined,
      totalStock: 10,
      availableStock: 10,
      borrowedStock: 0,
      status: 'Available',
      qualityCondition: 'Excellent',
      lastConditionUpdate: new Date().toISOString().split('T')[0],
    };

    onUpdateEquipment([...equipment, newEq]);
    setNewEquipment({ name: '', brand: 'WCC', category: 'Culinary', program: 'BS Culinary', qrcode: '' });
    setShowAddNew(false);
  };

  const generateQRCode = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `EQ-${timestamp}-${random}`;
  };

  const downloadQRCode = (qrcode: string, filename: string) => {
    const svg = document.getElementById(`qr-${qrcode}`);
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    canvas.width = 300;
    canvas.height = 300;

    img.onload = () => {
      ctx?.drawImage(img, 0, 0);
      canvas.toBlob(blob => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${filename}.png`;
          a.click();
          URL.revokeObjectURL(url);
        }
      });
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const selectedEquipment = equipment.find(e => e.id === selectedId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl text-gray-800">QR Code Assignment</h2>
        <button
          onClick={() => setShowAddNew(!showAddNew)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors shadow-md"
        >
          <Plus className="w-4 h-4" />
          Add New Equipment
        </button>
      </div>

      {/* Add New Equipment Form */}
      {showAddNew && (
        <div className="bg-white rounded-lg shadow-sm p-6 border-2 border-gray-800">
          <h3 className="text-lg text-gray-800 mb-4">Add New Equipment</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 text-sm text-gray-700">Equipment Name</label>
              <input
                type="text"
                value={newEquipment.name}
                onChange={(e) => setNewEquipment({ ...newEquipment, name: e.target.value })}
                placeholder="e.g., Phillips Screwdriver Set"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-gray-50"
              />
            </div>
            <div>
              <label className="block mb-2 text-sm text-gray-700">Category</label>
              <select
                value={newEquipment.category}
                onChange={(e) => setNewEquipment({ ...newEquipment, category: e.target.value as any })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-gray-50"
              >
                <option value="Culinary">Culinary</option>
                <option value="Hospitality">Hospitality</option>
                <option value="Aviation Maintenance">Aviation Maintenance</option>
                <option value="Science/Health-related">Science/Health-related</option>
              </select>
            </div>
            <div>
              <label className="block mb-2 text-sm text-gray-700">QR Code</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newEquipment.qrcode}
                  onChange={(e) => setNewEquipment({ ...newEquipment, qrcode: e.target.value })}
                  placeholder="QR Code value"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-gray-50"
                />
                <button
                  onClick={() => setNewEquipment({ ...newEquipment, qrcode: generateQRCode() })}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Generate
                </button>
              </div>
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={handleAddEquipment}
                disabled={!newEquipment.name || !newEquipment.qrcode}
                className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Equipment
              </button>
              <button
                onClick={() => setShowAddNew(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign QR Code Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Assignment Form */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg text-gray-800 mb-4">Assign/Update QR Code</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block mb-2 text-sm text-gray-700">Select Equipment</label>
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-gray-50"
              >
                <option value="">-- Select Equipment --</option>
                {equipment.map(eq => (
                  <option key={eq.id} value={eq.id}>
                    {eq.name} ({eq.category}) - Current: {eq.qrcode}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-2 text-sm text-gray-700">New QR Code</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newQRCode}
                  onChange={(e) => setNewQRCode(e.target.value)}
                  placeholder="Enter new QR code value"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-gray-50"
                />
                <button
                  onClick={() => setNewQRCode(generateQRCode())}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Generate
                </button>
              </div>
            </div>

            <button
              onClick={handleAssignQR}
              disabled={!selectedId || !newQRCode}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              <Save className="w-4 h-4" />
              Save QR Code Assignment
            </button>
          </div>

          {/* Preview */}
          {selectedEquipment && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="text-sm text-gray-700 mb-3">Current Assignment</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Equipment:</span>
                  <span className="text-gray-900">{selectedEquipment.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Current QR:</span>
                  <code className="text-xs bg-gray-200 px-2 py-1 rounded text-gray-800">
                    {selectedEquipment.qrcode}
                  </code>
                </div>
                {newQRCode && (
                  <div className="flex justify-between pt-2 border-t border-gray-300">
                    <span className="text-gray-600">New QR:</span>
                    <code className="text-xs bg-green-100 px-2 py-1 rounded text-green-800">
                      {newQRCode}
                    </code>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right: QR Preview */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg text-gray-800 mb-4">QR Code Preview</h3>
          
          {newQRCode ? (
            <div className="space-y-4">
              {/* QR Code */}
              <div className="bg-gray-50 p-6 rounded-lg flex justify-center border border-gray-200">
                <QRCodeSVG
                  id={`qr-${newQRCode}`}
                  value={newQRCode}
                  size={200}
                  level="H"
                  includeMargin={true}
                  fgColor="#1F2937"
                />
              </div>

              {/* Barcode */}
              <div className="bg-gray-50 p-4 rounded-lg flex justify-center border border-gray-200">
                <Barcode
                  value={newQRCode}
                  width={2}
                  height={50}
                  fontSize={12}
                  margin={10}
                  displayValue={true}
                />
              </div>

              <div className="text-center">
                <code className="text-sm bg-gray-200 px-3 py-2 rounded text-gray-800">
                  {newQRCode}
                </code>
              </div>
              <button
                onClick={() => downloadQRCode(newQRCode, `QR-${selectedEquipment?.id || 'code'}`)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download QR Code
              </button>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                <QrCode className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600 mb-1">No QR code to preview</p>
              <p className="text-sm text-gray-500">Generate or enter a QR code value</p>
            </div>
          )}
        </div>
      </div>

      {/* All QR Codes Grid */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg text-gray-800 mb-4">All Equipment QR Codes</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {equipment.map(eq => (
            <div key={eq.id} className="bg-gray-50 p-5 rounded-lg border-2 border-gray-200 hover:border-gray-400 transition-colors">
              {/* Equipment Photo and QR Code Side by Side */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                {/* Equipment Photo */}
                <div className="flex items-center justify-center bg-white rounded-lg p-3 border border-gray-200">
                  {eq.photoUrl ? (
                    <ImageWithFallback
                      src={eq.photoUrl}
                      alt={eq.name}
                      className="w-full h-32 object-contain rounded"
                    />
                  ) : (
                    <div className="w-full h-32 flex items-center justify-center bg-gray-100 rounded">
                      <QrCode className="w-12 h-12 text-gray-300" />
                    </div>
                  )}
                </div>

                {/* QR Code */}
                <div className="flex items-center justify-center bg-white rounded-lg p-3 border border-gray-200">
                  <QRCodeSVG
                    id={`qr-${eq.qrcode}`}
                    value={eq.qrcode}
                    size={120}
                    level="H"
                    includeMargin={true}
                    fgColor="#1F2937"
                  />
                </div>
              </div>

              {/* Barcode Below */}
              <div className="bg-white rounded-lg p-3 border border-gray-200 mb-3 flex items-center justify-center">
                <Barcode
                  value={eq.qrcode}
                  width={1.5}
                  height={40}
                  fontSize={10}
                  margin={5}
                  displayValue={true}
                />
              </div>

              {/* Equipment Name and Code */}
              <div className="text-center mb-3">
                <p className="text-sm text-gray-900 mb-1 font-medium">{eq.name}</p>
                <code className="text-xs bg-gray-200 px-2 py-1 rounded text-gray-700">
                  {eq.qrcode}
                </code>
              </div>

              {/* Download Button */}
              <button
                onClick={() => downloadQRCode(eq.qrcode, eq.id)}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-700 text-white text-sm rounded-lg hover:bg-gray-600 transition-colors shadow-sm"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
// QR Codes updated: 1780410309
