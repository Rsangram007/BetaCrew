const net = require('net');
const fs = require('fs');
const HOST = '127.0.0.1';
const PORT = 3000;
const MAX_SEQUENCE = 14; // Set the maximum expected packet sequence
const MAX_RETRIES = 3; // Max retries for missing packets

// Utility function to parse packets from buffer
function parsePacket(buffer) {
    const symbol = buffer.toString('ascii', 0, 4).trim();
    const buysellindicator = buffer.toString('ascii', 4, 5).trim();
    const quantity = buffer.readInt32BE(5);
    const price = buffer.readInt32BE(9);
    const packetSequence = buffer.readInt32BE(13);
    return { symbol, buysellindicator, quantity, price, packetSequence };
}

// Create a TCP client
const client = new net.Socket();
let packets = [];

// Connect to the server
const connectToServer = async () => {
    return new Promise((resolve, reject) => {
        client.connect(PORT, HOST, () => {
            console.log('Connected to server');
            resolve();
        });

        client.on('error', (err) => {
            console.error('Connection error:', err.message);
            reject(err);
        });
    });
};

// Handle incoming data
client.on('data', (data) => {
    let offset = 0;
    while (offset < data.length) {
        const packet = parsePacket(data.slice(offset, offset + 17));
        packets.push(packet);
        offset += 17;
    }
});

// Handle end of data transmission
client.on('end', async () => {
    console.log('Disconnected from server');

    // Ensure we have all sequences from 1 to MAX_SEQUENCE
    await ensureAllSequences();

    // Save packets to JSON file
    fs.writeFileSync('output.json', JSON.stringify(packets, null, 2));
    console.log('Data saved to output.json');
});

// Function to ensure all sequences from 1 to MAX_SEQUENCE are present
async function ensureAllSequences() {
    const sequences = new Set(packets.map(packet => packet.packetSequence));
    const missingSequences = [];

    // Identify missing sequences
    for (let i = 1; i <= MAX_SEQUENCE; i++) {
        if (!sequences.has(i)) {
            missingSequences.push(i);
        }
    }

    // Request missing packets until all sequences are received
    for (const seq of missingSequences) {
        await requestMissingPacket(seq);
    }
}

// Function to request a missing packet
async function requestMissingPacket(sequence) {
    let attempts = 0;
    while (attempts < MAX_RETRIES) {
        try {
            console.log(`Requesting missing packet with sequence: ${sequence} (Attempt ${attempts + 1})`);
            const buffer = Buffer.alloc(2);
            buffer.writeInt8(2, 0);  // callType 2 for "Resend Packet"
            buffer.writeInt8(sequence, 1);  // Sequence number to resend

            const requestClient = new net.Socket();
            await new Promise((resolve, reject) => {
                requestClient.connect(PORT, HOST, () => {
                    requestClient.write(buffer);
                });

                requestClient.on('data', (data) => {
                    const packet = parsePacket(data);
                    packets.push(packet);
                    console.log(`Received missing packet: ${JSON.stringify(packet)}`);
                    requestClient.end();  
                    resolve();  
                });

                requestClient.on('error', (err) => {
                    console.error(`Error requesting packet ${sequence}: ${err.message}`);
                    reject(err);
                });
            });
            return;  
        } catch (error) {
            attempts++;
            console.error(`Failed to retrieve packet ${sequence}: ${error.message}`);
            // Implement exponential backoff
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 100));
        }
    }
    console.error(`Exceeded maximum retries for packet ${sequence}`);
}
 
client.on('error', (err) => {
    console.error('Error:', err.message);
});

// Start the connection process
(async () => {
    try {
        await connectToServer();
      
        const buffer = Buffer.alloc(2);
        buffer.writeInt8(1, 0);   
        client.write(buffer);
    } catch (err) {
        console.error("Failed to connect to server:", err.message);
    }
})();




