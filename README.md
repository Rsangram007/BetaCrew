# BetaCrew Exchange Client

This project is a Node.js client application designed to interact with the BetaCrew mock exchange server. The client requests and receives stock ticker data from the server, ensures no data packets are missing, and generates a JSON file containing all received data.

## Requirements

- Node.js v16.17.0 or higher


## Features

- Establishes a TCP connection with the BetaCrew server.
- Sends requests to stream all packets or resend specific packets.
- Parses received packets and handles in-order, out-of-order, and duplicate packets.
- Requests missing packets after initial data transmission.
- Saves the received data to `output.json`.
- Handles connection errors, uncaught exceptions, and unhandled promise rejections.

## Installation

1. Clone the repository:

    ```sh
    git clone https://github.com/Rsangram007/BetaCrew.git
    cd  Betacrew
    ```

2. Install dependencies:

    ```sh
    npm install
    ```

## Usage

1. Start the BetaCrew exchange server:

    ```sh
    cd Betacrew
   npx nodemon main.js
    ```

2. Start the client:

    ```sh
    cd Betacrew
    npm start
    ```

3. Check the generated `output.json` file in the `Betacrew` directory.

 

 **Check Output**

   After running the client, check the `output.json` file for the received data.