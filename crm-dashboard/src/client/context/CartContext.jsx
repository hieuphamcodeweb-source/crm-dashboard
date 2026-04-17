import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';

const CART_API_URL = 'http://localhost:3001/carts';
const PRODUCT_API_URL = 'http://localhost:3001/products';
const CART_SYNC_INTERVAL_MS = 5000;

const CartContext = createContext(null);

function normalizeProduct(product, quantity) {
  const stock = Number(product.stock ?? 0);
  const safeStock = Number.isFinite(stock) && stock >= 0 ? stock : 0;
  const safeQty = Math.max(1, Math.min(Number(quantity || 1), safeStock || Number(quantity || 1)));
  const isPurchasable = product.status === 'Active' && safeStock > 0;
  return {
    id: product.id,
    name: product.name,
    category: product.category,
    sku: product.sku,
    price: product.price,
    img: product.img || '',
    status: product.status,
    stock: safeStock,
    quantity: safeQty,
    isPurchasable,
  };
}

function mergeCartItems(items = []) {
  const map = new Map();
  items.forEach((item) => {
    const key = String(item.id);
    const prev = map.get(key);
    const itemStock = Number(item.stock ?? 0);
    const safeItemStock = Number.isFinite(itemStock) && itemStock >= 0 ? itemStock : 0;
    const itemQty = Number(item.quantity || 0);
    if (prev) {
      const maxStock = Math.max(Number(prev.stock || 0), safeItemStock);
      const nextQtyRaw = prev.quantity + itemQty;
      const nextQty = maxStock > 0 ? Math.min(nextQtyRaw, maxStock) : nextQtyRaw;
      map.set(key, {
        ...prev,
        stock: maxStock,
        quantity: nextQty,
      });
    } else {
      map.set(key, {
        id: item.id,
        name: item.name,
        category: item.category,
        sku: item.sku,
        price: item.price,
        img: item.img || '',
        status: item.status,
        stock: safeItemStock,
        quantity: safeItemStock > 0 ? Math.min(itemQty, safeItemStock) : itemQty,
        isPurchasable: item.status === 'Active' && safeItemStock > 0,
      });
    }
  });
  return [...map.values()].filter((item) => item.quantity > 0);
}

