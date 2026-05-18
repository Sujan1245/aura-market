import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { Product } from '../services/aiService';
import { Plus, Trash2, Edit2, BarChart3, Package, Users, Settings, Save, X } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';

const mockSalesData = [
  { name: 'Mon', sales: 4000 },
  { name: 'Tue', sales: 3000 },
  { name: 'Wed', sales: 2000 },
  { name: 'Thu', sales: 2780 },
  { name: 'Fri', sales: 1890 },
  { name: 'Sat', sales: 2390 },
  { name: 'Sun', sales: 3490 },
];

export const Admin: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [view, setView] = useState<'stats' | 'products' | 'settings'>('stats');
    const [showAddModal, setShowAddModal] = useState(false);
    const [newItem, setNewItem] = useState<Partial<Product>>({
        name: '', price: 0, category: '', description: '', inventory: 10, imageUrl: ''
    });

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, 'products'), (snapshot) => {
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
            setProducts(items);
        });
        return unsubscribe;
    }, []);

    const handleAddProduct = async () => {
        try {
            await addDoc(collection(db, 'products'), {
                ...newItem,
                createdAt: serverTimestamp(),
                inventory: Number(newItem.inventory) || 0,
                price: Number(newItem.price) || 0,
                tags: newItem.category ? [newItem.category.toLowerCase()] : []
            });
            setShowAddModal(false);
            setNewItem({ name: '', price: 0, category: '', description: '', inventory: 10, imageUrl: '' });
            toast.success("Product added successfully");
        } catch (e: any) {
            toast.error("Error adding product: " + e.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure?")) return;
        try {
            await deleteDoc(doc(db, 'products', id));
            toast.success("Product deleted");
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    const seedProducts = async () => {
        const mockData = [
            { name: 'X-100 Vision Goggles', price: 1299, category: 'Vision', inventory: 5, description: 'Advanced AR goggles for industrial use.', imageUrl: 'https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac?w=800' },
            { name: 'Zenith Audio Pro', price: 449, category: 'Audio', inventory: 12, description: 'Lossless wireless audio experience.', imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800' },
            { name: 'Aura Smart Bracelet', price: 199, category: 'Wearables', inventory: 25, description: 'Health monitoring with AI insights.', imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800' },
            { name: 'Cyberpunk Runner S2', price: 299, category: 'Shoes', inventory: 8, description: 'Ergonomic design for urban speed.', imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800' }
        ];

        try {
            for (const item of mockData) {
                await addDoc(collection(db, 'products'), {
                    ...item,
                    createdAt: serverTimestamp(),
                    tags: [item.category.toLowerCase()]
                });
            }
            toast.success("Seed products created!");
        } catch (e: any) {
            toast.error("Seeding failed: " + e.message);
        }
    };

    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-gray-50">
            {/* Sidebar */}
            <aside className="w-64 border-r border-gray-200 bg-white flex flex-col h-full shadow-sm">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600">Admin Console</h2>
                </div>
                <div className="flex-1 p-4 flex flex-col gap-2">
                    <SidebarItem active={view === 'stats'} onClick={() => setView('stats')} icon={<BarChart3 size={18}/>} label="Analytics" />
                    <SidebarItem active={view === 'products'} onClick={() => setView('products')} icon={<Package size={18}/>} label="Catalog" />
                    <SidebarItem active={view === 'settings'} onClick={() => setView('settings')} icon={<Settings size={18}/>} label="Store Settings" />
                </div>
                <div className="p-4 bg-indigo-50/50 border-t border-indigo-100 mx-4 mb-8 rounded-2xl">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-[10px] font-bold text-indigo-900 uppercase tracking-widest">Firestore Connected</span>
                    </div>
                </div>
            </aside>

            <main className="flex-1 overflow-y-auto p-12">
                {view === 'stats' && (
                    <div className="space-y-12">
                        <header className="flex justify-between items-start">
                            <div>
                                <h1 className="text-4xl font-black tracking-tight text-slate-900 leading-none">Market Overview</h1>
                                <p className="text-slate-500 font-medium mt-3">Live system metrics and revenue performance</p>
                            </div>
                            <div className="flex gap-4">
                                <button 
                                    onClick={seedProducts}
                                    className="bg-white border border-indigo-100 text-indigo-600 px-6 py-2 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-indigo-50 transition-all"
                                >
                                    Seed Store
                                </button>
                                <StatCard label="Daily Revenue" value="$12,480" change="+12%" />
                                <StatCard label="Active Sessions" value="1,240" change="+5%" />
                            </div>
                        </header>

                        <div className="bg-slate-900 p-10 rounded-[40px] shadow-2xl shadow-indigo-200/20 text-white">
                            <div className="flex items-center justify-between mb-10">
                                <div>
                                    <h3 className="text-xl font-bold">Revenue Growth</h3>
                                    <p className="text-slate-400 text-xs font-medium uppercase tracking-widest mt-1">Real-time Data</p>
                                </div>
                                <div className="px-4 py-1.5 rounded-full bg-white/10 border border-white/10 text-[10px] font-bold uppercase tracking-widest">System Healthy</div>
                            </div>
                            <div className="h-[350px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={mockSalesData}>
                                        <defs>
                                            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b', fontWeight: 600}} dy={15} />
                                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b', fontWeight: 600}} />
                                        <Tooltip 
                                            contentStyle={{ borderRadius: '24px', border: 'none', background: '#fff', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', color: '#000' }}
                                            itemStyle={{ color: '#000', fontWeight: 'bold' }}
                                        />
                                        <Area type="monotone" dataKey="sales" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorSales)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )}

                {view === 'products' && (
                    <div className="space-y-8">
                        <div className="flex justify-between items-center">
                            <h2 className="text-3xl font-black tracking-tight text-slate-900">Product Catalog</h2>
                            <button 
                                onClick={() => setShowAddModal(true)}
                                className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-xl shadow-indigo-100 hover:scale-[1.02] transition-all"
                            >
                                <Plus size={20}/> New Release
                            </button>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {products.map(p => (
                                <div key={p.id} className="bg-white p-5 rounded-[24px] border border-gray-100 flex items-center justify-between group shadow-sm hover:shadow-md transition-all">
                                    <div className="flex items-center gap-6">
                                        <div className="h-16 w-16 rounded-[18px] bg-gray-50 overflow-hidden border border-gray-100">
                                            <img src={p.imageUrl} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900">{p.name}</h4>
                                            <div className="flex gap-4 mt-1">
                                                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{p.category}</span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">${p.price}</span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Stock: {p.inventory}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100">
                                        <button className="p-3 bg-gray-50 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-xl transition-colors"><Edit2 size={18}/></button>
                                        <button onClick={() => handleDelete(p.id)} className="p-3 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl transition-colors"><Trash2 size={18}/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>

            {/* Add Product Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 sm:p-20">
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }}
                            onClick={() => setShowAddModal(false)}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="relative bg-white w-full max-w-2xl rounded-[40px] p-12 overflow-y-auto max-h-[90vh] shadow-2xl"
                        >
                            <h2 className="text-3xl font-black tracking-tight mb-10 text-slate-900 leading-none">New Catalog Entry</h2>
                            <div className="grid grid-cols-2 gap-8">
                                <Input label="Product Name" value={newItem.name} onChange={v => setNewItem({...newItem, name: v})} />
                                <Input label="Category" value={newItem.category} placeholder="e.g. Audio, Vision, Wear" onChange={v => setNewItem({...newItem, category: v})} />
                                <Input label="Unit Price" type="number" value={newItem.price} onChange={v => setNewItem({...newItem, price: Number(v)})} />
                                <Input label="Inventory" type="number" value={newItem.inventory} onChange={v => setNewItem({...newItem, inventory: Number(v)})} />
                                <div className="col-span-2">
                                    <Input label="Direct Image URL" value={newItem.imageUrl} onChange={v => setNewItem({...newItem, imageUrl: v})} />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Product Description</label>
                                    <textarea 
                                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-5 min-h-[120px] outline-none focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all text-sm font-medium"
                                        value={newItem.description}
                                        onChange={e => setNewItem({...newItem, description: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-4 mt-12">
                                <button 
                                    onClick={handleAddProduct}
                                    className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-xl shadow-indigo-100 hover:shadow-indigo-200 transition-all hover:translate-y-[-2px]"
                                >
                                    Publish Product
                                </button>
                                <button 
                                    onClick={() => setShowAddModal(false)}
                                    className="px-10 py-4 bg-white border border-gray-200 rounded-2xl font-bold text-slate-600 hover:bg-gray-50 transition-all shadow-sm"
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

const SidebarItem: React.FC<{ active: boolean, icon: React.ReactNode, label: string, onClick: () => void }> = ({ active, icon, label, onClick }) => (
    <button 
        onClick={onClick}
        className={cn(
            "flex items-center gap-3 px-5 py-3.5 rounded-2xl text-sm font-bold transition-all",
            active ? "bg-indigo-600 text-white shadow-xl shadow-indigo-200" : "text-slate-400 hover:bg-gray-100 hover:text-slate-900"
        )}
    >
        {icon}
        {label}
    </button>
);

const StatCard: React.FC<{ label: string, value: string, change: string }> = ({ label, value, change }) => (
    <div className="bg-white px-8 py-5 rounded-[24px] border border-gray-100 min-w-[180px] shadow-sm">
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{label}</div>
        <div className="text-3xl font-black text-slate-900 leading-none">{value}</div>
        <div className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-green-50 text-green-600 text-[10px] font-black rounded-md mt-3">
             <span className="text-[8px]">▲</span> {change}
        </div>
    </div>
);

const Input: React.FC<{ label: string, value: any, onChange: (v: string) => void, type?: string, placeholder?: string }> = ({ label, value, onChange, type = 'text', placeholder }) => (
    <div>
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">{label}</label>
        <input 
            type={type}
            value={value}
            placeholder={placeholder}
            onChange={e => onChange(e.target.value)}
            className="w-full bg-gray-50 border-gray-100 border text-sm rounded-2xl py-3.5 px-5 outline-none focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all placeholder:text-gray-300"
        />
    </div>
);

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}
