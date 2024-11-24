"use client";

import { useState, useEffect, FormEvent } from "react";
import Web3 from "web3";
import { QRCodeSVG } from "qrcode.react";
import { Plus, Package, Loader2 } from "lucide-react";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/lib/contract";

interface Product {
  serialNumber: string;
  productName: string;
  manufacturer: string;
  remarks: string;
  timestamp: string;
}

export default function ManufacturerDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    combinedID: "",
    serialNumber: "",
    productName: "",
    sourceAddress: "",
    destinationAddress: "",
    firstSupplier: "",
    remarks: "",
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      //@ts-ignore
      if (typeof window.ethereum === "undefined") {
        alert("Please install MetaMask!");
        return;
      }

      //@ts-ignore
      const web3 = new Web3(window.ethereum);
      const accounts = await web3.eth.getAccounts();
      const contract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);

      const productsData = await contract.methods
        .getManufacturerProducts()
        .call({ from: accounts[0] });
      //@ts-ignore
      setProducts(productsData);
    } catch (error) {
      console.error("Error fetching products:", error);
      alert("Failed to fetch products");
    }
  };

  const handleAddProduct = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      //@ts-ignore
      if (typeof window.ethereum === "undefined") {
        alert("Please install MetaMask!");
        return;
      }

      //@ts-ignore
      const web3 = new Web3(window.ethereum);
      //@ts-ignore
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const accounts = await web3.eth.getAccounts();
      const manufacturer = accounts[0];
      const combinedID = `${manufacturer}-${formData.serialNumber}`;

      console.log(combinedID);
    
      const contract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);

      // Create product
      await contract.methods
        .createProduct(
          combinedID,
          formData.serialNumber,
          formData.productName,
          formData.sourceAddress,
          formData.destinationAddress,
          formData.firstSupplier,
          formData.remarks
        )
        .send({ from: accounts[0] });

      await fetchProducts();

      // Reset form
      setFormData({
        combinedID: "",
        serialNumber: "",
        productName: "",
        sourceAddress: "",
        destinationAddress: "",
        firstSupplier: "",
        remarks: "",
      });
      setShowAddForm(false);
    } catch (error) {
      console.error("Error adding product:", error);
      alert("Failed to add product");
    } finally {
      setLoading(false);
    }
  };

  console.log(products);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manufacturer Dashboard</h1>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Add New Product</h2>

            <form onSubmit={handleAddProduct} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Serial Number
                </label>
                <input
                  type="text"
                  value={formData.serialNumber}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      serialNumber: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Product Name
                </label>
                <input
                  type="text"
                  value={formData.productName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      productName: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Source Address
                </label>
                <input
                  type="text"
                  value={formData.sourceAddress}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      sourceAddress: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Destination Address
                </label>
                <input
                  type="text"
                  value={formData.destinationAddress}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      destinationAddress: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  First Supplier (Wallet Address)
                </label>
                <input
                  type="text"
                  value={formData.firstSupplier}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      firstSupplier: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Remarks
                </label>
                <textarea
                  value={formData.remarks}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      remarks: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border p-2"
                />
              </div>
              <div className="flex gap-4 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-sm border rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Add Product"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 border"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">{product.productName}</h3>
                <p className="text-sm text-gray-600">
                  Serial: {product.serialNumber}
                </p>
                <p className="text-sm text-gray-600">
                  Created:{" "}
                  {new Date(Number(product.timestamp) * 1000).toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">
                  Remarks: {product.remarks}
                </p>
              </div>
              <div className="border rounded p-2">
                <QRCodeSVG
                  value={`${process.env.NEXT_PUBLIC_URL}?product=${product.manufacturer}-${product.serialNumber}`}
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
          <p className="mt-2 text-gray-600">No products added yet</p>
        </div>
      )}
    </div>
  );
}
