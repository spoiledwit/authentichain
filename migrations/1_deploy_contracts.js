const ProductTracking = artifacts.require("ProductTracking");

module.exports = function(deployer) {
  deployer.deploy(ProductTracking);
};