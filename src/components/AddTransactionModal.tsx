import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, FileText, Check, X, Plus, Loader2, Upload } from 'lucide-react';
import { useStore } from '../lib/store';
import { cn } from '../lib/utils';
import { extractReceiptData } from '../services/ocrService';

export default function AddTransactionModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1); // 1: Capture, 2: Review, 3: Success
  const [isProcessing, setIsProcessing] = useState(false);
  const [type, setType] = useState<'Expense' | 'Income'>('Expense');
  const [mockData, setMockData] = useState({ storeName: '', amount: 0, category: 'Food', pocketId: '' });
  const [error, setError] = useState<string | null>(null);
  const [showBalanceWarning, setShowBalanceWarning] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const [isUsingCustom, setIsUsingCustom] = useState(false);
  const { addTransaction, categories, pockets, addCategory } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize pocketId and default category if not set
  React.useEffect(() => {
    if (!mockData.pocketId && pockets.length > 0) {
      setMockData(prev => ({ ...prev, pocketId: pockets[0].id }));
    }
    if (mockData.category === 'Food' && categories.length > 0 && !categories.some(c => c.name === 'Food')) {
      setMockData(prev => ({ ...prev, category: categories[0].name }));
    }
  }, [pockets, categories, mockData.pocketId, mockData.category]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        const data = await extractReceiptData(base64, file.type);
        
        setMockData({
          storeName: data.storeName,
          amount: Math.abs(data.amount),
          category: data.category,
          pocketId: pockets[0]?.id || ''
        });
        setType(data.type);
        setIsProcessing(false);
        setStep(2);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("OCR Error:", error);
      setIsProcessing(false);
      setError("Failed to scan receipt. Please try again or enter manually.");
    }
  };

  const handleScanClick = () => {
    fileInputRef.current?.click();
  };

  const handleSave = async (force = false) => {
    setError(null);
    if (!mockData.pocketId) {
      setError("Please select a pocket for this transaction.");
      return;
    }
    if (mockData.amount <= 0) {
      setError("Please enter a valid amount.");
      return;
    }
    if (!mockData.storeName) {
      setError("Please enter a store or source name.");
      return;
    }

    const finalCategory = type === 'Expense' ? (isUsingCustom ? customCategory.trim() : mockData.category) : '';
    if (type === 'Expense' && !finalCategory) {
      setError("Please select or enter a category.");
      return;
    }

    // Balance check for expenses
    if (type === 'Expense' && !force) {
      const selectedPocket = pockets.find(p => p.id === mockData.pocketId);
      if (selectedPocket && selectedPocket.currentBalance < mockData.amount) {
        setShowBalanceWarning(true);
        return;
      }
    }

    const finalAmount = type === 'Expense' ? -Math.abs(mockData.amount) : Math.abs(mockData.amount);
    
    // Save new category if it doesn't exist (only for expenses)
    if (type === 'Expense' && finalCategory) {
      const exists = categories.some(c => c.name.toLowerCase() === finalCategory.toLowerCase());
      if (!exists) {
        await addCategory({
          name: finalCategory,
          icon: '📁',
          budget: 0
        });
      }
    }

    addTransaction({ 
      ...mockData, 
      amount: finalAmount,
      category: finalCategory,
      date: new Date().toISOString(), 
      source: step === 2 && mockData.storeName !== '' ? 'OCR' : 'Manual',
      pocketId: mockData.pocketId
    });

    setStep(3);
    setShowBalanceWarning(false);
    setTimeout(() => {
      setIsOpen(false);
      setStep(1);
      setMockData({ storeName: '', amount: 0, category: categories[0]?.name || '', pocketId: pockets[0]?.id || '' });
      setType('Expense');
      setCustomCategory('');
      setIsUsingCustom(false);
    }, 1500);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-28 right-4 sm:right-6 w-14 h-14 sm:w-16 sm:h-16 bg-dq-green text-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-transform z-40"
      >
        <Plus className="w-7 h-7 sm:w-8 sm:h-8" />
      </button>

      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*" 
        onChange={handleFileChange}
      />

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />
            <motion.div 
              initial={{ y: "100%", opacity: 0 }} 
              animate={{ y: 0, opacity: 1 }} 
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-dq-card w-full max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] overflow-hidden relative z-10 p-6 sm:p-8 shadow-2xl border-t sm:border border-dq-border max-h-[92vh] overflow-y-auto"
            >
              <div className="w-12 h-1.5 bg-dq-bg rounded-full mx-auto mb-6 sm:hidden" />
              
              <button 
                onClick={() => setIsOpen(false)}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-dq-bg transition-colors hidden sm:block"
              >
                <X className="w-5 h-5 opacity-50 font-bold" />
              </button>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-bold border border-red-100 dark:border-red-900/30 flex items-center gap-2"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  {error}
                </motion.div>
              )}

              {step === 1 && (
                <div className="text-center space-y-6 pt-4">
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold tracking-tight text-dq-text">Log Transaction</h3>
                    <p className="text-sm opacity-60">Log your transactions to earn XP</p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <button 
                      onClick={handleScanClick} 
                      disabled={isProcessing}
                      className="flex items-center gap-4 p-5 rounded-2xl border-2 border-dashed border-dq-border hover:border-dq-green hover:bg-dq-green/5 transition-colors group"
                    >
                      <div className="w-12 h-12 rounded-xl bg-dq-green/10 flex items-center justify-center text-dq-green group-hover:scale-110 transition-transform">
                        {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : <Camera className="w-6 h-6" />}
                      </div>
                      <div className="text-left">
                        <span className="block text-base font-bold">Scan Receipt</span>
                        <span className="block text-xs opacity-50">AI-powered OCR extraction</span>
                      </div>
                    </button>
                    
                    <button 
                      onClick={() => setStep(2)} 
                      className="flex items-center gap-4 p-5 rounded-2xl border-2 border-dashed border-dq-border hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors group"
                    >
                      <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div className="text-left">
                        <span className="block text-base font-bold">Manual Entry</span>
                        <span className="block text-xs opacity-50">Enter details yourself</span>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6 pt-4">
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold text-dq-text">Review Details</h3>
                    <p className="text-sm opacity-60">Make sure everything is correct</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => setType('Expense')}
                      className={cn(
                        "py-3 rounded-xl font-bold text-sm border-2 transition-colors",
                        type === 'Expense' 
                          ? "bg-red-50 border-red-500 text-red-600 dark:bg-red-900/20" 
                          : "bg-dq-bg border-dq-border opacity-50"
                      )}
                    >
                      Expense
                    </button>
                    <button 
                      onClick={() => setType('Income')}
                      className={cn(
                        "py-3 rounded-xl font-bold text-sm border-2 transition-colors",
                        type === 'Income' 
                          ? "bg-green-50 border-dq-green text-dq-green dark:bg-dq-green/20" 
                          : "bg-dq-bg border-dq-border opacity-50"
                      )}
                    >
                      Income
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider opacity-50 ml-1">{type === 'Expense' ? 'Expense Description' : 'Income Description'}</label>
                      <input 
                        type="text" 
                        value={mockData.storeName} 
                        onChange={(e) => setMockData({...mockData, storeName: e.target.value})}
                        className="w-full p-4 rounded-2xl bg-dq-bg border border-dq-border focus:ring-2 ring-dq-green outline-none transition-colors text-dq-text"
                        placeholder="e.g. Starbucks or Salary"
                      />
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider opacity-50 ml-1">Amount (RM)</label>
                      <input 
                        type="number" 
                        value={mockData.amount || ''} 
                        onChange={(e) => setMockData({...mockData, amount: parseFloat(e.target.value) || 0})}
                        className={cn(
                          "w-full p-4 rounded-2xl bg-dq-bg border border-dq-border focus:ring-2 ring-dq-green outline-none text-2xl font-black transition-colors",
                          type === 'Expense' ? "text-red-500" : "text-dq-green"
                        )}
                        placeholder="0.00"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider opacity-50 ml-1">
                        {type === 'Expense' ? 'Deduct from Pocket' : 'Deposit to Pocket'}
                      </label>
                      {pockets.length > 0 ? (
                        <select 
                          value={mockData.pocketId}
                          onChange={(e) => setMockData({...mockData, pocketId: e.target.value})}
                          className="w-full p-4 rounded-2xl bg-dq-bg border border-dq-border focus:ring-2 ring-dq-green outline-none transition-all appearance-none font-bold text-dq-text"
                        >
                          {pockets.map(pocket => (
                            <option key={pocket.id} value={pocket.id}>{pocket.name} (RM {pocket.currentBalance.toLocaleString()})</option>
                          ))}
                        </select>
                      ) : (
                        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 text-red-600 dark:text-red-400 text-xs font-bold">
                          No pockets found. Please create a pocket first.
                        </div>
                      )}
                    </div>

                    {type === 'Expense' && (
                      <div className="space-y-3">
                        <label className="text-xs font-bold uppercase tracking-wider opacity-50 ml-1 block">Category</label>
                        
                        <div className="grid grid-cols-3 gap-2">
                          {categories.map(cat => cat.name).map(catName => (
                            <button 
                              key={catName}
                              type="button"
                              onClick={() => {
                                setMockData({ ...mockData, category: catName });
                                setIsUsingCustom(false);
                              }}
                              className={cn(
                                "py-2 px-1 rounded-xl text-[10px] font-black uppercase tracking-tight border-2 transition-colors",
                                !isUsingCustom && mockData.category === catName 
                                  ? "bg-dq-green/10 border-dq-green text-dq-green" 
                                  : "border-dq-border opacity-60"
                              )}
                            >
                              {catName}
                            </button>
                          ))}
                        </div>

                        <div className="relative group">
                          <input 
                            type="text" 
                            placeholder="Type your own category..."
                            value={customCategory}
                            onChange={(e) => {
                              setCustomCategory(e.target.value);
                              setIsUsingCustom(true);
                            }}
                            onFocus={() => setIsUsingCustom(true)}
                            className={cn(
                              "w-full p-4 rounded-2xl bg-dq-bg border transition-colors text-dq-text outline-none font-bold text-sm",
                              isUsingCustom ? "border-dq-green ring-2 ring-dq-green/20" : "border-dq-border"
                            )}
                          />
                          {isUsingCustom && (
                            <motion.div 
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-dq-green"
                            >
                              <Check className="w-5 h-5" />
                            </motion.div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-3 pt-2">
                    <button 
                      onClick={() => setStep(1)}
                      className="flex-1 py-4 rounded-2xl font-bold bg-dq-bg hover:bg-dq-border transition-colors text-dq-text"
                    >
                      Back
                    </button>
                    <button 
                      onClick={() => handleSave()} 
                      className="flex-[2] py-4 bg-dq-green text-white rounded-2xl font-bold shadow-md hover:bg-dq-green-dark transition-colors"
                    >
                      Confirm & Save
                    </button>
                  </div>
                </div>
              )}

              <AnimatePresence>
                {showBalanceWarning && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute inset-0 z-50 bg-dq-card p-8 flex flex-col items-center justify-center text-center space-y-6"
                  >
                    <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center text-amber-600 dark:text-amber-400">
                      <Plus className="w-10 h-10 rotate-45" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-xl font-bold text-dq-text">Insufficient Balance</h4>
                      <p className="text-sm opacity-60 text-dq-text-secondary">
                        You're trying to spend RM {mockData.amount.toFixed(2)}, but this pocket only has RM {pockets.find(p => p.id === mockData.pocketId)?.currentBalance.toFixed(2)}.
                      </p>
                    </div>
                    <div className="flex flex-col w-full gap-3">
                      <button 
                        onClick={() => handleSave(true)}
                        className="w-full py-4 bg-amber-500 text-white rounded-2xl font-bold shadow-md hover:bg-amber-600 transition-colors"
                      >
                        Proceed Anyway
                      </button>
                      <button 
                        onClick={() => setShowBalanceWarning(false)}
                        className="w-full py-4 bg-dq-bg rounded-2xl font-bold hover:bg-dq-border transition-colors text-dq-text"
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {step === 3 && (
                <div className="py-12 text-center space-y-6">
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-24 h-24 bg-dq-green rounded-full flex items-center justify-center mx-auto shadow-md"
                  >
                    <Check className="w-12 h-12 text-white font-bold" />
                  </motion.div>
                  <div className="space-y-2">
                    <h3 className="text-3xl font-black tracking-tight text-dq-text uppercase italic">Transaction Complete!</h3>
                    <p className="text-dq-green font-black text-xl">+10 XP Earned</p>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
