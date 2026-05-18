import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { Admin } from './pages/Admin';
import { Toaster, toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag } from 'lucide-react';
import { db } from './lib/firebase';
import { collection, getDocs, query, where, documentId, onSnapshot } from 'firebase/firestore';
import { Product, aiService } from './services/aiService';
import { ChatBot } from './components/ChatBot';
import { ProductCard } from './components/ProductCard';

const SearchResults: React.FC<{ ids: string[] }> = ({ ids }) => {
    const [products, setProducts] = useState<Product[]>([]);
    
    useEffect(() => {
        if (ids.length === 0) return;
        const q = query(collection(db, 'products'), where(documentId(), 'in', ids));
        getDocs(q).then(snap => {
            const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
            setProducts(items);
        });
    }, [ids]);

    return (
        <>
            {products.map(product => (
                <ProductCard key={product.id} product={product} />
            ))}
        </>
    );
};

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');

  return (
    <AuthProvider>
      <AppContent currentPage={currentPage} setCurrentPage={setCurrentPage} />
    </AuthProvider>
  );
}

function AppContent({ currentPage, setCurrentPage }: { currentPage: string, setCurrentPage: (p: string) => void }) {
  const { user } = useAuth();

    const [searchQuery, setSearchQuery] = useState('');
  const [searchLocalIds, setSearchLocalIds] = useState<string[]>([]);
  const [discoveredResults, setDiscoveredResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);
  const [globalProducts, setGlobalProducts] = useState<Product[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'products'), (snap) => {
        const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        setGlobalProducts(items);
    });
    return unsub;
  }, []);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setCurrentPage('search');
    setSearching(true);
    setSearchLocalIds([]);
    setDiscoveredResults([]);
    try {
        // Fetch products to search through
        const q = collection(db, 'products');
        const snapshot = await getDocs(q);
        const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        const { localIds, discovered } = await aiService.searchProducts(query, products);
        setSearchLocalIds(localIds);
        setDiscoveredResults(discovered);
    } catch (e) {
        toast.error("Search failed");
    } finally {
        setSearching(false);
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home />;
      case 'admin':
        return <Admin />;
      case 'search':
        return (
            <div className="max-w-7xl mx-auto py-20 px-8">
                <div className="mb-12">
                    <h2 className="text-sm font-black uppercase tracking-[0.3em] text-indigo-600 mb-2">Shopping Vision</h2>
                    <h1 className="text-4xl font-black tracking-tighter text-slate-900">"{searchQuery}"</h1>
                </div>

                {searching ? (
                    <div className="flex justify-center py-24">
                         <div className="flex flex-col items-center gap-6">
                            <div className="h-12 w-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                            <p className="text-xs font-black text-indigo-600 uppercase tracking-widest animate-pulse">Consulting Global Catalog...</p>
                         </div>
                    </div>
                ) : (searchLocalIds.length === 0 && discoveredResults.length === 0) ? (
                    <div className="text-center py-24 bg-white rounded-[40px] border border-gray-100 shadow-sm">
                        <p className="text-slate-400 font-bold">No results found in any catalog. Try a different keyword.</p>
                    </div>
                ) : (
                    <div className="space-y-12">
                        {searchLocalIds.length > 0 && (
                            <div className="bg-white rounded-sm shadow-sm border border-gray-100 overflow-hidden">
                                <div className="p-4 border-b border-gray-100">
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Store Catalog</h3>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 p-0 bg-gray-100 gap-[1px]">
                                    <SearchResults ids={searchLocalIds} />
                                </div>
                            </div>
                        )}
                        
                        {discoveredResults.length > 0 && (
                            <div className="bg-white rounded-sm shadow-sm border border-gray-100 overflow-hidden">
                                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-sm font-bold uppercase tracking-widest text-blue-600">Global Discoveries</h3>
                                        <div className="px-1.5 py-0.5 bg-blue-50 text-[10px] font-black text-blue-600 rounded-sm border border-blue-100">AI</div>
                                    </div>
                                    <span className="text-[10px] text-gray-400 font-bold">Powered by Gemini</span>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 p-0 bg-gray-100 gap-[1px]">
                                    {discoveredResults.map((product, idx) => (
                                        <ProductCard key={`discovered-${idx}`} product={product} isMatch />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
      case 'cart':
        return (
          <div className="flex flex-col items-center justify-center min-h-[70vh] p-10">
            <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-[32px] flex items-center justify-center mb-8">
                <ShoppingBag size={48} />
            </div>
            <h2 className="text-4xl font-black tracking-tight text-slate-900 mb-4">Cart is Empty</h2>
            <p className="text-slate-500 mb-10 max-w-sm text-center font-medium leading-relaxed">
              Your collection awaits. Gemini is ready to curate the perfect items as you explore.
            </p>
            <button onClick={() => setCurrentPage('home')} className="bg-indigo-600 text-white px-12 py-4 rounded-2xl font-bold uppercase text-[11px] tracking-[0.2em] shadow-xl shadow-indigo-100 hover:scale-105 transition-all">
              Discover Products
            </button>
          </div>
        );
      case 'profile':
        return (
          <div className="max-w-2xl mx-auto py-24 px-6">
            <h2 className="text-4xl font-black tracking-tighter mb-12 text-slate-900">Account</h2>
            <div className="bg-white border border-gray-100 p-12 rounded-[40px] shadow-sm relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-[100%] z-0" />
               <div className="relative z-10 flex flex-col items-center">
                  <div className="h-24 w-24 rounded-[32px] bg-slate-900 mb-6 flex items-center justify-center text-white text-3xl font-black">
                     {user?.displayName?.[0] || 'A'}
                  </div>
                  <div className="text-center">
                     <div className="text-[10px] uppercase font-black tracking-[0.3em] text-indigo-600 mb-2">Member Status</div>
                     <div className="text-2xl font-bold text-slate-900">Secure AI Session</div>
                     <p className="text-slate-400 text-sm mt-1 font-medium italic">{user?.email}</p>
                  </div>
                  <div className="w-full h-px bg-gray-100 my-10" />
                  <div className="bg-slate-50 p-6 rounded-2xl w-full text-center">
                    <p className="text-slate-600 text-sm font-medium italic leading-relaxed">
                      "AuraEngine is currently learning from your browsing patterns to optimize matching accuracy."
                    </p>
                  </div>
               </div>
            </div>
          </div>
        );
      default:
        return <Home />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-slate-800 selection:bg-indigo-600 selection:text-white antialiased">
        <Toaster position="bottom-right" toastOptions={{
          style: {
            background: '#fff',
            color: '#1e293b',
            borderRadius: '20px',
            fontSize: '13px',
            fontWeight: '700',
            padding: '16px 24px',
            border: '1px solid #f1f5f9',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
          }
        }} />
        <Navbar 
          currentPage={currentPage} 
          onPageChange={setCurrentPage} 
          onImageSearch={() => setCurrentPage('home')} 
          onSearch={handleSearch}
        />
        <main>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              {renderPage()}
            </motion.div>
          </AnimatePresence>
        </main>
        
        <ChatBot contextProducts={globalProducts} />

        <footer className="py-24 border-t border-gray-200 mt-24 bg-white">
            <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 md:grid-cols-4 gap-16">
                <div className="col-span-2">
                    <div className="font-black text-3xl tracking-tighter text-slate-900 mb-8 flex items-center gap-2">
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg" /> AuraMarket
                    </div>
                    <p className="text-slate-500 max-w-sm leading-relaxed font-medium">
                        Redefining the digital marketplace through intelligent curation and artistic precision. 
                        Powered by Gemini AI for a shopping experience like no other.
                    </p>
                </div>
                <div>
                   <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-8">Platform</h4>
                   <ul className="space-y-4 text-sm font-bold text-slate-600">
                      <li className="hover:text-indigo-600 cursor-pointer transition-colors">Catalog</li>
                      <li className="hover:text-indigo-600 cursor-pointer transition-colors">Smart Picks</li>
                      <li className="hover:text-indigo-600 cursor-pointer transition-colors">Vision Lab</li>
                   </ul>
                </div>
                <div>
                   <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-8">Company</h4>
                   <ul className="space-y-4 text-sm font-bold text-slate-600">
                      <li className="hover:text-indigo-600 cursor-pointer transition-colors">Privacy</li>
                      <li className="hover:text-indigo-600 cursor-pointer transition-colors">Terms</li>
                      <li className="hover:text-indigo-600 cursor-pointer transition-colors">Systems</li>
                   </ul>
                </div>
            </div>
            <div className="max-w-7xl mx-auto px-8 mt-24 pt-10 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="flex gap-4 items-center">
                    <span className="text-[10px] font-black text-indigo-600 px-3 py-1 bg-indigo-50 rounded-full uppercase tracking-widest">Chrome Web</span>
                    <p className="text-xs font-bold text-slate-400">© 2026 AuraMarket Systems.</p>
                </div>
                <div className="flex gap-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <span>Android 14</span>
                    <span className="opacity-30">|</span>
                    <span>iOS 17.2</span>
                </div>
            </div>
        </footer>
    </div>
  );
}
