import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';

const CART_API_URL = 'http://localhost:3001/carts';

const CartContext = createContext(null);

function normalizeProduct(product, quantity) {
  return {
    id: product.id,
    name: product.name,
    category: product.category,
    sku: product.sku,
    price: product.price,
    img: product.img || '',
    status: product.status,
    quantity,
  };
}

function mergeCartItems(items = []) {
  const map = new Map();
  items.forEach((item) => {
    const key = String(item.id);
    const prev = map.get(key);
    if (prev) {
      map.set(key, { ...prev, quantity: prev.quantity + Number(item.quantity || 0) });
    } else {
      map.set(key, {
        id: item.id,
        name: item.name,
        category: item.category,
        sku: item.sku,
        price: item.price,
        img: item.img || '',
        status: item.status,
        quantity: Number(item.quantity || 0),
      });
    }
  });
  return [...map.values()].filter((item) => item.quantity > 0);
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

  const addToCart = (product, quantity = 1) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => String(item.id) === String(product.id));
      let nextItems = [];
      if (existing) {
        nextItems = prev.map((item) =>
          String(item.id) === String(product.id)
            ? { ...item, quantity: item.quantity + quantity }
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

  const updateQuantity = (id, quantity) => {
    setCartItems((prev) => {
      const nextItems =
        quantity <= 0
          ? prev.filter((item) => String(item.id) !== String(id))
          : prev.map((item) =>
              String(item.id) === String(id) ? { ...item, quantity } : item
            );
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
