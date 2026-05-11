"use client";

import React, { useState, useEffect, useCallback } from "react";

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
}

interface RazorpayConfig {
  keyId: string;
  secret: string;
}

const AdminDashboard: React.FC = () => {
  // Product Management
  const [products, setProducts] = useState<Product[]>([]);
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    category: "electronics",
    image: "",
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);

  // Razorpay Settings
  const [razorpayConfig, setRazorpayConfig] = useState<RazorpayConfig>({
    keyId: "",
    secret: "",
  });
  const [showRazorpaySection, setShowRazorpaySection] = useState(false);

  // Safe localStorage helpers
  const getStoredProducts = useCallback((): Product[] => {
    try {
      const stored = localStorage.getItem("products");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }, []);

  const getStoredRazorpayConfig = useCallback((): RazorpayConfig => {
    try {
      const stored = localStorage.getItem("razorpayConfig");
      return stored ? JSON.parse(stored) : { keyId: "", secret: "" };
    } catch {
      return { keyId: "", secret: "" };
    }
  }, []);

  const saveProducts = useCallback((productsToSave: Product[]) => {
    try {
      localStorage.setItem("products", JSON.stringify(productsToSave));
    } catch (error) {
      console.error("Error saving products:", error);
    }
  }, []);

  const saveRazorpayConfig = useCallback((config: RazorpayConfig) => {
    try {
      localStorage.setItem("razorpayConfig", JSON.stringify(config));
    } catch (error) {
      console.error("Error saving Razorpay config:", error);
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    const storedProducts = getStoredProducts();
    setProducts(storedProducts);

    const storedConfig = getStoredRazorpayConfig();
    setRazorpayConfig(storedConfig);
  }, [getStoredProducts, getStoredRazorpayConfig]);

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Image = reader.result as string;
        setNewProduct((prev) => ({ ...prev, image: base64Image }));
        setImagePreview(base64Image);
      };
      reader.readAsDataURL(file);
    }
  };

  // Add new product
  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price || !newProduct.image) {
      alert("Please fill all fields and upload an image");
      return;
    }

    const product: Product = {
      id: Date.now().toString(),
      name: newProduct.name,
      price: parseFloat(newProduct.price),
      category: newProduct.category,
      image: newProduct.image,
    };

    const updatedProducts = [...products, product];
    setProducts(updatedProducts);
    saveProducts(updatedProducts);

    // Reset form
    setNewProduct({ name: "", price: "", category: "electronics", image: "" });
    setImagePreview(null);
    setIsAddingProduct(false);

    alert("Product added successfully!");
  };

  // Delete product
  const handleDeleteProduct = (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      const updatedProducts = products.filter((p) => p.id !== id);
      setProducts(updatedProducts);
      saveProducts(updatedProducts);
    }
  };

  // Handle Razorpay config change
  const handleRazorpayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRazorpayConfig((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveRazorpayConfig = () => {
    saveRazorpayConfig(razorpayConfig);
    alert("Razorpay config saved successfully!");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-4">
            Admin Dashboard
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl">
            Manage your e-commerce products and payment settings
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Management */}
          <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8 lg:p-10">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Products</h2>
              <button
                onClick={() => setIsAddingProduct(!isAddingProduct)}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-2xl shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center gap-2"
              >
                {isAddingProduct ? "Cancel" : "Add Product"}
              </button>
            </div>

            {/* Add Product Form */}
            {isAddingProduct && (
              <form
                onSubmit={handleAddProduct}
                className="space-y-6 mb-10 p-8 bg-gradient-to-b from-blue-50 to-indigo-50 rounded-2xl border-2 border-dashed border-blue-200"
              >
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Product Name
                  </label>
                  <input
                    type="text"
                    value={newProduct.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setNewProduct({ ...newProduct, name: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-lg"
                    placeholder="Enter product name"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Price ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={newProduct.price}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setNewProduct({ ...newProduct, price: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-lg"
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      value={newProduct.category}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                        setNewProduct({
                          ...newProduct,
                          category: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-lg"
                    >
                      <option value="electronics">Electronics</option>
                      <option value="clothing">Clothing</option>
                      <option value="books">Books</option>
                      <option value="home">Home & Garden</option>
                      <option value="sports">Sports</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Product Image
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-blue-400 transition-all duration-200">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className="cursor-pointer flex flex-col items-center gap-4"
                    >
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                        <svg
                          className="w-8 h-8 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-gray-700">
                          {imagePreview ? "Image Selected" : "Choose Image"}
                        </p>
                        <p className="text-sm text-gray-500">
                          Click to upload or drag and drop
                        </p>
                      </div>
                    </label>
                  </div>
                  {imagePreview && (
                    <div className="mt-4">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-32 h-32 object-cover rounded-2xl shadow-lg border-4 border-blue-200 mx-auto"
                      />
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-bold py-4 px-8 rounded-2xl shadow-xl hover:from-emerald-700 hover:to-emerald-800 transition-all duration-200 text-lg"
                >
                  Add Product
                </button>
              </form>
            )}

            {/* Products List */}
            <div className="space-y-4">
              {products.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded-3xl flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-12 h-12 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-4L4 7m8 4v10M4 7v10l8 4"
                      />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-700 mb-2">
                    No Products
                  </h3>
                  <p className="text-gray-500">
                    Add your first product to get started
                  </p>
                </div>
              ) : (
                products.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-6 bg-gradient-to-r from-white to-gray-50 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 group"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-20 h-20 object-cover rounded-xl shadow-lg"
                      />
                      <div>
                        <h3 className="font-bold text-xl text-gray-900">
                          {product.name}
                        </h3>
                        <p className="text-2xl font-bold text-emerald-600">
                          ${product.price.toFixed(2)}
                        </p>
                        <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full mt-1">
                          {product.category}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white font-medium rounded-xl shadow-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 group-hover:scale-105"
                    >
                      Delete
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Razorpay Settings */}
          <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8 lg:p-10">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-gray-900">
                Payment Settings
              </h2>
              <button
                onClick={() => setShowRazorpaySection(!showRazorpaySection)}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-medium rounded-2xl shadow-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 flex items-center gap-2"
              >
                {showRazorpaySection ? "Hide" : "Configure"}
              </button>
            </div>

            {showRazorpaySection && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Razorpay Key ID
                  </label>
                  <input
                    type="text"
                    name="keyId"
                    value={razorpayConfig.keyId}
                    onChange={handleRazorpayChange}
                    className="w-full px-5 py-4 border border-gray-300 rounded-2xl focus:ring-4 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-lg bg-gradient-to-r from-purple-50 to-pink-50"
                    placeholder="rzp_test_xxxxxxxxxx"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Razorpay Secret
                  </label>
                  <input
                    type="password"
                    name="secret"
                    value={razorpayConfig.secret}
                    onChange={handleRazorpayChange}
                    className="w-full px-5 py-4 border border-gray-300 rounded-2xl focus:ring-4 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-lg bg-gradient-to-r from-purple-50 to-pink-50"
                    placeholder="xxxxxxxxxxxxxxxxxxxx"
                  />
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={handleSaveRazorpayConfig}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-700 text-white font-bold py-4 px-8 rounded-2xl shadow-xl hover:from-indigo-700 hover:to-purple-800 transition-all duration-200 text-lg"
                  >
                    Save Razorpay Configuration
                  </button>
                </div>

                <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl">
                  <h4 className="font-semibold text-emerald-800 mb-2">
                    Status
                  </h4>
                  <p className="text-sm text-emerald-700">
                    {razorpayConfig.keyId
                      ? "✅ Configured and saved"
                      : "⚠️ Please add your Razorpay credentials"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
