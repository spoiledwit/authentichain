"use client";
import React, { useState } from "react";
import dynamic from "next/dynamic";
import Web3 from "web3";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/lib/contract";
import { QrReader } from "react-qr-reader";

const CustomerDashboard = () => {
  const [productId, setProductId] = useState<string>("");
  const [trackingHistory, setTrackingHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [qrScanEnabled, setQrScanEnabled] = useState(false);

  const handleProductIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProductId(e.target.value);
  };

  const fetchTrackingHistory = async (id: string) => {
    try {
      setLoading(true);
      //@ts-ignore
      if (typeof window.ethereum === "undefined") {
        alert("Please install MetaMask!");
        return;
      }

      //@ts-ignore
      const web3 = new Web3(window.ethereum);
      const contract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);

      // Fetch tracking history for the product ID
      const history = await contract.methods.getTrackingHistory(id).call();

      console.log(history);
      //@ts-ignore
      setTrackingHistory(history);
    } catch (error) {
      alert("Failed to fetch tracking history. Please check the product ID.");
    } finally {
      setLoading(false);
    }
  };

  const handleFetchTrackingHistory = () => {
    if (productId.trim()) {
      fetchTrackingHistory(productId);
    } else {
      alert("Please enter a Product ID or scan a QR code.");
    }
  };

  const handleScan = (data: string | null) => {
    if (data) {
      setProductId(data);
      setQrScanEnabled(false);
      fetchTrackingHistory(data);
    }
  };

  const handleError = (err: any) => {
    console.error("QR scanning error:", err);
    alert("Failed to scan QR code. Check console for details.");
  };

  return (
    <div className="text-center p-6">
      <h1 className="text-2xl font-bold mb-4">Welcome to AuthentiChain</h1>
      <p>Enter a Product ID or scan a QR code to verify authenticity.</p>

      {/* Manual Product ID input */}
      <div className="mt-4">
        <input
          type="text"
          value={productId}
          onChange={handleProductIdChange}
          placeholder="Enter Product ID"
          className="w-full max-w-md border rounded-lg p-2 mt-2 text-black"
        />
        <button
          onClick={handleFetchTrackingHistory}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 mt-4 rounded-lg"
          disabled={loading}
        >
          {loading ? "Fetching..." : "Fetch Tracking History"}
        </button>
      </div>

      {/* QR Code Scanner Toggle */}
      <div className="mt-6">
        <button
          onClick={() => setQrScanEnabled((prev) => !prev)}
          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
        >
          {qrScanEnabled ? "Close QR Scanner" : "Scan QR Code"}
        </button>
      </div>

      {/* QR Code Scanner */}
      {qrScanEnabled && (
        <div className="mt-4 w-full max-w-md mx-auto">
          <QrReader
            onResult={(result, error) => {
              console.log(result);
              console.log(error);
            }}
            //@ts-ignore
            style={{ width: "100%" }}
          />
        </div>
      )}

      {/* Display Tracking History */}
      {trackingHistory.length > 0 && (
        <div className="mt-6 text-left w-full max-w-2xl mx-auto">
          <h2 className="text-xl font-semibold mb-4">
            Tracking History for Product ID: {productId}
          </h2>
          <ul className="space-y-4">
            {trackingHistory.map((entry, index) => (
              <li
                key={index}
                className="p-4 border rounded-lg bg-white text-black dark:bg-[#1A1A1A] dark:text-white"
              >
                <p>
                  <strong>Location:</strong> {entry.location}
                </p>
                <p>
                  <strong>Handler:</strong> {entry.handler}
                </p>
                <p>
                  <strong>Role:</strong> {entry.role}
                </p>
                <p>
                  <strong>Timestamp:</strong>{" "}
                  {new Date(parseInt(entry.timestamp) * 1000).toLocaleString()}
                </p>
                <p>
                  <strong>Remarks:</strong> {entry.remarks}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {trackingHistory.length === 0 && (
        <div className="mt-6 text-gray-600 dark:text-gray-400">
          No tracking history available for this product.
        </div>
      )}
    </div>
  );
};

export default CustomerDashboard;
