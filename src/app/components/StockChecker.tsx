import { Package, TrendingUp, TrendingDown, AlertCircle, AlertTriangle, Edit, Download, Plus } from 'lucide-react';
import { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Equipment } from '../types';
import { AddEquipmentModal } from './AddEquipmentModal';

interface StockCheckerProps {
  equipment: Equipment[];
  onUpdateEquipment: (equipment: Equipment[]) => void;
}

export function StockChecker({ equipment, onUpdateEquipment }: StockCheckerProps) {
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editCondition, setEditCondition] = useState<'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Damaged'>('Good');
  const [editNotes, setEditNotes] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Dynamically get all unique categories from equipment
  const uniqueCategories = Array.from(new Set(equipment.map(e => e.category))).sort();

  const getStockByCategory = (category: string) => {
    const items = equipment.filter(e => e.category === category);
    const totalStock = items.reduce((sum, e) => sum + e.totalStock, 0);
    const availableStock = items.reduce((sum, e) => sum + e.availableStock, 0);
    const borrowedStock = items.reduce((sum, e) => sum + e.borrowedStock, 0);
    const missingItems = items.filter(e => e.status === 'Missing').length;
    const utilizationRate = totalStock > 0 ? (borrowedStock / totalStock) * 100 : 0;

    return {
      total: totalStock,
      available: availableStock,
      borrowed: borrowedStock,
      missing: missingItems,
      utilizationRate,
      items,
    };
  };

  const handleMarkAsMissing = (itemId: string) => {
    if (!confirm('Are you sure you want to mark this equipment type as having missing units?')) return;

    const updatedEquipment = equipment.map(e =>
      e.id === itemId
        ? {
            ...e,
            status: 'Missing' as const,
            markedMissingDate: new Date().toISOString().split('T')[0],
            markedMissingBy: 'System Administrator',
          }
        : e
    );
    onUpdateEquipment(updatedEquipment);
  };

  const handleMarkAsAvailable = (itemId: string) => {
    if (!confirm('Mark this equipment as available (returned)?')) return;

    const updatedEquipment = equipment.map(e =>
      e.id === itemId
        ? {
            ...e,
            status: 'Available' as const,
            markedMissingDate: undefined,
            markedMissingBy: undefined,
            lastBorrowedBy: undefined,
          }
        : e
    );
    onUpdateEquipment(updatedEquipment);
  };

  const handleUpdateCondition = (itemId: string) => {
    const updatedEquipment = equipment.map(e =>
      e.id === itemId
        ? {
            ...e,
            qualityCondition: editCondition,
            conditionNotes: editNotes,
            lastConditionUpdate: new Date().toISOString().split('T')[0],
          }
        : e
    );
    onUpdateEquipment(updatedEquipment);
    setEditingItem(null);
    setEditCondition('Good');
    setEditNotes('');
  };

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

  const generateAuditPDF = () => {
    const totalStock = equipment.reduce((sum, e) => sum + e.totalStock, 0);
    const availableStock = equipment.reduce((sum, e) => sum + e.availableStock, 0);
    const borrowedStock = equipment.reduce((sum, e) => sum + e.borrowedStock, 0);
    const missingCount = equipment.filter(e => e.status === 'Missing').length;

    const doc = new jsPDF('landscape');

    // Header
    doc.setFillColor(30, 64, 175);
    doc.rect(0, 0, 297, 35, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text('WCC Equipment Stock Audit Report', 148.5, 12, { align: 'center' });

    doc.setFontSize(11);
    doc.text('Equipment Borrowing and Tracking Return System', 148.5, 20, { align: 'center' });

    doc.setFontSize(9);
    doc.text(`Generated on: ${new Date().toLocaleString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}`, 148.5, 27, { align: 'center' });

    let yPos = 45;

    // Summary Cards
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);

    const summaryData = [
      { label: 'Total Equipment Types', value: equipment.length },
      { label: 'Total Stock Units', value: totalStock },
      { label: 'Available Units', value: availableStock },
      { label: 'Borrowed Units', value: borrowedStock }
    ];

    summaryData.forEach((item, index) => {
      const xPos = 15 + (index * 68);
      doc.setFillColor(248, 249, 250);
      doc.roundedRect(xPos, yPos, 65, 20, 2, 2, 'F');

      doc.setFontSize(8);
      doc.setTextColor(102, 102, 102);
      doc.text(item.label, xPos + 32.5, yPos + 6, { align: 'center' });

      doc.setFontSize(16);
      doc.setTextColor(30, 64, 175);
      doc.text(String(item.value), xPos + 32.5, yPos + 15, { align: 'center' });
    });

    yPos += 30;

    // Process each category
    uniqueCategories.forEach((category, catIndex) => {
      const categoryData = getStockByCategory(category);

      if (yPos > 180) {
        doc.addPage('landscape');
        yPos = 20;
      }

      // Category Header
      doc.setFillColor(30, 64, 175);
      doc.roundedRect(15, yPos, 267, 10, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.text(category, 20, yPos + 7);

      yPos += 12;

      // Category Stats
      doc.setFillColor(239, 246, 255);
      doc.rect(15, yPos, 267, 12, 'F');

      doc.setFontSize(8);
      doc.setTextColor(102, 102, 102);
      doc.text('Total Stock', 40, yPos + 4);
      doc.text('Available', 110, yPos + 4);
      doc.text('Borrowed', 180, yPos + 4);
      doc.text('Utilization', 240, yPos + 4);

      doc.setFontSize(11);
      doc.setTextColor(30, 64, 175);
      doc.text(String(categoryData.total), 40, yPos + 10);
      doc.setTextColor(5, 150, 105);
      doc.text(String(categoryData.available), 110, yPos + 10);
      doc.setTextColor(220, 38, 38);
      doc.text(String(categoryData.borrowed), 180, yPos + 10);
      doc.setTextColor(30, 64, 175);
      doc.text(`${categoryData.utilizationRate.toFixed(0)}%`, 240, yPos + 10);

      yPos += 14;

      // Equipment Table
      const tableData = categoryData.items.map(item => [
        item.name.substring(0, 25),
        item.qrcode,
        String(item.totalStock),
        String(item.availableStock),
        String(item.borrowedStock),
        item.qualityCondition,
        item.status,
        item.lastConditionUpdate || 'N/A'
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Equipment', 'QR Code', 'Total', 'Avail.', 'Borr.', 'Condition', 'Status', 'Updated']],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [248, 249, 250],
          textColor: [102, 102, 102],
          fontSize: 8,
          fontStyle: 'bold'
        },
        bodyStyles: {
          fontSize: 7,
          textColor: [0, 0, 0]
        },
        columnStyles: {
          0: { cellWidth: 60 },
          1: { cellWidth: 35 },
          2: { cellWidth: 15, halign: 'center' },
          3: { cellWidth: 15, halign: 'center', textColor: [5, 150, 105] },
          4: { cellWidth: 15, halign: 'center', textColor: [220, 38, 38] },
          5: { cellWidth: 25, fontSize: 7 },
          6: { cellWidth: 22, fontSize: 7 },
          7: { cellWidth: 25, fontSize: 7 }
        },
        margin: { left: 15, right: 15 },
        didDrawPage: (data) => {
          yPos = data.cursor ? data.cursor.y + 5 : yPos + 5;
        }
      });

      yPos = (doc as any).lastAutoTable.finalY + 5;
    });

    // Footer
    if (yPos > 180) {
      doc.addPage('landscape');
      yPos = 20;
    }

    doc.setDrawColor(30, 64, 175);
    doc.setLineWidth(0.5);
    doc.line(15, yPos, 282, yPos);

    doc.setFontSize(8);
    doc.setTextColor(102, 102, 102);
    doc.text('Equipment Borrowing and Tracking Return System - WCC', 148.5, yPos + 6, { align: 'center' });
    doc.text('Version 2.2.0 - Stock Management System', 148.5, yPos + 11, { align: 'center' });
    doc.text('This is an official audit report. Please keep for record purposes.', 148.5, yPos + 16, { align: 'center' });

    // Save PDF
    doc.save(`WCC-Stock-Audit-Report-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const categories = uniqueCategories.map(cat => ({
    name: cat,
    data: getStockByCategory(cat),
  }));

  const handleAddEquipment = (newEquipment: Equipment) => {
    onUpdateEquipment([...equipment, newEquipment]);
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl">Equipment Stock Checker</h2>
        <div className="flex gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-colors shadow-md"
          >
            <Plus className="w-4 h-4" />
            Add Equipment
          </button>
          <button
            onClick={generateAuditPDF}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-800 to-black text-white rounded-lg hover:from-blue-900 hover:to-gray-900 transition-colors shadow-md"
          >
            <Download className="w-4 h-4" />
            Download Audit Report (PDF)
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {categories.slice(0, 5).map(({ name, data }) => (
          <div key={name} className="bg-white rounded-lg shadow-sm p-5 border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700">{name}</h3>
              <Package className="w-5 h-5 text-blue-600" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total</span>
                <span className="font-semibold">{data.total}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Available</span>
                <span className="font-semibold text-green-600">{data.available}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Borrowed</span>
                <span className="font-semibold text-orange-600">{data.borrowed}</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-3">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${data.total > 0 ? (data.available / data.total) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Status Badge */}
            {data.available === 0 && (
              <div className="mt-2 flex items-center gap-1 text-xs text-red-600">
                <AlertCircle className="w-3 h-3" />
                <span>Out of stock</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Additional Categories (if more than 5) */}
      {categories.length > 5 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {categories.slice(5).map(({ name, data }) => (
            <div key={name} className="bg-white rounded-lg shadow-sm p-5 border-l-4 border-gray-500">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-700">{name}</h3>
                <Package className="w-5 h-5 text-gray-600" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total</span>
                  <span className="font-semibold">{data.total}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Available</span>
                  <span className="font-semibold text-green-600">{data.available}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Borrowed</span>
                  <span className="font-semibold text-orange-600">{data.borrowed}</span>
                </div>
              </div>

              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gray-600 h-2 rounded-full transition-all"
                    style={{ width: `${data.total > 0 ? (data.available / data.total) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {data.available === 0 && (
                <div className="mt-2 flex items-center gap-1 text-xs text-red-600">
                  <AlertCircle className="w-3 h-3" />
                  <span>Out of stock</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Detailed Stock List */}
      {categories.map(({ name, data }) => (
        <div key={name} className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg mb-4">{name} - Detailed Stock Information</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Equipment Name</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">QR Code</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Total Stock</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Available</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Borrowed</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Condition</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map(item => (
                  <tr key={item.id} className={`border-b hover:bg-gray-50 ${item.status === 'Missing' ? 'bg-red-50' : ''}`}>
                    <td className="py-3 px-4 font-medium">{item.name}</td>
                    <td className="py-3 px-4">
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">{item.qrcode}</code>
                    </td>
                    <td className="py-3 px-4 font-semibold">{item.totalStock}</td>
                    <td className="py-3 px-4 font-semibold text-green-600">{item.availableStock}</td>
                    <td className="py-3 px-4 font-semibold text-orange-600">{item.borrowedStock}</td>
                    <td className="py-3 px-4">
                      {editingItem === item.id ? (
                        <div className="space-y-2">
                          <select
                            value={editCondition}
                            onChange={(e) => setEditCondition(e.target.value as any)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                          >
                            <option value="Excellent">Excellent</option>
                            <option value="Good">Good</option>
                            <option value="Fair">Fair</option>
                            <option value="Poor">Poor</option>
                            <option value="Damaged">Damaged</option>
                          </select>
                          <input
                            type="text"
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            placeholder="Condition notes..."
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                          />
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleUpdateCondition(item.id)}
                              className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingItem(null)}
                              className="px-2 py-1 bg-gray-400 text-white rounded text-xs hover:bg-gray-500"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 text-xs rounded border ${getConditionColor(item.qualityCondition)}`}>
                            {item.qualityCondition}
                          </span>
                          <button
                            onClick={() => {
                              setEditingItem(item.id);
                              setEditCondition(item.qualityCondition);
                              setEditNotes(item.conditionNotes || '');
                            }}
                            className="p-1 text-gray-600 hover:text-gray-800"
                            title="Edit condition"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                      {item.conditionNotes && editingItem !== item.id && (
                        <p className="text-xs text-gray-500 mt-1">{item.conditionNotes}</p>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        item.status === 'Available'
                          ? 'bg-green-100 text-green-700'
                          : item.status === 'Missing'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-orange-100 text-orange-700'
                      }`}>
                        {item.status}
                      </span>
                      {item.status === 'Missing' && item.markedMissingDate && (
                        <p className="text-xs text-gray-600 mt-1">Missing since: {item.markedMissingDate}</p>
                      )}
                      {item.borrowedBy && (
                        <p className="text-xs text-gray-600 mt-1">By: {item.borrowedBy}</p>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-1">
                        {item.status !== 'Missing' && (
                          <button
                            onClick={() => handleMarkAsMissing(item.id)}
                            className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors"
                          >
                            Mark Missing
                          </button>
                        )}
                        {item.status === 'Missing' && (
                          <button
                            onClick={() => handleMarkAsAvailable(item.id)}
                            className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors"
                          >
                            Mark Available
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* Overall Statistics */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg mb-4">Overall Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
            <Package className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl mb-1">{equipment.length}</p>
            <p className="text-sm text-gray-600">Equipment Types</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
            <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl mb-1">{equipment.reduce((sum, e) => sum + e.availableStock, 0)}</p>
            <p className="text-sm text-gray-600">Available Units</p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
            <TrendingDown className="w-8 h-8 text-orange-600 mx-auto mb-2" />
            <p className="text-2xl mb-1">{equipment.reduce((sum, e) => sum + e.borrowedStock, 0)}</p>
            <p className="text-sm text-gray-600">Borrowed Units</p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
            <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-2" />
            <p className="text-2xl mb-1">{equipment.filter(e => e.status === 'Missing').length}</p>
            <p className="text-sm text-gray-600">Missing Items</p>
          </div>
        </div>
      </div>

      {/* Add Equipment Modal */}
      {showAddModal && (
        <AddEquipmentModal
          onClose={() => setShowAddModal(false)}
          onAddEquipment={handleAddEquipment}
          existingEquipment={equipment}
        />
      )}
    </div>
  );
}
