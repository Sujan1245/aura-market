import React from 'react';
import { ShoppingBag, User, LogIn, LayoutDashboard, Search, Camera } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../lib/utils';

export const Navbar: React.FC<{ 
  onPageChange: (page: string) => void, 
  currentPage: string,
  onImageSearch?: () => void,
  onSearch?: (query: string) => void
}> = ({ onPageChange, currentPage, onImageSearch, onSearch }) => {
  const { user, isAdmin, login, logout } = useAuth();
  const [searchQuery, setSearchQuery] = React.useState('');

  const handleSearchSubmit = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      onSearch?.(searchQuery);
      setSearchQuery('');
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div 
          className="flex cursor-pointer items-center gap-2 font-bold text-xl tracking-tight"
          onClick={() => onPageChange('home')}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm shadow-indigo-200">
            <ShoppingBag size={18} />
          </div>
          <span>AuraMarket</span>
        </div>

        <div className="hidden md:flex flex-1 mx-12">
            <div className="relative w-full max-w-md group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={17} />
                <input 
                    type="text" 
                    placeholder="Search AI products..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleSearchSubmit}
                    className="w-full bg-gray-100 border-transparent rounded-full py-2 pl-10 pr-12 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none transition-all placeholder:text-gray-400"
                />
                <button 
                  onClick={onImageSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-white hover:shadow-sm text-gray-400 hover:text-indigo-600 transition-all"
                  title="Search by image"
                >
                  <Camera size={16} />
                </button>
            </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 text-gray-600">
          {isAdmin && (
            <button 
              onClick={() => onPageChange('admin')}
              className={cn(
                "p-2 rounded-xl transition-all",
                currentPage === 'admin' ? "bg-indigo-600 text-white shadow-md shadow-indigo-100" : "hover:bg-gray-100"
              )}
            >
              <LayoutDashboard size={20} />
            </button>
          )}
          
          <button 
            onClick={() => onPageChange('cart')}
            className={cn(
              "p-2 rounded-xl transition-all relative",
              currentPage === 'cart' ? "bg-indigo-600 text-white shadow-md shadow-indigo-100" : "hover:bg-gray-100"
            )}
          >
            <ShoppingBag size={20} />
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white shadow-sm">
                3
            </span>
          </button>

          {user ? (
            <div className="flex items-center gap-3">
              <button 
                onClick={() => onPageChange('profile')}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full overflow-hidden border-2 transition-all",
                  currentPage === 'profile' ? "border-indigo-600 ring-2 ring-indigo-50" : "border-gray-100 hover:border-indigo-200"
                )}
              >
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || ''} className="h-full w-full object-cover" />
                ) : (
                    <User size={18} />
                )}
              </button>
            </div>
          ) : (
            <button 
              onClick={login}
              className="flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition-all hover:translate-y-[-1px] hover:shadow-indigo-300 active:translate-y-0"
            >
              <LogIn size={16} />
              <span>Login</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};
