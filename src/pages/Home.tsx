import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight, Camera, X, ShoppingBag } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, limit, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { Product, aiService } from '../services/aiService';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../lib/utils';
import toast from 'react-hot-toast';
import { ProductCard } from '../components/ProductCard';

export const Home: React.FC = () => {
    const { user } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [trendingProducts, setTrendingProducts] = useState<Product[]>([
        { id: 'f1', name: 'Premium Audio Max', price: 549, category: 'Electronics', imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800', description: 'High fidelity audio.', inventory: 10, tags: ['electronics'] },
        { id: 'f2', name: 'Aura Smart Watch', price: 299, category: 'Wearables', imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800', description: 'Track your health.', inventory: 5, tags: ['wearables'] }
    ]);
    const [recommendedIds, setRecommendedIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [imageSearchMode, setImageSearchMode] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);

    const [baseProducts, setBaseProducts] = useState<Product[]>([]);
    const [loadingTrending, setLoadingTrending] = useState(true);

    useEffect(() => {
        const q = query(collection(db, 'products'), limit(20));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
            setProducts(items);
            setLoading(false);
        }, (err) => {
            console.error("Firestore error:", err);
            setLoading(false);
        });

        // Fetch trending as initial feed / fallback
        aiService.getTrending().then(items => {
            setTrendingProducts(items);
            setLoadingTrending(false);
        }).catch(err => {
            console.error("Trending fetch error:", err);
            setLoadingTrending(false);
            // Fallback hardcoded data if API fails
            setTrendingProducts([
                { id: 'f1', name: 'Premium Wireless Headphones', price: 299, category: 'Electronics', imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800', description: 'High fidelity audio.', inventory: 10, tags: ['electronics'] },
                { id: 'f2', name: 'Smart Fitness Watch', price: 199, category: 'Wearables', imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800', description: 'Track your health.', inventory: 5, tags: ['wearables'] },
                { id: 'f3', name: 'Minimalist Leather Wallet', price: 49, category: 'Fashion', imageUrl: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800', description: 'Sleek design.', inventory: 15, tags: ['fashion'] },
                { id: 'f4', name: 'Portable Bluetooth Speaker', price: 89, category: 'Audio', imageUrl: 'https://images.unsplash.com/photo-1608156639585-34052e81c968?w=800', description: 'Massive sound.', inventory: 8, tags: ['audio'] }
            ]);
        });

        return unsubscribe;
    }, []);

    useEffect(() => {
        const base = products.length > 0 ? products : trendingProducts;
        setBaseProducts(base);
    }, [products, trendingProducts]);

    const fetchRecommendations = async () => {
        if (!user || baseProducts.length === 0) return;
        try {
            const mockActivity = [
                { action: 'view', productId: baseProducts[0]?.id },
                { action: 'view', productId: baseProducts[1]?.id }
            ];
            const ids = await aiService.getRecommendations(mockActivity, baseProducts);
            setRecommendedIds(ids);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        if (baseProducts.length > 0 && user) {
            fetchRecommendations();
        }
    }, [baseProducts, user]);

    const seedSampleData = async () => {
        const samples = [
            { name: 'X-100 Vision Goggles', price: 1299, category: 'Vision', inventory: 5, description: 'Advanced AR goggles.', imageUrl: 'https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac?w=800' },
            { name: 'Zenith Audio Pro', price: 449, category: 'Audio', inventory: 12, description: 'Lossless audio.', imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800' },
            { name: 'Aura Smart Bracelet', price: 199, category: 'Wearables', inventory: 25, description: 'Health monitoring.', imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800' }
        ];
        try {
            for (const s of samples) {
                await addDoc(collection(db, 'products'), { ...s, createdAt: serverTimestamp(), tags: [s.category.toLowerCase()] });
            }
            toast.success("Successfully added sample products!");
        } catch (e) {
            toast.error("Failed to add samples");
        }
    };

    const trackActivity = async (productId: string, action: 'view' | 'add_to_cart') => {
        if (!user) return;
        try {
            await addDoc(collection(db, 'userActivity'), {
                userId: user.uid,
                productId,
                action,
                timestamp: serverTimestamp()
            });
        } catch (e) {
            console.error(e);
        }
    };

    const [visionResults, setVisionResults] = useState<{ localIds: string[], discovered: Product[] } | null>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64String = reader.result as string;
            setAnalyzing(true);
            setVisionResults(null);
            try {
                const results = await aiService.analyzeImage(base64String, products);
                setRecommendedIds(results.localIds);
                setVisionResults(results);
                toast.success("AI identified matching products!");
                setImageSearchMode(false);
            } catch (e) {
                toast.error("Failed to analyze image");
            } finally {
                setAnalyzing(false);
            }
        };
        reader.readAsDataURL(file);
    };

    const safeRecommendedIds = Array.isArray(recommendedIds) ? recommendedIds : [];
    const recommendedProducts = baseProducts.filter(p => safeRecommendedIds.includes(p.id));
    const otherProducts = baseProducts.filter(p => !safeRecommendedIds.includes(p.id));

    const categories = [
        { name: 'Grocery', icon: '🛒' },
        { name: 'Mobiles', icon: '📱' },
        { name: 'Fashion', icon: '👗' },
        { name: 'Electronics', icon: '💻' },
        { name: 'Home', icon: '🏠' },
        { name: 'Appliances', icon: '🧺' },
        { name: 'Travel', icon: '✈️' },
        { name: 'Top Offers', icon: '🔥' },
        { name: 'Beauty, Toys & More', icon: '🧸' },
        { name: 'Two Wheelers', icon: '🛵' }
    ];

    const [showVision, setShowVision] = useState(false);

    return (
        <div className="min-h-screen bg-[#f1f3f6]">
            {/* Floating Vision Button */}
            <motion.button 
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                onClick={() => setShowVision(true)}
                className="fixed bottom-6 right-6 z-50 bg-blue-600 text-white w-16 h-16 rounded-full shadow-2xl flex items-center justify-center hover:bg-blue-700 transition-all border-4 border-white"
            >
                <Camera className="w-8 h-8" />
            </motion.button>

            <AnimatePresence>
                {showVision && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-4"
                    >
                        <button 
                            onClick={() => setShowVision(false)}
                            className="absolute top-6 right-6 text-white bg-white/20 p-2 rounded-full hover:bg-white/40"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        
                        <div className="w-full max-w-md aspect-[9/16] border-2 border-dashed border-white/50 rounded-2xl relative overflow-hidden flex flex-col items-center justify-center bg-gray-900 shadow-2xl">
                            <div className="absolute top-0 w-full h-1 bg-blue-500 shadow-[0_0_15px_blue] animate-[scan_2s_infinite_linear]" />
                            <Camera className="w-16 h-16 text-white/30 mb-4" />
                            <p className="text-white/70 text-sm font-medium text-center px-12 italic tracking-tight font-serif">"Aura Lens" identifying textures, patterns and brands...</p>
                            <p className="text-blue-400/50 text-[10px] font-black uppercase tracking-[0.2em] mt-2">Neural Engine Initialized</p>
                            
                            <input 
                                type="file" 
                                accept="image/*" 
                                capture="environment" 
                                onChange={(e) => {
                                    handleImageUpload(e);
                                    setShowVision(false);
                                }}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                            
                            <div className="absolute bottom-12 flex flex-col items-center gap-2">
                                <div className="w-16 h-16 border-4 border-white rounded-full flex items-center justify-center">
                                    <div className="w-12 h-12 bg-white rounded-full" />
                                </div>
                                <span className="text-white text-xs font-bold uppercase tracking-widest">Tap to Scan</span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                @keyframes scan {
                    0% { top: 0; }
                    100% { top: 100%; }
                }
            `}</style>
            {/* Category Bar */}
            <div className="bg-white shadow-sm border-b border-gray-100 overflow-x-auto">
                <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3 flex justify-between gap-8 min-w-max">
                    {categories.map((cat, idx) => (
                        <div key={idx} className="flex flex-col items-center gap-1 cursor-pointer group">
                            <div className="text-2xl group-hover:scale-110 transition-transform">{cat.icon}</div>
                            <span className="text-[12px] font-bold text-slate-700 group-hover:text-blue-600 truncate">{cat.name}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Live Ticker */}
            <div className="bg-slate-900 border-y border-white/10 overflow-hidden h-10 flex items-center">
                <div className="flex whitespace-nowrap animate-[marquee_30s_linear_infinite] gap-12">
                    {[1,2,3,4,5].map(i => (
                        <div key={i} className="flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                             <span className="text-[10px] font-black text-white italic tracking-wider uppercase">Live: AuraLens detected new {i%2 === 0 ? 'Streetwear' : 'Tech'} trend across 42 sources</span>
                        </div>
                    ))}
                </div>
            </div>

            <style>{`
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
            `}</style>

            {/* Banner Slider Placeholder */}
            <div className="max-w-7xl mx-auto mt-2 px-2 sm:px-4">
                <div className="h-48 sm:h-64 bg-blue-100 rounded-sm overflow-hidden relative border border-gray-200">
                    <img 
                        src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1600" 
                        alt="Summer Sale" 
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent flex flex-col justify-center px-12">
                        <h2 className="text-3xl sm:text-5xl font-black text-white italic leading-tight">SUMMER <br/> REVOLUTION</h2>
                        <button className="mt-6 bg-white text-blue-600 px-6 py-2 rounded-sm font-bold text-sm w-fit hover:bg-gray-100 uppercase tracking-widest shadow-xl">Shop Now</button>
                    </div>
                </div>
            </div>

            {/* Recommendations Section */}
            {recommendedProducts.length > 0 && (
                <section className="bg-white mt-4 border-y border-gray-100 max-w-7xl mx-auto">
                    <div className="p-4 sm:p-6 flex justify-between items-center border-b border-gray-100">
                        <div className="flex items-center gap-2">
                             <h2 className="text-xl font-bold tracking-tight text-slate-900">Recommended for You</h2>
                             {visionResults && <span className="bg-blue-600 text-[10px] text-white px-2 py-0.5 rounded-full font-black animate-pulse">VISION MATCH</span>}
                        </div>
                        <button className="bg-blue-600 text-white px-4 py-1.5 rounded-sm text-xs font-bold uppercase shadow-md leading-none">View All</button>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 p-0">
                        {recommendedProducts.map(product => (
                            <ProductCard key={product.id} product={product} isMatch />
                        ))}
                    </div>
                </section>
            )}

            {/* Vision Discovered Section */}
            {visionResults && visionResults.discovered.length > 0 && (
                <section className="bg-white mt-4 border-y border-gray-100 max-w-7xl mx-auto">
                    <div className="p-4 sm:p-6 flex justify-between items-center border-b border-blue-100 bg-blue-50/30">
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl font-bold tracking-tight text-blue-900 italic">Discovered in Vision</h2>
                            <Sparkles className="text-blue-500 w-5 h-5" />
                        </div>
                        <button onClick={() => setVisionResults(null)} className="text-blue-400 hover:text-blue-600"><X className="w-5 h-5"/></button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 p-0 bg-gray-100 gap-[1px]">
                        {visionResults.discovered.map((product, idx) => (
                            <ProductCard key={`vision-${idx}`} product={product} isMatch />
                        ))}
                    </div>
                </section>
            )}

            {/* Product Feed */}
            <section className="bg-white mt-4 border-y border-gray-100 max-w-7xl mx-auto mb-12">
                <div className="p-4 sm:p-6 flex justify-between items-center border-b border-gray-100">
                    <h2 className="text-xl font-bold tracking-tight text-slate-900">
                        {products.length > 0 ? "Trending Arrivals" : "AI Discovered Collections"}
                    </h2>
                    <div className="flex gap-2">
                        {products.length === 0 && (
                            <button 
                                onClick={seedSampleData}
                                className="text-blue-600 px-3 py-1.5 rounded-sm text-xs font-bold uppercase hover:bg-blue-50 transition-colors"
                            >
                                Populate Catalog
                            </button>
                        )}
                        <button className="bg-blue-600 text-white px-4 py-1.5 rounded-sm text-xs font-bold uppercase shadow-md leading-none">Explore</button>
                    </div>
                </div>
                {baseProducts.length === 0 ? (
                    <div className="flex justify-center py-24">
                        <div className="h-10 w-10 border-4 border-blue-50 border-t-blue-600 rounded-full animate-spin" />
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 p-0 bg-gray-100 gap-[1px]">
                        {otherProducts.map(product => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};
