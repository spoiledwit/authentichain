const { Web3 } = require('web3');
const ABI = require("../lib/contractABI.json");
const CONTRACT_ADDRESS = '0xf73AdDf8735E840994507831436d69124eD4a9A2';
const CONTRACT_ABI = ABI;

async function measurePerformance(numTransactions = 100) {
    const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:7545'));
    const contract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
    const accounts = await web3.eth.getAccounts();
    const manufacturer = accounts[0];
    const supplier = accounts[1];
    
    const gasUsage = [];
    const transactionTimes = [];
    const startTime = Date.now();

    // Get block gas limit
    const block = await web3.eth.getBlock('latest');
    const blockGasLimit = Number(block.gasLimit);
    
    // Set gas limit to 75% of block gas limit
    const gasLimit = Math.floor(blockGasLimit * 0.75);
    console.log(`Block gas limit: ${blockGasLimit}`);
    console.log(`Using gas limit: ${gasLimit}`);
    
    for (let i = 0; i < numTransactions; i++) {
        const serialNumber = `TEST-${Date.now()}-${i}`;
        const combinedID = `${manufacturer}-${serialNumber}`;
        const txStart = Date.now();
        
        try {
            const tx = await contract.methods.createProduct(
                combinedID,
                serialNumber,
                "Test Product",
                "Source Address",
                "Destination Address",
                supplier,
                "Performance Test"
            ).send({ 
                from: manufacturer,
                gas: gasLimit,
                maxFeePerGas: '50000000000', // 50 gwei
                maxPriorityFeePerGas: '2000000000' // 2 gwei
            });
            
            // Convert BigInt to Number safely
            const gasUsed = typeof tx.gasUsed === 'bigint' ? 
                Number(tx.gasUsed) : 
                Number(String(tx.gasUsed));
            
            gasUsage.push(gasUsed);
            transactionTimes.push(Date.now() - txStart);
            
            // Increased delay between transactions
            await new Promise(resolve => setTimeout(resolve, 500));
            
            if (i % 10 === 0) {
                console.log(`Completed ${i}/${numTransactions} transactions`);
            }
        } catch (error) {
            console.error(`Transaction ${i} failed:`, error.message);
        }
    }
    
    const endTime = Date.now();
    const timeFrame = (endTime - startTime) / 1000;
    
    const successfulTransactions = gasUsage.length;
    const averageTps = successfulTransactions / timeFrame;
    
    // Safe number conversions for calculations
    const totalGas = gasUsage.reduce((a, b) => a + b, 0);
    const averageGasUsed = Math.floor(totalGas / successfulTransactions);
    
    // Calculate peak TPS using sliding window
    const windowSize = 1000;
    let maxTps = 0;
    for (let i = 0; i < timeFrame * 1000; i += 1000) {
        const txInWindow = transactionTimes.filter(t => t >= i && t < i + windowSize).length;
        maxTps = Math.max(maxTps, txInWindow);
    }
    
    return {
        timeFrame,
        totalTransactions: numTransactions,
        successfulTransactions,
        averageTps,
        peakTps: maxTps,
        averageGasUsed,
        gasUsage,
        minGas: Math.min(...gasUsage),
        maxGas: Math.max(...gasUsage)
    };
}

async function runPerformanceTest() {
    console.log('Starting Performance Test...');
    
    try {
        const metrics = await measurePerformance(20); // Reduced number of transactions for testing
        
        console.log('\nPerformance Metrics Report');
        console.log('========================');
        console.log(`Time Frame: ${metrics.timeFrame.toFixed(2)} seconds`);
        console.log(`Total Transactions Attempted: ${metrics.totalTransactions}`);
        console.log(`Successful Transactions: ${metrics.successfulTransactions}`);
        console.log(`Average TPS: ${metrics.averageTps.toFixed(2)}`);
        console.log(`Peak TPS: ${metrics.peakTps}`);
        console.log(`Average Gas Used: ${metrics.averageGasUsed.toLocaleString()}`);
        
        console.log('\nGas Consumption Pattern');
        console.log('=====================');
        console.log(`Minimum Gas Used: ${metrics.minGas.toLocaleString()}`);
        console.log(`Maximum Gas Used: ${metrics.maxGas.toLocaleString()}`);
        console.log(`Average Gas Used: ${metrics.averageGasUsed.toLocaleString()}`);
        
        const gasPriceGwei = 20;
        const ethPerTransaction = (metrics.averageGasUsed * gasPriceGwei * 1e-9);
        console.log(`\nCost Analysis (at ${gasPriceGwei} gwei):`);
        console.log(`Cost per transaction: ${ethPerTransaction.toFixed(6)} ETH`);
        console.log(`Daily cost at avg TPS: ${(metrics.averageTps * 86400 * ethPerTransaction).toFixed(4)} ETH`);
        
    } catch (error) {
        console.error('Performance test failed:', error);
    }
}

runPerformanceTest();