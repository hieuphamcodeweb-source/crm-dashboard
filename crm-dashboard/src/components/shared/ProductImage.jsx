import { useState } from 'react';
import { ShoppingOutlined } from '@ant-design/icons';

/**
 * Hiển thị ảnh sản phẩm với fallback khi URL lỗi hoặc không có ảnh.
 * Props:
 *   src       - URL ảnh
 *   alt       - alt text
 *   className - class cho thẻ img / placeholder
 *   iconSize  - kích thước icon fallback (tailwind text-* class)
 */
export default function ProductImage({ src, alt = 'Product', className = '', iconSize = 'text-3xl' }) {
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-[#6160DC]/10 to-purple-100 ${className}`}>
        <ShoppingOutlined className={`${iconSize} text-[#6160DC]/50`} />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`object-cover ${className}`}
      onError={() => setError(true)}
    />
  );
}
