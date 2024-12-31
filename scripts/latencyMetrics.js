const { Web3 } = require('web3');
const QRCode = require('qrcode');
const ABI = require("../lib/contractABI.json");
const CONTRACT_ADDRESS = '0xf73AdDf8735E840994507831436d69124eD4a9A2';
const CONTRACT_ABI = ABI;

async function measureLatency(numSamples = 10) {
    const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:7545'));
    const contract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
    const accounts = await web3.eth.getAccounts();
    const manufacturer = accounts[0];
    const supplier = accounts[1];

    // Metrics storage
    const blockConfirmationTimes = [];
    const qrGenerationTimes = [];
    const verificationTimes = [];

    console.log('Starting Latency Measurements...');

    for (let i = 0; i < numSamples; i++) {
        try {
            // 1. Measure Block Confirmation Time
            const serialNumber = `TEST-${Date.now()}-${i}`;
            const combinedID = `${manufacturer}-${serialNumber}`;
            
            const txStart = Date.now();
            const tx = await contract.methods.createProduct(
                combinedID,
                serialNumber,
                "Test Product",
                "Source Address",
                "Destination Address",
                supplier,
                "Latency Test"
            ).send({ 
                from: manufacturer,
                gas: 2000000
            });
            
            const receipt = await web3.eth.getTransactionReceipt(tx.transactionHash);
            const confirmationTime = Date.now() - txStart;
            blockConfirmationTimes.push(confirmationTime);

            // 2. Measure QR Code Generation Time
            const qrStart = Date.now();
            await QRCode.toDataURL(combinedID);
            const qrTime = Date.now() - qrStart;
            qrGenerationTimes.push(qrTime);

            // 3. Measure Verification Response Time
            const verifyStart = Date.now();
            await contract.methods.getProduct(combinedID).call();
            await contract.methods.getTrackingHistory(combinedID).call();
            const verifyTime = Date.now() - verifyStart;
            verificationTimes.push(verifyTime);

            console.log(`Completed sample ${i + 1}/${numSamples}`);
            
            // Add delay between samples
            await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error) {
            console.error(`Error in sample ${i}:`, error.message);
        }
    }

    // Calculate averages
    const avgBlockTime = blockConfirmationTimes.reduce((a, b) => a + b, 0) / blockConfirmationTimes.length;
    const avgQRTime = qrGenerationTimes.reduce((a, b) => a + b, 0) / qrGenerationTimes.length;
    const avgVerifyTime = verificationTimes.reduce((a, b) => a + b, 0) / verificationTimes.length;

    // Calculate percentiles
    const sorted = {
        block: [...blockConfirmationTimes].sort((a, b) => a - b),
        qr: [...qrGenerationTimes].sort((a, b) => a - b),
        verify: [...verificationTimes].sort((a, b) => a - b)
    };

    const getPercentile = (arr, p) => {
        const index = Math.ceil((p/100) * arr.length) - 1;
        return arr[index];
    };

    return {
        blockConfirmation: {
            average: avgBlockTime,
            min: Math.min(...blockConfirmationTimes),
            max: Math.max(...blockConfirmationTimes),
            p95: getPercentile(sorted.block, 95),
            samples: blockConfirmationTimes
        },
        qrGeneration: {
            average: avgQRTime,
            min: Math.min(...qrGenerationTimes),
            max: Math.max(...qrGenerationTimes),
            p95: getPercentile(sorted.qr, 95),
            samples: qrGenerationTimes
        },
        verification: {
            average: avgVerifyTime,
            min: Math.min(...verificationTimes),
            max: Math.max(...verificationTimes),
            p95: getPercentile(sorted.verify, 95),
            samples: verificationTimes
        }
    };
}

async function runLatencyTest() {
    console.log('Starting Latency Analysis...');
    
    try {
        const metrics = await measureLatency(5); // Reduced samples for testing
        
        console.log('\nLatency Metrics Report');
        console.log('=====================');
        
        console.log('\nBlock Confirmation Times (ms):');
        console.log(`Average: ${metrics.blockConfirmation.average.toFixed(2)}`);
        console.log(`Min: ${metrics.blockConfirmation.min}`);
        console.log(`Max: ${metrics.blockConfirmation.max}`);
        console.log(`95th Percentile: ${metrics.blockConfirmation.p95}`);
        
        console.log('\nQR Generation Times (ms):');
        console.log(`Average: ${metrics.qrGeneration.average.toFixed(2)}`);
        console.log(`Min: ${metrics.qrGeneration.min}`);
        console.log(`Max: ${metrics.qrGeneration.max}`);
        console.log(`95th Percentile: ${metrics.qrGeneration.p95}`);
        
        console.log('\nVerification Response Times (ms):');
        console.log(`Average: ${metrics.verification.average.toFixed(2)}`);
        console.log(`Min: ${metrics.verification.min}`);
        console.log(`Max: ${metrics.verification.max}`);
        console.log(`95th Percentile: ${metrics.verification.p95}`);

    } catch (error) {
        console.error('Latency test failed:', error);
    }
}

runLatencyTest(); 