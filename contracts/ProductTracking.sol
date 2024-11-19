// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ProductTracking {
    struct Product {
        string productId;
        string name;
        address manufacturer;
        uint256 manufacturingDate;
        bool isValid;
    }

    struct TrackingEntry {
        string location;
        address handler;
        address previousHandler;
        string role;
        uint256 timestamp;
        string remarks;
    }

    mapping(string => Product) public products;
    mapping(string => TrackingEntry[]) public trackingHistory;
    mapping(address => string[]) public productsByManufacturer;

    event ProductRegistered(
        string productId,
        string name,
        address manufacturer
    );
    event LocationUpdated(
        string productId,
        string newLocation,
        address handler
    );

    function registerProduct(
        string memory productId,
        string memory name,
        string memory location,
        string memory remarks
    ) public returns (bool) {
        require(!products[productId].isValid, "Product already exists");

        products[productId] = Product({
            productId: productId,
            name: name,
            manufacturer: msg.sender,
            manufacturingDate: block.timestamp,
            isValid: true
        });

        productsByManufacturer[msg.sender].push(productId);

        TrackingEntry memory entry = TrackingEntry({
            location: location,
            handler: msg.sender,
            previousHandler: address(0), // No previous handler at initial registration
            role: "manufacturer",
            timestamp: block.timestamp,
            remarks: remarks
        });

        trackingHistory[productId].push(entry);

        emit ProductRegistered(productId, name, msg.sender);
        return true;
    }

    function getProductsByManufacturer(
        address manufacturer
    ) public view returns (Product[] memory) {
        // Fetch all product IDs associated with the manufacturer
        string[] memory productIds = productsByManufacturer[manufacturer];

        // Initialize a dynamic array to store the products
        Product[] memory result = new Product[](productIds.length);

        // Loop through each product ID to retrieve and store each Product struct
        for (uint i = 0; i < productIds.length; i++) {
            result[i] = products[productIds[i]];
        }

        return result;
    }

    function addTrackingInfo(
        string memory productId,
        string memory newLocation,
        string memory remarks,
        address nextHandler // the next authorized handler for the product
    ) public returns (bool) {
        require(products[productId].isValid, "Product does not exist");
        require(trackingHistory[productId].length > 0, "No tracking history");

        // Verify that the current sender is the last recorded handler for this product
        address currentHandler = trackingHistory[productId][
            trackingHistory[productId].length - 1
        ].handler;
        require(
            msg.sender == currentHandler,
            "You are not the current authorized handler"
        );

        // Create the new tracking entry
        TrackingEntry memory entry = TrackingEntry({
            location: newLocation,
            handler: msg.sender,
            previousHandler: currentHandler,
            role: "supplier",
            timestamp: block.timestamp,
            remarks: remarks
        });

        trackingHistory[productId].push(entry);

        // Emit event for tracking update
        emit LocationUpdated(productId, newLocation, msg.sender);

        return true;
    }

    function getTrackingHistory(
        string memory productId
    )
        public
        view
        returns (
            string[] memory locations,
            address[] memory handlers,
            address[] memory previousHandlers,
            string[] memory roles,
            uint256[] memory timestamps,
            string[] memory remarks
        )
    {
        require(products[productId].isValid, "Product not found");

        uint length = trackingHistory[productId].length;

        locations = new string[](length);
        handlers = new address[](length);
        previousHandlers = new address[](length);
        roles = new string[](length);
        timestamps = new uint256[](length);
        remarks = new string[](length);

        for (uint i = 0; i < length; i++) {
            TrackingEntry storage entry = trackingHistory[productId][i];
            locations[i] = entry.location;
            handlers[i] = entry.handler;
            previousHandlers[i] = entry.previousHandler;
            roles[i] = entry.role;
            timestamps[i] = entry.timestamp;
            remarks[i] = entry.remarks;
        }
    }
}
