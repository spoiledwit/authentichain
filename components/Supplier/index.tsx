import React, { useState, useEffect } from "react";
import Web3 from "web3";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/lib/contract";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

interface TransferFormData {
  nextSupplier: string;
  destination: string;
  remarks: string;
}

const initialTransferFormData: TransferFormData = {
  nextSupplier: "",
  destination: "",
  remarks: "",
};

const SupplierDashboard: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [trackingHistory, setTrackingHistory] = useState<TrackingRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  const [confirming, setConfirming] = useState<boolean>(false);
  const [transferring, setTransferring] = useState<boolean>(false);
  const [currentAccount, setCurrentAccount] = useState<string>("");
  const [transferFormData, setTransferFormData] = useState<TransferFormData>(
    initialTransferFormData
  );
  const [transferDialogOpen, setTransferDialogOpen] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSupplierProducts();
  }, []);

  const fetchSupplierProducts = async (): Promise<void> => {
    try {
      if (typeof window.ethereum === "undefined") {
        throw new Error("Please install MetaMask to use this application");
      }
      const web3 = new Web3(window.ethereum as any);
      await window.ethereum.request({ method: "eth_requestAccounts" });

      const accounts = await web3.eth.getAccounts();
      setCurrentAccount(accounts[0].toLowerCase());

      const contract = new web3.eth.Contract(CONTRACT_ABI as any, CONTRACT_ADDRESS);
      const products = await contract.methods
        .getSupplierProducts()
        .call({ from: accounts[0] });

      setProducts(products as Product[]);
    } catch (error) {
      console.error("Error fetching supplier products:", error);
      setError(
        error instanceof Error ? error.message : "Failed to fetch products"
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchTrackingHistory = async (productId: string): Promise<void> => {
    setLoadingHistory(true);
    setError("");

    try {
      const web3 = new Web3(window.ethereum as any);
      const contract = new web3.eth.Contract(CONTRACT_ABI as any, CONTRACT_ADDRESS);

      const selectedProduct = products.find(
        (product) => product.serialNumber === productId
      );
      if (!selectedProduct) throw new Error("Product not found");

      const newCombinedId = `${selectedProduct.manufacturer}-${productId}`;
      const history = await contract.methods
        .getTrackingHistory(newCombinedId)
        .call();

      setTrackingHistory(history as TrackingRecord[]);
    } catch (error) {
      console.error("Error fetching tracking history:", error);
      setError("Failed to fetch tracking history. Please try again.");
    } finally {
      setLoadingHistory(false);
    }
  };

  const confirmReceipt = async (): Promise<void> => {
    if (!selectedProduct) return;

    setConfirming(true);
    try {
      const web3 = new Web3(window.ethereum as any);
      const contract = new web3.eth.Contract(CONTRACT_ABI as any, CONTRACT_ADDRESS);
      const accounts = await web3.eth.getAccounts();

      const combinedId = `${selectedProduct.manufacturer}-${selectedProduct.serialNumber}`;

      await contract.methods
        .confirmReceipt(combinedId)
        .send({ from: accounts[0] });

      await fetchTrackingHistory(selectedProduct.serialNumber);
      toast({
        title: "Receipt Confirmed",
        description: "The receipt has been confirmed successfully",
      });
    } catch (error) {
      console.error("Error confirming receipt:", error);
      toast({
        title: "Error Confirming Receipt",
        description: "An error occurred while confirming the receipt",
        variant: "destructive",
      });
    } finally {
      setConfirming(false);
    }
  };

  const transferProduct = async (): Promise<void> => {
    if (!selectedProduct) return;

    setTransferring(true);
    try {
      const web3 = new Web3(window.ethereum as any);
      const contract = new web3.eth.Contract(CONTRACT_ABI as any, CONTRACT_ADDRESS);
      const accounts = await web3.eth.getAccounts();

      const combinedId = `${selectedProduct.manufacturer.toString()}-${selectedProduct.serialNumber}`.toString();

      await contract.methods
        .transferToNextSupplier(
          combinedId,
          transferFormData.destination,
          transferFormData.nextSupplier,
          transferFormData.remarks
        )
        .send({ from: accounts[0] });

      await fetchTrackingHistory(selectedProduct.serialNumber);
      setTransferDialogOpen(false);
      setTransferFormData(initialTransferFormData);

      toast({
        title: "Transfer Successful",
        description: "The product has been transferred successfully",
      });
    } catch (error) {
      console.error("Error transferring product:", error);
      toast({
        title: "Error Transferring Product",
        description: "An error occurred while transferring the product",
        variant: "destructive",
      });
    } finally {
      setTransferring(false);
    }
  };

  const handleProductSelect = async (
    product: Product,
    serialNumber: string
  ): Promise<void> => {
    setSelectedProduct(product);
    await fetchTrackingHistory(serialNumber);
  };

  const formatAddress = (address: string): string => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const canConfirmReceipt = (history: TrackingRecord[]): boolean => {
    if (history.length === 0) return false;
    const lastRecord = history[history.length - 1];
    return (
      lastRecord.status === "TRANSFERRED" &&
      lastRecord.nextSupplier.toLowerCase() === currentAccount &&
      !lastRecord.status.includes("RECEIVED")
    );
  };

  const canTransferProduct = (history: TrackingRecord[]): boolean => {
    if (history.length === 0) return false;
    const lastRecord = history[history.length - 1];
    return (
      lastRecord.status === "RECEIVED" &&
      lastRecord.currentSupplier.toLowerCase() === currentAccount
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-lg font-medium">Loading your products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">My Products</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg">
              {error}
            </div>
          )}

          {products.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-lg">
                No products assigned to you yet.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {products.map((product, index) => (
                <Card
                  key={index}
                  className={`bg-white cursor-pointer transition-all duration-200 hover:shadow-lg border ${
                    selectedProduct === product
                      ? "ring-2 ring-blue-500 shadow-lg"
                      : "hover:border-blue-200"
                  }`}
                  onClick={() =>
                    handleProductSelect(product, product.serialNumber)
                  }
                >
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-blue-600">
                          {product.productName}
                        </span>
                        <span className="text-sm text-gray-500">
                          #{product.serialNumber}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm">
                          <span className="font-medium">Manufacturer:</span>{" "}
                          {formatAddress(product.manufacturer)}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Remarks:</span>{" "}
                          {product.remarks}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Created:</span>{" "}
                          {new Date(
                            Number(product.timestamp) * 1000
                          ).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedProduct && (
        <Card className="border-none shadow-md">
          <CardHeader className="border-b">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl">
                Tracking History - {selectedProduct.productName} (#
                {selectedProduct.serialNumber})
              </CardTitle>
              <div className="space-x-2">
                {canConfirmReceipt(trackingHistory) && (
                  <Button
                    onClick={confirmReceipt}
                    disabled={confirming}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {confirming ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Confirming...
                      </>
                    ) : (
                      "Confirm Receipt"
                    )}
                  </Button>
                )}
                <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      disabled={!canTransferProduct(trackingHistory)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Transfer Product
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Transfer Product</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Next Supplier Address</Label>
                        <Input
                          placeholder="0x..."
                          value={transferFormData.nextSupplier}
                          onChange={(e) =>
                            setTransferFormData((prev) => ({
                              ...prev,
                              nextSupplier: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Destination</Label>
                        <Input
                          placeholder="Enter destination address"
                          value={transferFormData.destination}
                          onChange={(e) =>
                            setTransferFormData((prev) => ({
                              ...prev,
                              destination: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Remarks</Label>
                        <Textarea
                          placeholder="Enter any remarks"
                          value={transferFormData.remarks}
                          onChange={(e) =>
                            setTransferFormData((prev) => ({
                              ...prev,
                              remarks: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <Button
                        className="w-full"
                        onClick={transferProduct}
                        disabled={
                          transferring ||
                          !transferFormData.nextSupplier ||
                          !transferFormData.destination
                        }
                      >
                        {transferring ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Transferring...
                          </>
                        ) : (
                          "Transfer"
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {loadingHistory ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              </div>
            ) : (
              <div className="space-y-4">
                {trackingHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No tracking history available</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {trackingHistory.map((record, index) => (
                      <Card
                        key={index}
                        className={`border-none ${
                          record.status === "TRANSFERRED"
                            ? "bg-blue-50"
                            : record.status === "RECEIVED"
                            ? "bg-green-50"
                            : record.status === "ASSIGNED"
                            ? "bg-yellow-50"
                            : "bg-gray-50"
                        }`}
                      >
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            <div className="flex justify-between items-center mb-2">
                              <span
                                className={`font-medium px-3 py-1 rounded-full text-sm ${
                                  record.status === "TRANSFERRED" ? "bg-blue-100 text-blue-700"
                                  : record.status === "RECEIVED"
                                  ? "bg-green-100 text-green-700"
                                  : record.status === "ASSIGNED"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-gray-100 text-gray-700"
                                }`}
                              >
                                {record.status}
                              </span>
                              <span className="text-sm text-gray-500">
                                {new Date(
                                  Number(record.timestamp) * 1000
                                ).toLocaleString()}
                              </span>
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm">
                                  <span className="font-medium">
                                    Current Handler:
                                  </span>{" "}
                                  {formatAddress(record.currentSupplier)}
                                </p>
                                <p className="text-sm">
                                  <span className="font-medium">Next Handler:</span>{" "}
                                  {record.nextSupplier
                                    ? formatAddress(record.nextSupplier)
                                    : "None"}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm">
                                  <span className="font-medium">From:</span>{" "}
                                  {record.sourceAddress}
                                </p>
                                <p className="text-sm">
                                  <span className="font-medium">To:</span>{" "}
                                  {record.destinationAddress}
                                </p>
                              </div>
                            </div>
                            <p className="text-sm mt-2">
                              <span className="font-medium">Remarks:</span>{" "}
                              {record.remarks}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SupplierDashboard;