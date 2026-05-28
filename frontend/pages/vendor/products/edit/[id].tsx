import { useRouter } from 'next/router';
import useSWR from 'swr';
import { api } from '../../../../lib/api';
import { useState, useEffect } from 'react';
import { Layout } from '../../../../components/Layout';
import { ProtectedPage } from '../../../../components/ProtectedPage';
import { useAuth } from '../../../../lib/useAuth';

const fetcher = (url: string) => api.get(url).then((r) => r.data);

export default function EditProduct() {
  const router = useRouter();
  const { id } = router.query;
  const { loading } = useAuth();
  const { data: product } = useSWR(!loading && id ? `/store/products/${id}/` : null, fetcher);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [available, setAvailable] = useState(true);
  const [stock, setStock] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [currentImageUrl, setCurrentImageUrl] = useState('');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (product) {
      setName(product.name || '');
      setDescription(product.description || '');
      setPrice(String(product.price || ''));
      setAvailable(Boolean(product.available));
      setStock(String(product.stock_quantity || ''));
      setCurrentImageUrl(product.image_url || '');
      setImagePreview('');
      setImageFile(null);
    }
  }, [product]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      formData.append('price', String(Number(price)));
      formData.append('available', String(available));
      formData.append('stock_quantity', String(stock || 0));
      if (imageFile) {
        formData.append('image', imageFile);
      }
      await api.patch(`/store/products/${id}/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      router.push('/vendor/products');
    } catch (err) {
      console.error(err);
      alert('Unable to update product');
    }
  };

  return (
    <ProtectedPage requiredRole="vendor">
      <Layout title={product ? `Edit ${product.name}` : 'Edit Product'}>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl bg-white p-6 shadow-sm">
        <div>
          <label className="block text-sm font-medium">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="mt-2 w-full rounded border p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="mt-2 w-full rounded border p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium">Product Image</label>
          <input type="file" accept="image/*" onChange={handleImageChange} className="mt-2 w-full rounded border p-2" />
          {imagePreview ? (
            <div className="mt-3 h-40 w-full rounded border overflow-hidden bg-slate-100">
              <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
            </div>
          ) : currentImageUrl ? (
            <div className="mt-3 h-40 w-full rounded border overflow-hidden bg-slate-100">
              <img src={currentImageUrl} alt="Current" className="h-full w-full object-cover" />
            </div>
          ) : null}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium">Price</label>
            <input value={price} onChange={(e) => setPrice(e.target.value)} className="mt-2 w-full rounded border p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium">Stock</label>
            <input value={stock} onChange={(e) => setStock(e.target.value)} className="mt-2 w-full rounded border p-2" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={available} onChange={(e) => setAvailable(e.target.checked)} />
            <span className="text-sm">Available</span>
          </label>
        </div>
        <div className="flex items-center justify-end">
          <button type="submit" className="rounded-2xl bg-sky-600 px-5 py-2 text-white">Save</button>
        </div>
      </form>
      </Layout>
    </ProtectedPage>
  );
}
