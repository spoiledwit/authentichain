'use client';

import { useState, useEffect, FormEvent } from 'react';
import Web3 from 'web3';
import { QRCodeSVG } from "qrcode.react";
import { Plus, Package, Loader2 } from 'lucide-react';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/lib/contract";

interface Product {
  id: string;
  name: string;
  location: string;
  manufacturingDate: string;
}

export default function ManufacturerDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    productId: '',
    name: '',
    location: '',
    remarks: '',
    nextHandler: '', // New field for the next supplier's address
  });

  useEffect(() => {
    fetchProductsByManufacturer();
  }, []);

  // Function to fetch products by the logged-in manufacturer's address
  const fetchProductsByManufacturer = async () => {
    try {
      //@ts-ignore
      if (typeof window.ethereum === 'undefined') {
        alert('Please install MetaMask!');
        return;
      }
      //@ts-ignore
      const web3 = new Web3(window.ethereum);
      const contract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
      const accounts = await web3.eth.getAccounts();
      const manufacturerAddress = accounts[0];

      // Call getProductsByManufacturer method in the contract
      const productsData: any = await contract.methods.getProductsByManufacturer(manufacturerAddress).call();
      console.log(productsData);
   
      const parsedProducts = productsData.map((product: any) => ({
        id: product.productId,
        name: product.name,
        manufacturingDate: new Date(Number(product.manufacturingDate) * 1000).toLocaleDateString(),
      }));

      setProducts(parsedProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
      alert('Failed to fetch products. Check console for details.');
    }
  };

  // Function to handle product addition
  const handleAddProduct = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      //@ts-ignore
      if (typeof window.ethereum === 'undefined') {
        alert('Please install MetaMask!');
        return;
      }

      //@ts-ignore
      const web3 = new Web3(window.ethereum);
      //@ts-ignore
      await window.ethereum.request({ method: 'eth_requestAccounts' });

      const contract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
      const accounts = await web3.eth.getAccounts();

      await contract.methods.registerProduct(
        formData.productId,
        formData.name,
        formData.location,
        formData.remarks,
        formData.nextHandler // Pass the initial supplier's address as nextHandler
      ).send({ from: accounts[0] });

      // Refresh product list after adding a new product
      await fetchProductsByManufacturer();

      // Reset form
      setFormData({
        productId: '',
        name: '',
        location: '',
        remarks: '',
        nextHandler: '', // Reset nextHandler field
      });
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding product:', error);
      alert('Failed to add product. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-black dark:text-white">
          Manufacturer Dashboard
        </h1>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      {/* Add Product Form */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#1A1A1A] rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4 text-black dark:text-white">
              Add New Product
            </h2>
            <form onSubmit={handleAddProduct} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Product ID
                </label>
                <input
                  type="text"
                  value={formData.productId}
                  onChange={(e) => setFormData(prev => ({...prev, productId: e.target.value}))}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#111111] p-2.5 text-black dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Product Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#111111] p-2.5 text-black dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({...prev, location: e.target.value}))}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#111111] p-2.5 text-black dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Remarks
                </label>
                <textarea
                  value={formData.remarks}
                  onChange={(e) => setFormData(prev => ({...prev, remarks: e.target.value}))}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#111111] p-2.5 text-black dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Initial Supplier Address
                </label>
                <input
                  type="text"
                  value={formData.nextHandler}
                  onChange={(e) => setFormData(prev => ({...prev, nextHandler: e.target.value}))}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#111111] p-2.5 text-black dark:text-white"
                  required
                />
              </div>
              <div className="flex gap-4 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-black dark:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Add Product'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Products List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <div
            key={product.id}
            className="bg-white dark:bg-[#1A1A1A] rounded-lg p-6 border border-gray-100 dark:border-[#333333]"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-black dark:text-white">
                  {product.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  ID: {product.id}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Created: {product.manufacturingDate}
                </p>
              </div>
              <div className="border border-gray-100 dark:border-[#333333] rounded p-2">
                <QRCodeSVG 
                  value={product.id}
                  size={80}
                  level="H"
                  includeMargin={true}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {products.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-12 h-12 mx-auto text-gray-400" />
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            No products added yet
          </p>
        </div>
      )}
    </div>
  );
}
