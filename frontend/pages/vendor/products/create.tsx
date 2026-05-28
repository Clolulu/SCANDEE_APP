import { useState } from 'react';
import { useRouter } from 'next/router';
import { api } from '../../../lib/api';
import { Layout } from '../../../components/Layout';
import { ProtectedPage } from '../../../components/ProtectedPage';

export default function CreateProduct() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [available, setAvailable] = useState(true);
  const [stock, setStock] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (!name.trim()) {
        setError('Product name is required');
        setLoading(false);
        return;
      }
      if (!price || Number(price) <= 0) {
        setError('Price must be greater than 0');
        setLoading(false);
        return;
      }
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      formData.append('price', String(Number(price)));
      formData.append('available', String(available));
      formData.append('stock_quantity', String(stock ? Number(stock) : 0));
      if (imageFile) {
        formData.append('image', imageFile);
      }
      await api.post('/store/products/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      router.push('/vendor/products');
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Unable to create product');
      setLoading(false);
    }
  };

  return (
    <ProtectedPage requiredRole="vendor">
      <Layout title="Create Product">
        <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl bg-white p-6 shadow-sm max-w-2xl mx-auto">
          <h2 className="text-2xl font-semibold">Create New Product</h2>

          {error && <div className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-slate-700">Product Name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Pad Thai"
              className="mt-2 w-full rounded border border-slate-300 p-3 focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your product"
              rows={4}
              className="mt-2 w-full rounded border border-slate-300 p-3 focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Product Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="mt-2 w-full rounded border border-slate-300 p-3 focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
            />
            {imagePreview && (
              <div className="mt-3 h-40 w-full rounded border border-slate-300 overflow-hidden bg-slate-100">
                <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Price (฿) *</label>
              <input
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                className="mt-2 w-full rounded border border-slate-300 p-3 focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Stock Quantity</label>
              <input
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="Leave empty for unlimited"
                className="mt-2 w-full rounded border border-slate-300 p-3 focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
              />
              <p className="mt-2 text-xs text-slate-500">This field can be left empty if you have unlimited stock.</p>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={available}
                onChange={(e) => setAvailable(e.target.checked)}
                className="w-5 h-5 rounded border-slate-300 text-sky-600 cursor-pointer"
              />
              <span className="text-base font-medium text-slate-900">Available for ordering</span>
            </label>
            <p className="mt-2 ml-8 text-sm text-slate-600">Uncheck to hide this product from customers</p>
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
            <button
              type="button"
              onClick={() => router.push('/vendor/products')}
              className="rounded-2xl border border-slate-300 px-5 py-3 text-slate-900 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-2xl bg-sky-600 px-5 py-3 text-white hover:bg-sky-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Product'}
            </button>
          </div>
        </form>
      </Layout>
    </ProtectedPage>
  );
}
