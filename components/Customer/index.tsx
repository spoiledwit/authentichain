"use client"
import React, { useEffect, useState } from "react";
import Web3 from "web3";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/lib/contract";
import { QrReader } from "react-qr-reader";
import { AlertCircle, Package, Timer, QrCode, RefreshCw, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useSearchParams } from "next/navigation";

// Types to match contract structure
interface Product {
  serialNumber: string;
  productName: string;
  manufacturer: string;
  remarks: string;
  timestamp: string;
}

interface TrackingRecord {
  currentSupplier: string;
  nextSupplier: string;
  sourceAddress: string;
  destinationAddress: string;
  timestamp: string;
  status: string;
  remarks: string;
}

const CustomerDashboard = () => {
  const searchParams = useSearchParams()
  const [productId, setProductId] = useState<string>(searchParams.get("product") || "");
  const [product, setProduct] = useState<Product | null>(null);
  const [trackingHistory, setTrackingHistory] = useState<TrackingRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [qrScanEnabled, setQrScanEnabled] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(()=>{
    if(productId){
      fetchProductData(productId);
    }
  }, [])

  const handleProductIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProductId(e.target.value);
    setError("");
  };

  const fetchProductData = async (id: string) => {
    try {
      setLoading(true);
      setError("");
      //@ts-ignore

      if (typeof window.ethereum === "undefined") {
        throw new Error("Please install MetaMask!");
      }

      //@ts-ignore
      const web3 = new Web3(window.ethereum);
      const contract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);

      // Fetch both product details and tracking history
      const [productDetails, history] = await Promise.all([
        contract.methods.getProduct(id).call(),
        contract.methods.getTrackingHistory(id).call()
      ]);

      //@ts-ignore
      if (productDetails.serialNumber === "") {
        throw new Error("Product not found");
      }
      //@ts-ignore
      setProduct(productDetails);
      //@ts-ignore
      setTrackingHistory(history);
    } catch (error: any) {
      setError(error.message || "Failed to fetch product data");
      setProduct(null);
      setTrackingHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchData = () => {
    if (!productId.trim()) {
      setError("Please enter a Product ID or scan a QR code");
      return;
    }
    fetchProductData(productId);
  };

  const handleScan = (result: any) => {
    if (result?.text) {
      setProductId(result.text);
      setQrScanEnabled(false);
      fetchProductData(result.text);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'RECEIVED': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'TRANSFERRED': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'IN_TRANSIT': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-6 sm:space-y-8">
      <div className="text-center space-y-2 sm:space-y-4">
        <h1 className="text-2xl sm:text-3xl font-bold">Welcome to AuthentiChain</h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
          Verify product authenticity and track its journey through the supply chain
        </p>
      </div>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Package className="h-5 w-5" />
            Product Verification
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <input
              type="text"
              value={productId}
              onChange={handleProductIdChange}
              placeholder="Enter Product ID"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 text-sm sm:text-base"
            />
            <div className="flex gap-2 sm:gap-4">
              <button
                onClick={handleFetchData}
                disabled={loading}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2 rounded-lg disabled:opacity-50 text-sm sm:text-base"
              >
                {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : null}
                {loading ? "Fetching..." : "Verify"}
              </button>
              
            </div>
          </div>

          {qrScanEnabled && (
            <div className="mt-4 w-full max-w-md mx-auto">
              <QrReader
                constraints={{ facingMode: 'environment' }}
                onResult={handleScan}
                containerStyle={{ borderRadius: '0.5rem', overflow: 'hidden' }}
                videoContainerStyle={{ borderRadius: '0.5rem', width: '100%', height: 'auto' }}
              />
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {product && (
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Package className="h-5 w-5" />
              Product Details
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-xs sm:text-sm font-medium text-gray-500">Serial Number</p>
                <p className="text-sm sm:text-base break-all">{product.serialNumber}</p>
              </div>
              <div className="space-y-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-xs sm:text-sm font-medium text-gray-500">Product Name</p>
                <p className="text-sm sm:text-base">{product.productName}</p>
              </div>
              <div className="space-y-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-xs sm:text-sm font-medium text-gray-500">Manufacturer</p>
                <p className="font-mono text-sm sm:text-base break-all">{product.manufacturer}</p>
              </div>
              <div className="space-y-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-xs sm:text-sm font-medium text-gray-500">Manufacturing Date</p>
                <p className="text-sm sm:text-base">{new Date(parseInt(product.timestamp) * 1000).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {trackingHistory.length > 0 && (
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Timer className="h-5 w-5" />
              Supply Chain Journey
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-6">
              {trackingHistory.map((record, index) => (
                <div key={index} className="relative flex gap-3 sm:gap-4 pb-6 last:pb-0">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 bg-blue-600 rounded-full" />
                    {index !== trackingHistory.length - 1 && (
                      <div className="w-0.5 h-full bg-gray-200 dark:bg-gray-700" />
                    )}
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className={`px-3 py-1 text-xs sm:text-sm rounded-full w-fit ${getStatusColor(record.status)}`}>
                        {record.status}
                      </span>
                      <span className="text-xs sm:text-sm text-gray-500">
                        {new Date(parseInt(record.timestamp) * 1000).toLocaleString()}
                      </span>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 sm:p-4 rounded-lg space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-500" />
                            <p className="text-xs sm:text-sm font-medium text-gray-500">From</p>
                          </div>
                          <p className="font-mono text-xs sm:text-sm break-all">{record.currentSupplier}</p>
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{record.sourceAddress}</p>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-500" />
                            <p className="text-xs sm:text-sm font-medium text-gray-500">To</p>
                          </div>
                          <p className="font-mono text-xs sm:text-sm break-all">{record.nextSupplier || 'Current Location'}</p>
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{record.destinationAddress}</p>
                        </div>
                      </div>
                      {record.remarks && (
                        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                          <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Remarks</p>
                          <p className="text-xs sm:text-sm">{record.remarks}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && !error && !product && !trackingHistory.length && (
        <div className="text-center py-8 sm:py-12">
          <Package className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-sm sm:text-base text-gray-500">
            Enter a Product ID or scan a QR code to view product details and tracking history
          </p>
        </div>
      )}
    </div>
  );
};

export default CustomerDashboard;