function reconcileCartItemsWithProducts(currentItems = [], products = []) {
  const productById = new Map(products.map((product) => [String(product.id), product]));
  let hasChanges = false;

  const nextItems = currentItems
    .map((item) => {
      const latest = productById.get(String(item.id));
      // Giữ item trong gio de thong bao het hang, khong xoa silently.
      if (!latest) {
        const nextItem = {
          ...item,
          status: 'Inactive',
          stock: 0,
          isPurchasable: false,
        };
        if (
          nextItem.status !== item.status ||
          nextItem.stock !== item.stock ||
          nextItem.isPurchasable !== item.isPurchasable
        ) {
          hasChanges = true;
        }
        return nextItem;
      }

      const stock = Number(latest.stock ?? 0);
      const safeStock = Number.isFinite(stock) && stock >= 0 ? stock : 0;
      const isPurchasable = latest.status === 'Active' && safeStock > 0;
      const nextQty = isPurchasable
        ? Math.max(1, Math.min(Number(item.quantity || 1), safeStock))
        : Number(item.quantity || 1);
      const nextItem = {
        ...item,
        name: latest.name,
        category: latest.category,
        sku: latest.sku,
        price: latest.price,
        img: latest.img || '',
        status: latest.status,
        stock: safeStock,
        quantity: nextQty,
        isPurchasable,
      };

      if (
        nextItem.name !== item.name ||
        nextItem.category !== item.category ||
        nextItem.sku !== item.sku ||
        nextItem.price !== item.price ||
        nextItem.img !== item.img ||
        nextItem.status !== item.status ||
        nextItem.stock !== item.stock ||
        nextItem.quantity !== item.quantity ||
        nextItem.isPurchasable !== item.isPurchasable
      ) {
        hasChanges = true;
      }

      return nextItem;
    })
    .filter(Boolean);

  if (nextItems.length !== currentItems.length) {
    hasChanges = true;
  }

  return { nextItems, hasChanges };
}

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [isCartLoading, setIsCartLoading] = useState(false);
  const cartRecordIdRef = useRef(null);
  const syncQueueRef = useRef(Promise.resolve());

  const getCartRecordsByAccount = async () => {
    if (!user?.id) return [];
    const res = await fetch(`${CART_API_URL}?accountId=${encodeURIComponent(user.id)}`);
    if (!res.ok) throw new Error('Không tải được giỏ hàng của tài khoản.');
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  };

  const createCartRecord = async (payload) => {
    return fetch(CART_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  };

  const updateCartRecord = async (id, payload) => {
    return fetch(`${CART_API_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...payload }),
    });
  };

  const cleanupDuplicateRecords = async (records) => {
    if (!Array.isArray(records) || records.length === 0) return null;
    const mergedItems = mergeCartItems(records.flatMap((record) => record.items || []));
    const now = new Date().toISOString();
    const primary = records[0];

    await updateCartRecord(primary.id, {
      accountId: user.id,
      accountName: user.name,
      accountEmail: user.email,
      items: mergedItems,
      created_at: primary.created_at || now,
      updated_at: now,
    });

    const duplicates = records.filter((record) => String(record.id) !== String(primary.id));
    await Promise.all(
      duplicates.map((record) =>
        fetch(`${CART_API_URL}/${record.id}`, { method: 'DELETE' })
      )
    );

    return {
      id: primary.id,
      accountId: user.id,
      accountName: user.name,
      accountEmail: user.email,
      items: mergedItems,
      created_at: primary.created_at || now,
      updated_at: now,
    };
  };

  const resolveSingleCartRecord = async () => {
    const records = await getCartRecordsByAccount();
    if (records.length === 0) return null;
    return cleanupDuplicateRecords(records);
  };

  const syncCartToDb = async (nextItems) => {
    if (!user?.id) return;

    if (nextItems.length === 0) {
      const records = await getCartRecordsByAccount();
      await Promise.all(records.map((record) => fetch(`${CART_API_URL}/${record.id}`, { method: 'DELETE' })));
      cartRecordIdRef.current = null;
      return;
    }

    const now = new Date().toISOString();
    const payload = {
      accountId: user.id,
      accountName: user.name,
      accountEmail: user.email,
      items: nextItems,
      updated_at: now,
    };

    const recordsBeforeWrite = await getCartRecordsByAccount();

    if (recordsBeforeWrite.length === 0) {
      const createRes = await createCartRecord({
        ...payload,
        created_at: now,
      });
      if (createRes.ok) {
        const created = await createRes.json();
        cartRecordIdRef.current = created?.id || null;
      }
      return;
    }

    const normalizedRecord = await cleanupDuplicateRecords(recordsBeforeWrite);
    const targetRecordId = normalizedRecord?.id || recordsBeforeWrite[0].id;

    await updateCartRecord(targetRecordId, {
      ...payload,
      created_at: normalizedRecord?.created_at || recordsBeforeWrite[0]?.created_at || now,
    });
    cartRecordIdRef.current = targetRecordId;
  };

  const enqueueSync = (nextItems) => {
    syncQueueRef.current = syncQueueRef.current
      .then(() => syncCartToDb(nextItems))
      .catch((error) => {
        // Giữ queue chạy tiếp nhưng log lỗi để debug.
        // eslint-disable-next-line no-console
        console.error('[CART-DEBUG] Sync failed', {
          accountId: user?.id,
          nextItems,
          error,
        });
      });
  };

  useEffect(() => {
    let isMounted = true;

    async function loadUserCart() {
      if (!user?.id) {
        setCartItems([]);
        cartRecordIdRef.current = null;
        return;
      }

      try {
        setIsCartLoading(true);
        const record = await resolveSingleCartRecord();
        if (isMounted) {
          cartRecordIdRef.current = record?.id || null;
          setCartItems(Array.isArray(record?.items) ? mergeCartItems(record.items) : []);
        }
      } catch {
        if (isMounted) {
          cartRecordIdRef.current = null;
          setCartItems([]);
        }
      } finally {
        if (isMounted) {
          setIsCartLoading(false);
        }
      }
    }

    loadUserCart();
    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return undefined;

    let isUnmounted = false;

    const syncWithLatestProducts = async () => {
      if (isUnmounted) return;
      if (cartItems.length === 0) return;

      try {
        const res = await fetch(PRODUCT_API_URL, { cache: 'no-store' });
        if (!res.ok) return;
        const products = await res.json();
        if (!Array.isArray(products)) return;

        const { nextItems, hasChanges } = reconcileCartItemsWithProducts(cartItems, products);
        if (!hasChanges) return;

        if (isUnmounted) return;
        setCartItems(nextItems);
        enqueueSync(nextItems);
      } catch {
        // Bo qua loi tam thoi, se thu lai o chu ky tiep theo.
      }
    };

    syncWithLatestProducts();
    const intervalId = window.setInterval(syncWithLatestProducts, CART_SYNC_INTERVAL_MS);
    window.addEventListener('focus', syncWithLatestProducts);

    return () => {
      isUnmounted = true;
      window.clearInterval(intervalId);
      window.removeEventListener('focus', syncWithLatestProducts);
    };
  }, [user?.id, cartItems]);

  const addToCart = (product, quantity = 1) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => String(item.id) === String(product.id));
      let nextItems = [];
      if (existing) {
        const maxStock = Number(existing.stock ?? product.stock ?? 0);
        const desiredQty = existing.quantity + Number(quantity || 0);
        const boundedQty = maxStock > 0 ? Math.min(desiredQty, maxStock) : desiredQty;
        nextItems = prev.map((item) =>
          String(item.id) === String(product.id)
            ? { ...item, stock: Number(item.stock ?? product.stock ?? 0), quantity: boundedQty }
            : item
        );
      } else {
        nextItems = [...prev, normalizeProduct(product, quantity)];
      }
      enqueueSync(nextItems);
      return nextItems;
    });
  };

  const removeFromCart = (id) => {
    setCartItems((prev) => {
      const nextItems = prev.filter((item) => String(item.id) !== String(id));
      enqueueSync(nextItems);
      return nextItems;
    });
  };

  const removeManyFromCart = (ids = []) => {
    const idSet = new Set(ids.map((id) => String(id)));
    setCartItems((prev) => {
      const nextItems = prev.filter((item) => !idSet.has(String(item.id)));
      enqueueSync(nextItems);
      return nextItems;
    });
  };

  const updateQuantity = (id, quantity) => {
    setCartItems((prev) => {
      const nextItems = prev
        .map((item) => {
          if (String(item.id) !== String(id)) return item;
          if (item.isPurchasable === false) return item;
          const maxStock = Number(item.stock || 0);
          const requested = Number(quantity || 0);
          if (requested <= 0) return null;
          const bounded = maxStock > 0 ? Math.min(requested, maxStock) : requested;
          return { ...item, quantity: bounded };
        })
        .filter(Boolean);
      enqueueSync(nextItems);
      return nextItems;
    });
  };

  const clearCart = () => {
    setCartItems([]);
    enqueueSync([]);
  };

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartCount,
        cartTotal,
        isCartLoading,
        addToCart,
        removeFromCart,
        removeManyFromCart,
        updateQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
