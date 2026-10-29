import React, { useState, useEffect } from 'react';
import { Boxes, Plus, AlertTriangle, ArrowUpDown, Filter, Search, CheckCircle2, X } from 'lucide-react';
import { apiService } from '../../services/api';
import { InventoryItem } from '../../types';
import { Badge } from '../../components/common/Badge';

export const InventoryPage: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [showItemModal, setShowItemModal] = useState(false);
  const [showTxModal, setShowTxModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  // Item form
  const [itemForm, setItemForm] = useState({
    item_code: '',
    name: '',
    category: 'Herbal Oil',
    batch_number: '',
    stock_quantity: 1000,
    unit: 'ml',
    reorder_threshold: 500,
    purchase_price: 600,
    selling_price: 850,
    expiry_date: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
    supplier_name: 'Kottakkal Arya Vaidya Sala',
    location: 'Main Pharmacy Shelf A-1',
  });

  // Tx form
  const [txForm, setTxForm] = useState({
    transaction_type: 'Usage',
    quantity: 100,
    reference_note: 'Daily therapy usage',
    created_by: 'Staff',
  });

  useEffect(() => {
    loadInventory();
  }, [selectedCategory, lowStockFilter]);

  const loadInventory = async () => {
    setLoading(true);
    try {
      const data = await apiService.getInventory({
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        low_stock_only: lowStockFilter,
      });
      setItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiService.createInventoryItem(itemForm);
      setShowItemModal(false);
      loadInventory();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to add inventory item.');
    }
  };

  const handleRecordTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    try {
      await apiService.logInventoryTransaction({
        item_id: selectedItem.id,
        ...txForm,
      });
      setShowTxModal(false);
      loadInventory();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to log inventory transaction.');
    }
  };

  const filteredItems = items.filter((it) =>
    it.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    it.item_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#244C3A]" style={{ fontFamily: 'Georgia, serif' }}>
            Herbal Dispensary & Inventory (Oushadha Bhandara)
          </h1>
          <p className="text-xs sm:text-sm text-[#73695E] mt-0.5">
            Ayurvedic tailams, churnams, kwathams, and disposable consumable stock tracking
          </p>
        </div>

        <button
          onClick={() => setShowItemModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#244C3A] hover:bg-[#1A382B] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus size={16} /> Add Inventory Item
        </button>
      </div>

      {/* Search & Category Filter Controls */}
      <div className="bg-white p-4 rounded-2xl border border-[#E5DFD3] flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#73695E]" size={16} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search herbal medicine or code..."
            className="w-full pl-10 pr-4 py-2 bg-[#FAF7EF] border border-[#E5DFD3] rounded-xl text-xs sm:text-sm text-[#40372D] focus:outline-none focus:border-[#244C3A]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-[#FAF7EF] border border-[#E5DFD3] rounded-xl text-xs sm:text-sm text-[#40372D] focus:outline-none"
          >
            <option value="All">All Categories</option>
            <option value="Herbal Oil">Herbal Oil (Taila)</option>
            <option value="Churnam">Churnam (Powder)</option>
            <option value="Kwatham">Kwatham (Decoction)</option>
            <option value="Consumable">Consumables & Linens</option>
          </select>

          <button
            onClick={() => setLowStockFilter(!lowStockFilter)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors flex items-center gap-1.5 cursor-pointer ${
              lowStockFilter
                ? 'bg-amber-100 border-amber-300 text-amber-900'
                : 'bg-[#FAF7EF] border-[#E5DFD3] text-[#73695E] hover:text-[#40372D]'
            }`}
          >
            <AlertTriangle size={14} className={lowStockFilter ? 'text-amber-700' : ''} />
            Low Stock Only
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-3xl border border-[#E5DFD3] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-[#FAF7EF] border-b border-[#E5DFD3] text-[#73695E] font-semibold">
              <tr>
                <th className="py-3.5 px-4">Item Code</th>
                <th className="py-3.5 px-4">Herbal Formulation Name</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Current Stock</th>
                <th className="py-3.5 px-4">Threshold</th>
                <th className="py-3.5 px-4">Expiry Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5DFD3]/60 text-[#40372D]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-[#73695E]">
                    Loading stock balances...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-[#73695E]">
                    No inventory records matching criteria.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isLow = item.stock_quantity <= item.reorder_threshold;
                  return (
                    <tr key={item.id} className="hover:bg-[#FAF7EF]/30 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#B99756]">
                        {item.item_code}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-[#244C3A] block">{item.name}</span>
                        <span className="text-[11px] text-[#73695E]">Batch: {item.batch_number} • {item.supplier_name}</span>
                      </td>
                      <td className="py-3.5 px-4 text-[#73695E]">{item.category}</td>
                      <td className="py-3.5 px-4">
                        <span className={`font-bold text-sm ${isLow ? 'text-amber-800' : 'text-[#40372D]'}`}>
                          {item.stock_quantity} {item.unit}
                        </span>
                        {isLow && (
                          <span className="block text-[10px] font-bold text-amber-700">
                            ⚠️ Reorder Alert
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-[#73695E]">
                        {item.reorder_threshold} {item.unit}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-[#73695E]">
                        {item.expiry_date}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedItem(item);
                            setShowTxModal(true);
                          }}
                          className="px-3 py-1.5 bg-[#FAF7EF] hover:bg-[#F5EFEB] border border-[#E5DFD3] rounded-xl text-xs font-semibold text-[#244C3A] transition-colors"
                        >
                          Adjust / Log Usage
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Stock / Log Usage Modal */}
      {showTxModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full border border-[#E5DFD3] shadow-2xl p-6">
            <h2 className="text-lg font-bold text-[#244C3A]" style={{ fontFamily: 'Georgia, serif' }}>
              Adjust Stock: {selectedItem.name}
            </h2>
            <p className="text-xs text-[#73695E] mt-0.5">
              Current Available: <strong>{selectedItem.stock_quantity} {selectedItem.unit}</strong>
            </p>

            <form onSubmit={handleRecordTransaction} className="mt-4 space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold mb-1">Adjustment Type</label>
                <select
                  value={txForm.transaction_type}
                  onChange={(e) => setTxForm({ ...txForm, transaction_type: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E5DFD3] rounded-xl"
                >
                  <option value="Usage">Clinical Usage (Deduct)</option>
                  <option value="Inward">New Stock Arrival (Add)</option>
                  <option value="Wastage">Wastage / Spillage (Deduct)</option>
                  <option value="Return">Supplier Return (Add)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Quantity ({selectedItem.unit}) *</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={txForm.quantity}
                  onChange={(e) => setTxForm({ ...txForm, quantity: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-[#E5DFD3] rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Reference Notes</label>
                <input
                  type="text"
                  value={txForm.reference_note}
                  onChange={(e) => setTxForm({ ...txForm, reference_note: e.target.value })}
                  placeholder="e.g. Dispensed for Shirodhara"
                  className="w-full px-3 py-2 border border-[#E5DFD3] rounded-xl"
                />
              </div>

              <div className="pt-3 border-t border-[#E5DFD3] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowTxModal(false)}
                  className="px-3 py-1.5 border border-[#E5DFD3] rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-1.5 bg-[#244C3A] text-white rounded-xl text-xs font-semibold shadow-xs"
                >
                  Apply Stock Change
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Item Modal */}
      {showItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-[#E5DFD3] shadow-2xl p-6 sm:p-8">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5DFD3]">
              <h2 className="text-xl font-bold text-[#244C3A]" style={{ fontFamily: 'Georgia, serif' }}>
                Add New Dispensary Formulation
              </h2>
              <button onClick={() => setShowItemModal(false)} className="text-[#73695E]">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateItem} className="mt-4 space-y-3 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Item Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. OIL-009"
                    value={itemForm.item_code}
                    onChange={(e) => setItemForm({ ...itemForm, item_code: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E5DFD3] rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Category</label>
                  <select
                    value={itemForm.category}
                    onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E5DFD3] rounded-xl"
                  >
                    <option value="Herbal Oil">Herbal Oil</option>
                    <option value="Churnam">Churnam</option>
                    <option value="Kwatham">Kwatham</option>
                    <option value="Consumable">Consumable</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Item Formulation Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dhanwantharam Kuzhampu"
                  value={itemForm.name}
                  onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E5DFD3] rounded-xl"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Batch Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="B-2026-X"
                    value={itemForm.batch_number}
                    onChange={(e) => setItemForm({ ...itemForm, batch_number: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E5DFD3] rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Initial Qty *</label>
                  <input
                    type="number"
                    value={itemForm.stock_quantity}
                    onChange={(e) => setItemForm({ ...itemForm, stock_quantity: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-[#E5DFD3] rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Unit</label>
                  <input
                    type="text"
                    value={itemForm.unit}
                    onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E5DFD3] rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Reorder Threshold</label>
                  <input
                    type="number"
                    value={itemForm.reorder_threshold}
                    onChange={(e) => setItemForm({ ...itemForm, reorder_threshold: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-[#E5DFD3] rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={itemForm.expiry_date}
                    onChange={(e) => setItemForm({ ...itemForm, expiry_date: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E5DFD3] rounded-xl"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#E5DFD3] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  className="px-4 py-2 border border-[#E5DFD3] rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#244C3A] text-white rounded-xl text-xs font-semibold shadow-xs"
                >
                  Add to Inventory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
