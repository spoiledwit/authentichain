// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ProductTracking {
    struct Product {
        string serialNumber;
        string productName;
        address manufacturer;
        string remarks;
        uint256 timestamp;
    }

    struct TrackingRecord {
        address currentSupplier;
        address nextSupplier;
        string sourceAddress;
        string destinationAddress;
        uint256 timestamp;
        string status;
        string remarks;
    }

    // Mappings
    mapping(string => Product) public products; // combinedID => Product
    mapping(string => TrackingRecord[]) public trackingHistory; // combinedID => history
    mapping(address => string[]) public supplierProducts; // supplier => their product IDs
    mapping(address => string[]) public manufacturerProducts; // manufacturer => their product IDs

    // Events
    event ProductCreated(
        string combinedID,
        address manufacturer,
        address firstSupplier
    );
    event ProductReceived(string combinedID, address supplier);
    event ProductTransferred(
        string combinedID,
        address fromSupplier,
        address toSupplier
    );
    event TrackingUpdated(string combinedID, address supplier, string status);

    function compareStrings(
        string memory a,
        string memory b
    ) internal pure returns (bool) {
        return keccak256(abi.encodePacked(a)) == keccak256(abi.encodePacked(b));
    }

    // Manufacturer creates and assigns product
    function createProduct(
        string memory combinedID,
        string memory serialNumber,
        string memory productName,
        string memory sourceAddress,
        string memory destinationAddress,
        address firstSupplier,
        string memory remarks
    ) public {
        // Check for duplicate serial numbers in manufacturer's products
        string[] memory mfrProductIds = manufacturerProducts[msg.sender];
        for (uint i = 0; i < mfrProductIds.length; i++) {
            Product memory existingProduct = products[mfrProductIds[i]];
            require(
                !compareStrings(existingProduct.serialNumber, serialNumber),
                "Serial number already exists for this manufacturer"
            );
        }

        // Create product
        products[combinedID] = Product(
            serialNumber,
            productName,
            msg.sender,
            remarks,
            block.timestamp
        );

        // Add to supplier's list
        supplierProducts[firstSupplier].push(combinedID);
        manufacturerProducts[msg.sender].push(combinedID);

        // Create first tracking record
        TrackingRecord memory record = TrackingRecord(
            msg.sender,
            firstSupplier,
            sourceAddress,
            destinationAddress,
            block.timestamp,
            "ASSIGNED",
            remarks
        );
        trackingHistory[combinedID].push(record);

        emit ProductCreated(combinedID, msg.sender, firstSupplier);
    }

    // Supplier confirms receipt after QR scan
    function confirmReceipt(string memory combinedID) public {
        TrackingRecord[] memory history = trackingHistory[combinedID];
        require(history.length > 0, "Product not found");

        TrackingRecord memory lastRecord = history[history.length - 1];
        require(
            msg.sender == lastRecord.nextSupplier,
            "Not authorized supplier"
        );
        require(
            !compareStrings(lastRecord.status, "RECEIVED"),
            "Already received"
        );

        TrackingRecord memory record = TrackingRecord(
            msg.sender, // current receiver becomes current supplier
            address(0), // no next supplier yet
            lastRecord.destinationAddress, // previous destination is now source
            lastRecord.destinationAddress, // destination stays same until transfer
            block.timestamp,
            "RECEIVED",
            "Product received by supplier"
        );
        trackingHistory[combinedID].push(record);

        emit ProductReceived(combinedID, msg.sender);
    }

    // Transfer to next supplier
    function transferToNextSupplier(
        string memory combinedID,
        string memory newDestination,
        address nextSupplier,
        string memory remarks
    ) public {
        TrackingRecord[] memory history = trackingHistory[combinedID];
        require(history.length > 0, "Product not found");

        TrackingRecord memory lastRecord = history[history.length - 1];
        require(msg.sender == lastRecord.currentSupplier, "Not authorized");
        require(
            compareStrings(lastRecord.status, "RECEIVED"),
            "Must receive first"
        );

        // Add to next supplier's list
        supplierProducts[nextSupplier].push(combinedID);

        // Create transfer record
        TrackingRecord memory record = TrackingRecord(
            msg.sender,
            nextSupplier,
            lastRecord.destinationAddress,
            newDestination,
            block.timestamp,
            "TRANSFERRED",
            remarks
        );
        trackingHistory[combinedID].push(record);

        emit ProductTransferred(combinedID, msg.sender, nextSupplier);
    }

    // Get products assigned to supplier
    function getSupplierProducts() public view returns (Product[] memory) {
        string[] memory productIds = supplierProducts[msg.sender];
        Product[] memory supplierProds = new Product[](productIds.length);

        for (uint i = 0; i < productIds.length; i++) {
            supplierProds[i] = products[productIds[i]];
        }
        return supplierProds;
    }

    function getManufacturerProducts() public view returns (Product[] memory) {
        string[] memory productIds = manufacturerProducts[msg.sender];
        Product[] memory mfrProds = new Product[](productIds.length);

        for (uint i = 0; i < productIds.length; i++) {
            mfrProds[i] = products[productIds[i]];
        }
        return mfrProds;
    }

    // Get tracking history
    function getTrackingHistory(
        string memory combinedID
    ) public view returns (TrackingRecord[] memory) {
        return trackingHistory[combinedID];
    }

    // Add interim tracking update
    function addTrackingUpdate(
        string memory combinedID,
        string memory newDestination,
        string memory remarks
    ) public {
        TrackingRecord[] memory history = trackingHistory[combinedID];
        require(history.length > 0, "Product not found");

        TrackingRecord memory lastRecord = history[history.length - 1];
        require(
            msg.sender == lastRecord.currentSupplier,
            "Not authorized supplier"
        );
        require(
            compareStrings(lastRecord.status, "RECEIVED"),
            "Must receive first"
        );

        TrackingRecord memory record = TrackingRecord(
            msg.sender,
            address(0),
            lastRecord.destinationAddress,
            newDestination,
            block.timestamp,
            "IN_TRANSIT",
            remarks
        );
        trackingHistory[combinedID].push(record);

        emit TrackingUpdated(combinedID, msg.sender, "IN_TRANSIT");
    }

    // Get product details
    function getProduct(
        string memory combinedID
    ) public view returns (Product memory) {
        return products[combinedID];
    }
}
