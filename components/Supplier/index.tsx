import React, { useState, FormEvent } from 'react';
import Web3 from 'web3';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/lib/contract";

interface TrackingEntry {
  location: string;
  handler: string;
  previousHandler: string; // Added field for previous handler
  role: string;
  timestamp: string;
  remarks: string;
}

const SupplierDashboard: React.FC = () => {
  const [productId, setProductId] = useState('');
  const [trackingHistory, setTrackingHistory] = useState<TrackingEntry[]>([]);
  const [newLocation, setNewLocation] = useState('');
  const [remarks, setRemarks] = useState('');
  const [nextHandler, setNextHandler] = useState(''); // Address of the next supplier
  const [loading, setLoading] = useState(false);

  // Function to fetch tracking history for a specific Product ID
  const fetchTrackingHistory = async () => {
    try {
      //@ts-ignore
      if (typeof window.ethereum === 'undefined') {
        alert('Please install MetaMask!');
        return;
      }

      if (!productId) {
        alert("Product ID cannot be empty");
        return;
      }
    

      //@ts-ignore
      const web3 = new Web3(window.ethereum);
      const contract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
      const trackingData = await contract.methods.getTrackingHistory(productId).call();

      console.log('Tracking Data:', trackingData);
      // Format tracking data
      //@ts-ignore
      const parsedData = trackingData.map((entry: any) => ({
        location: entry.location,
        handler: entry.handler,
        previousHandler: entry.previousHandler, // Fetch previous handler
        role: entry.role,
        timestamp: new Date(Number(entry.timestamp) * 1000).toLocaleString(),
        remarks: entry.remarks
      }));

    
      setTrackingHistory(parsedData);
    } catch (error) {
      console.error('Error fetching tracking history:', error);
      alert('Failed to fetch tracking history. Check console for details.');
    }
  };

  // Function to add new tracking information
  const handleAddTrackingInfo = async (e: FormEvent) => {
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

      // Call the contract function to add tracking information
      await contract.methods.addTrackingInfo(
        productId,
        newLocation,
        remarks,
        nextHandler // Pass the address of the next supplier
      ).send({ from: accounts[0] });

      // Fetch updated tracking history
      await fetchTrackingHistory();

      // Clear form fields
      setNewLocation('');
      setRemarks('');
      setNextHandler('');
    } catch (error) {
      console.error('Error adding tracking information:', error);
      alert('Failed to add tracking information. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Supplier Dashboard</h1>

      {/* Product ID Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Enter Product ID or Scan QR Code
        </label>
        <input
          type="text"
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          className="w-full rounded-lg border border-gray-300 p-2.5 text-black"
          placeholder="Product ID"
        />
        <button
          onClick={fetchTrackingHistory}
          className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          Fetch Tracking History
        </button>
      </div>

      {/* Display Tracking History */}
      {trackingHistory.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Tracking History</h2>
          <div className="space-y-4">
            {trackingHistory.map((entry, index) => (
              <div key={index} className="bg-gray-800 p-4 rounded-lg">
                <p><strong>Location:</strong> {entry.location}</p>
                <p><strong>Handler:</strong> {entry.handler}</p>
                <p><strong>Previous Handler:</strong> {entry.previousHandler}</p> {/* Display previous handler */}
                <p><strong>Role:</strong> {entry.role}</p>
                <p><strong>Timestamp:</strong> {entry.timestamp}</p>
                <p><strong>Remarks:</strong> {entry.remarks}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add New Tracking Information Form */}
      <form onSubmit={handleAddTrackingInfo} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            New Location
          </label>
          <input
            type="text"
            value={newLocation}
            onChange={(e) => setNewLocation(e.target.value)}
            className="w-full rounded-lg border border-gray-300 p-2.5 text-black"
            placeholder="New Location"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Remarks
          </label>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            className="w-full rounded-lg border border-gray-300 p-2.5 text-black"
            placeholder="Remarks"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Next Supplier Address (if applicable)
          </label>
          <input
            type="text"
            value={nextHandler}
            onChange={(e) => setNextHandler(e.target.value)}
            className="w-full rounded-lg border border-gray-300 p-2.5 text-black"
            placeholder="Next Supplier's Ethereum Address"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Add Tracking Information'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SupplierDashboard;
