import React, { useState, useEffect } from 'react';
import { Receipt, Plus, Printer, IndianRupee, CheckCircle2, Clock, X, User } from 'lucide-react';
import { apiService } from '../../services/api';
import { Invoice, Patient, Therapy } from '../../types';
import { Badge } from '../../components/common/Badge';
import { LotusLogo } from '../../components/common/LotusLogo';

export const BillingPage: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [therapies, setTherapies] = useState<Therapy[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('UPI');

  // New Invoice Form
  const [invForm, setInvForm] = useState({
    patient_id: undefined as number | undefined,
    discount: 0,
    payment_method: 'UPI',
    items: [
      {
        description: 'Shirodhara Session (Ksheerabala)',
        item_type: 'Therapy',
        quantity: 1,
        unit_price: 2500,
        total_price: 2500,
      },
    ],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [invs, pts, ths] = await Promise.all([
        apiService.getInvoices(),
        apiService.getPatients(),
        apiService.getTherapies(),
      ]);
      setInvoices(invs);
      setPatients(pts);
      setTherapies(ths);

      if (invs.length > 0) {
        setSelectedInvoice(invs[0]);
      }
      if (pts.length > 0 && !invForm.patient_id) {
        setInvForm((prev) => ({ ...prev, patient_id: pts[0].id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    setInvForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          description: 'Consultation / Therapy Item',
          item_type: 'Therapy',
          quantity: 1,
          unit_price: 1500,
          total_price: 1500,
        },
      ],
    }));
  };

  const handleRemoveItem = (index: number) => {
    setInvForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    const subtotal = invForm.items.reduce((acc, it) => acc + it.total_price, 0);
    const tax = Math.round(subtotal * 0.05); // 5% GST
    const total = subtotal - invForm.discount + tax;

    try {
      await apiService.createInvoice({
        patient_id: invForm.patient_id,
        subtotal,
        discount: invForm.discount,
        tax_amount: tax,
        total_amount: total,
        paid_amount: 0,
        payment_status: 'Pending',
        payment_method: invForm.payment_method,
        items: invForm.items,
      });
      setShowCreateModal(false);
      loadData();
    } catch (err) {
      alert('Failed to generate invoice.');
    }
  };

  const handleSettlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    try {
      await apiService.payInvoice(selectedInvoice.id, paymentAmount, paymentMethod);
      setShowPayModal(false);
      loadData();
    } catch (err) {
      alert('Failed to process payment.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#244C3A]" style={{ fontFamily: 'Georgia, serif' }}>
            Billing & Invoices (Dhana Lekha)
          </h1>
          <p className="text-xs sm:text-sm text-[#73695E] mt-0.5">
            Transparent therapy invoicing, itemized medicine receipts, and payment settlements
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#244C3A] hover:bg-[#1A382B] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus size={16} /> Generate Invoice
        </button>
      </div>

      {/* Two Column Layout: Invoices List vs Printable Invoice Sheet */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Invoices List */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-[#244C3A] uppercase tracking-wider">
            Invoices ({invoices.length})
          </h2>

          <div className="space-y-3">
            {invoices.map((inv) => {
              const isSelected = selectedInvoice?.id === inv.id;
              return (
                <div
                  key={inv.id}
                  onClick={() => setSelectedInvoice(inv)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white border-[#244C3A] shadow-md ring-1 ring-[#244C3A]'
                      : 'bg-white/80 border-[#E5DFD3] hover:border-[#244C3A]/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs font-bold text-[#B99756]">{inv.invoice_number}</span>
                    <Badge variant="payment">{inv.payment_status}</Badge>
                  </div>
                  <h3 className="font-bold text-[#244C3A] text-sm leading-tight">
                    ₹{inv.total_amount.toLocaleString('en-IN')}
                  </h3>
                  <p className="text-xs text-[#40372D] font-medium mt-1">
                    Patient: {inv.patient?.full_name}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-[#73695E] mt-2">
                    <span>{inv.invoice_date}</span>
                    <span>Paid: ₹{inv.paid_amount.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Printable Invoice Sheet */}
        <div className="lg:col-span-2">
          {selectedInvoice ? (
            <div className="bg-white p-6 sm:p-10 rounded-3xl border border-[#E5DFD3] shadow-md space-y-6 relative print:border-none print:shadow-none">
              <div className="flex items-center justify-between border-b border-[#E5DFD3] pb-4">
                <LotusLogo size={46} subtitle="Ayurvedic Hospital & Treatment Center" />
                <div className="flex items-center gap-2 print:hidden">
                  {selectedInvoice.payment_status !== 'Paid' && (
                    <button
                      onClick={() => {
                        setPaymentAmount(selectedInvoice.total_amount - selectedInvoice.paid_amount);
                        setShowPayModal(true);
                      }}
                      className="px-3.5 py-1.5 bg-emerald-700 text-white text-xs font-semibold rounded-xl hover:bg-emerald-800 transition-colors shadow-xs"
                    >
                      Record Payment
                    </button>
                  )}
                  <button
                    onClick={handlePrint}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF7EF] border border-[#B99756] text-[#8F6F33] text-xs font-semibold rounded-xl hover:bg-[#F5EFEB] transition-colors"
                  >
                    <Printer size={15} /> Print Invoice
                  </button>
                </div>
              </div>

              {/* Invoice Meta */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-[#FAF7EF] border border-[#E5DFD3]/60 text-xs">
                <div>
                  <span className="text-[#73695E] block">Invoice Number:</span>
                  <span className="font-mono font-bold text-[#244C3A]">{selectedInvoice.invoice_number}</span>
                </div>
                <div>
                  <span className="text-[#73695E] block">Date:</span>
                  <span className="font-semibold text-[#40372D]">{selectedInvoice.invoice_date}</span>
                </div>
                <div>
                  <span className="text-[#73695E] block">Patient:</span>
                  <span className="font-bold text-[#244C3A]">{selectedInvoice.patient?.full_name}</span>
                </div>
                <div>
                  <span className="text-[#73695E] block">Payment Status:</span>
                  <Badge variant="payment">{selectedInvoice.payment_status}</Badge>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="border border-[#E5DFD3] rounded-2xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-[#FAF7EF] border-b border-[#E5DFD3] text-[#73695E] font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Service / Therapy Item</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Qty</th>
                      <th className="py-2.5 px-3">Rate</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5DFD3]/60 text-[#40372D]">
                    {selectedInvoice.items?.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 px-3 font-semibold text-[#244C3A]">{item.description}</td>
                        <td className="py-2.5 px-3 text-[#73695E]">{item.item_type}</td>
                        <td className="py-2.5 px-3">{item.quantity}</td>
                        <td className="py-2.5 px-3">₹{item.unit_price}</td>
                        <td className="py-2.5 px-3 text-right font-bold">₹{item.total_price}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary Totals */}
              <div className="flex justify-end text-xs">
                <div className="w-64 space-y-2 p-4 rounded-2xl bg-[#FAF7EF] border border-[#E5DFD3]/60">
                  <div className="flex justify-between text-[#73695E]">
                    <span>Subtotal:</span>
                    <span>₹{selectedInvoice.subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  {selectedInvoice.discount > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Discount:</span>
                      <span>-₹{selectedInvoice.discount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[#73695E]">
                    <span>GST (5%):</span>
                    <span>₹{selectedInvoice.tax_amount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="pt-2 border-t border-[#E5DFD3] flex justify-between font-bold text-sm text-[#244C3A]">
                    <span>Total Amount:</span>
                    <span>₹{selectedInvoice.total_amount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-xs text-[#73695E]">
                    <span>Paid Amount:</span>
                    <span className="font-semibold text-emerald-800">
                      ₹{selectedInvoice.paid_amount.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-[#E5DFD3] text-center text-[11px] text-[#73695E]">
                Thank you for choosing AyurSutra. May your health and vitality be fully restored.
              </div>
            </div>
          ) : (
            <p className="text-center py-12 text-xs text-[#73695E]">Select an invoice to preview.</p>
          )}
        </div>
      </div>

      {/* Payment Settlement Modal */}
      {showPayModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full border border-[#E5DFD3] shadow-2xl p-6">
            <h2 className="text-lg font-bold text-[#244C3A]" style={{ fontFamily: 'Georgia, serif' }}>
              Record Payment Settlement
            </h2>
            <form onSubmit={handleSettlePayment} className="mt-4 space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold mb-1">Settlement Amount (INR) *</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-[#E5DFD3] rounded-xl font-bold"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E5DFD3] rounded-xl"
                >
                  <option value="UPI">UPI / GPay / PhonePe</option>
                  <option value="Cash">Cash at Counter</option>
                  <option value="Card">Credit / Debit Card</option>
                  <option value="Net Banking">Net Banking</option>
                </select>
              </div>

              <div className="pt-3 border-t border-[#E5DFD3] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="px-3 py-1.5 border border-[#E5DFD3] rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-1.5 bg-[#244C3A] text-white rounded-xl text-xs font-semibold"
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Invoice Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-[#E5DFD3] shadow-2xl p-6 sm:p-8">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5DFD3]">
              <h2 className="text-xl font-bold text-[#244C3A]" style={{ fontFamily: 'Georgia, serif' }}>
                Create Clinical Invoice
              </h2>
              <button onClick={() => setShowCreateModal(false)} className="text-[#73695E]">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="mt-4 space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold mb-1">Select Patient *</label>
                <select
                  value={invForm.patient_id}
                  onChange={(e) => setInvForm({ ...invForm, patient_id: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-[#E5DFD3] rounded-xl focus:border-[#244C3A]"
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>{p.full_name} ({p.patient_id})</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block font-semibold">Billable Line Items</label>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs font-bold text-[#B99756] hover:underline"
                  >
                    + Add Item
                  </button>
                </div>
                {invForm.items.map((it, idx) => (
                  <div key={idx} className="p-3 mb-2 rounded-xl bg-[#FAF7EF] border border-[#E5DFD3] space-y-2">
                    <input
                      type="text"
                      placeholder="Description (e.g. Abhyanga Session)"
                      value={it.description}
                      onChange={(e) => {
                        const updated = [...invForm.items];
                        updated[idx].description = e.target.value;
                        setInvForm({ ...invForm, items: updated });
                      }}
                      className="w-full px-2.5 py-1.5 bg-white border border-[#E5DFD3] rounded-lg"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="Price (INR)"
                        value={it.unit_price}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          const updated = [...invForm.items];
                          updated[idx].unit_price = val;
                          updated[idx].total_price = val * updated[idx].quantity;
                          setInvForm({ ...invForm, items: updated });
                        }}
                        className="px-2.5 py-1.5 bg-white border border-[#E5DFD3] rounded-lg font-bold"
                      />
                      {invForm.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="text-rose-600 font-semibold text-right"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-[#E5DFD3] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-[#E5DFD3] rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#244C3A] text-white rounded-xl text-xs font-semibold shadow-xs"
                >
                  Issue Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
