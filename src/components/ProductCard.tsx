import React from 'react';
import { motion } from 'motion/react';
import { Product } from '../services/aiService';

export const ProductCard: React.FC<{ product: Product, isMatch?: boolean }> = ({ product, isMatch }) => {
    const rating = (3.5 + Math.random() * 1.5).toFixed(1);
    const originalPrice = Math.floor(product.price * (1.2 + Math.random() * 0.5));
    const discount = Math.round(((originalPrice - product.price) / originalPrice) * 100);

    return (
        <motion.div 
            whileHover={{ boxShadow: '0 10px 20px rgba(0,0,0,0.08)' }}
            className="group cursor-pointer bg-white transition-all hover:z-10 p-4 h-full flex flex-col"
        >
            <div className="relative aspect-square flex items-center justify-center p-2">
                {isMatch && (
                    <div className="absolute top-0 left-0 z-10 bg-blue-600 px-2 py-0.5 rounded-sm text-[8px] font-black text-white">
                        AI MATCH
                    </div>
                )}
                <img 
                    src={product.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800'} 
                    alt={product.name} 
                    className="max-h-full max-w-full object-contain transition-transform duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                />
            </div>
            <div className="mt-4 flex-1 flex flex-col">
                <h3 className="text-sm font-medium text-slate-800 line-clamp-1 group-hover:text-blue-600">{product.name}</h3>
                
                <div className="flex items-center gap-2 mt-1">
                    <div className="bg-green-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        {rating} <div className="text-[8px]">★</div>
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 font-sans">({Math.floor(Math.random() * 5000)})</span>
                    <span className="ml-auto">
                         <img src="https://static-assets-web.flixcart.com/fk-p-linchpin-web/fk-cp-zion/img/fa_62673a.png" alt="assured" className="h-4" />
                    </span>
                </div>

                <div className="flex items-center gap-2 mt-2">
                    <span className="font-bold text-base text-slate-900">${product.price}</span>
                    <span className="text-xs text-gray-400 line-through font-sans">${originalPrice}</span>
                    <span className="text-xs font-bold text-green-600 font-sans">{discount}% off</span>
                </div>

                <div className="mt-auto pt-2">
                    <span className="text-[10px] text-gray-500 font-medium">Free delivery</span>
                </div>
            </div>
        </motion.div>
    );
};
