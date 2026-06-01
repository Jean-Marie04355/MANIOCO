"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import api from '@/lib/axios';
import { useAuth } from '@/features/auth/AuthContext';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Toast {
  id: number;
  message: string;
  type: 'added' | 'removed' | 'error';
}

interface FavoritesContextType {
  favoriteIds: Set<string>;
  totalFavorites: number;
  isFavorited: (productId: string) => boolean;
  toggleFavorite: (productId: string) => Promise<void>;
  isLoading: boolean;
  toasts: Toast[];
}

// ─── Context ─────────────────────────────────────────────────────────────────

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

// ─── Provider ────────────────────────────────────────────────────────────────

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [toastCounter, setToastCounter] = useState(0);

  // Charger les IDs des favoris dès que l'utilisateur est connecté
  useEffect(() => {
    if (user) {
      const fetchFavoriteIds = async () => {
        try {
          setIsLoading(true);
          const res = await api.get('/favorites/ids');
          const ids: string[] = Array.isArray(res.data) ? res.data : [];
          setFavoriteIds(new Set(ids));
        } catch (err) {
          console.error('Erreur lors du chargement des favoris', err);
        } finally {
          setIsLoading(false);
        }
      };
      fetchFavoriteIds();
    } else {
      // Réinitialiser si l'utilisateur se déconnecte
      setFavoriteIds(new Set());
    }
  }, [user]);

  const addToast = useCallback(
    (message: string, type: Toast['type']) => {
      const id = toastCounter + 1;
      setToastCounter(id);
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3000);
    },
    [toastCounter]
  );

  const isFavorited = useCallback(
    (productId: string) => favoriteIds.has(productId),
    [favoriteIds]
  );

  const toggleFavorite = useCallback(
    async (productId: string) => {
      if (!user) {
        // Redirection gérée côté composant
        return;
      }

      // Optimistic update
      const wasAlreadyFavorited = favoriteIds.has(productId);
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (wasAlreadyFavorited) {
          next.delete(productId);
        } else {
          next.add(productId);
        }
        return next;
      });

      try {
        const res = await api.post(`/favorites/${productId}`);
        const { isFavorited: serverState } = res.data;

        // Synchroniser avec la réponse serveur
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          if (serverState) {
            next.add(productId);
          } else {
            next.delete(productId);
          }
          return next;
        });

        addToast(
          serverState ? '❤️ Ajouté à vos favoris' : '🤍 Retiré des favoris',
          serverState ? 'added' : 'removed'
        );
      } catch (err) {
        // Rollback en cas d'erreur
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          if (wasAlreadyFavorited) {
            next.add(productId);
          } else {
            next.delete(productId);
          }
          return next;
        });
        addToast('Une erreur est survenue', 'error');
        console.error('Erreur toggleFavorite', err);
      }
    },
    [user, favoriteIds, addToast]
  );

  return (
    <FavoritesContext.Provider
      value={{
        favoriteIds,
        totalFavorites: favoriteIds.size,
        isFavorited,
        toggleFavorite,
        isLoading,
        toasts,
      }}
    >
      {children}

      {/* Toast Notifications */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-[9999] pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold backdrop-blur-sm
              animate-[slideUp_0.3s_ease-out]
              ${toast.type === 'added'
                ? 'bg-[#b25a49] text-white'
                : toast.type === 'removed'
                ? 'bg-white text-[#b25a49] border border-[#b25a49]/20'
                : 'bg-red-500 text-white'
              }
            `}
            style={{
              animation: 'slideUp 0.3s ease-out',
            }}
          >
            {toast.message}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </FavoritesContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}
