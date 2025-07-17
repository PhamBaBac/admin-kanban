# API Refactor Guide

## Cấu trúc mới

Project đã được refactor theo cấu trúc sau:

```
src/
├── services/          # Gọi API
│   ├── authService.ts
│   ├── productService.ts
│   ├── categoryService.ts
│   ├── supplierService.ts
│   ├── orderService.ts
│   ├── promotionService.ts
│   ├── statisticService.ts
│   ├── userService.ts
│   └── index.ts
├── hooks/             # Chứa logic fetch
│   ├── useAuth.ts
│   ├── useProducts.ts
│   ├── useCategories.ts
│   ├── useSuppliers.ts
│   ├── useOrders.ts
│   ├── usePromotions.ts
│   ├── useStatistics.ts
│   ├── useUsers.ts
│   └── index.ts
└── components/        # Chỉ lo render UI
```

## Cách sử dụng

### 1. Services (Gọi API)

Services chứa các function gọi API trực tiếp:

```typescript
import { productService } from "../services";

// Lấy danh sách sản phẩm
const products = await productService.getProducts({ page: 1, size: 10 });

// Tạo sản phẩm mới
const newProduct = await productService.createProduct({
  name: "Product Name",
  price: 100,
  quantity: 50,
  categoryId: "category-id",
  supplierId: "supplier-id",
});
```

### 2. Hooks (Logic Fetch)

Hooks chứa logic fetch với state management:

```typescript
import { useProducts } from '../hooks';

const MyComponent = () => {
  const {
    getProducts,
    createProduct,
    loading,
    error
  } = useProducts();

  const handleFetchProducts = async () => {
    try {
      const products = await getProducts({ page: 1, size: 10 });
      // Xử lý data
    } catch (error) {
      // Xử lý error
    }
  };

  if (loading) return <Spin />;
  if (error) return <div>Error: {error}</div>;

  return (
    // Render UI
  );
};
```

### 3. Components (Chỉ render UI)

Components chỉ lo việc render UI, không chứa logic API:

```typescript
const ProductList = ({ products, onEdit, onDelete }) => {
  return (
    <div>
      {products.map((product) => (
        <ProductItem
          key={product.id}
          product={product}
          onEdit={() => onEdit(product)}
          onDelete={() => onDelete(product.id)}
        />
      ))}
    </div>
  );
};
```

## Thay đổi chính

### 1. Từ `res.result` thành `res.data`

Tất cả API responses giờ trả về `res.data` thay vì `res.result` (theo cấu trúc ApiResponse<T> của backend):

```typescript
// Trước
const res = await handleAPI("/products");
setProducts(res.result.data);

// Sau
const res = await productService.getProducts();
setProducts(res.data);
```

### 2. Từ `res: any` thành `res`

Đã thêm TypeScript interfaces cho tất cả API responses:

```typescript
// Trước
const res: any = await handleAPI("/products");

// Sau
const res: ProductListResponse = await productService.getProducts();
```

### 3. Error Handling

Hooks tự động handle loading và error states:

```typescript
const { loading, error, getProducts } = useProducts();

if (loading) return <Spin />;
if (error) return <div>Error: {error}</div>;
```

## Migration Guide

### Bước 1: Thay thế handleAPI trực tiếp

```typescript
// Trước
import handleAPI from "../apis/handleAPI";
const res: any = await handleAPI("/products", params);
setProducts(res.result.data);

// Sau
import { productService } from "../services";
const res = await productService.getProducts(params);
setProducts(res.data);
```

### Bước 2: Sử dụng hooks cho logic phức tạp

```typescript
// Trước
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

const fetchProducts = async () => {
  setLoading(true);
  try {
    const res: any = await handleAPI("/products");
    setProducts(res.result.data);
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};

// Sau
const { getProducts, loading, error } = useProducts();

const fetchProducts = async () => {
  try {
    const res = await getProducts();
    setProducts(res.data);
  } catch (err) {
    // Error đã được handle trong hook
  }
};
```

### Bước 3: Tách logic ra khỏi components

```typescript
// Trước - Component chứa cả logic và UI
const ProductPage = () => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const res: any = await handleAPI("/products");
    setProducts(res.result.data);
  };

  return <ProductList products={products} />;
};

// Sau - Tách logic ra hook
const ProductPage = () => {
  const { getProducts, loading, error } = useProducts();
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const res = await getProducts();
    setProducts(res.data);
  };

  if (loading) return <Spin />;
  if (error) return <div>Error: {error}</div>;

  return <ProductList products={products} />;
};
```

## Lợi ích

1. **Separation of Concerns**: Tách biệt rõ ràng giữa API calls, business logic và UI
2. **Reusability**: Services và hooks có thể tái sử dụng ở nhiều components
3. **Type Safety**: TypeScript interfaces cho tất cả API responses
4. **Error Handling**: Centralized error handling trong hooks
5. **Testing**: Dễ dàng test từng layer riêng biệt
6. **Maintainability**: Code dễ maintain và mở rộng hơn
