# Tellor DataBankPlayground UI

A simple web interface for testing oracle integrations with Tellor's DataBankPlayground contract.

## Features

- **Query ID Builder**: Create queryIds and queryData for different oracle data types
- **Value Encoder**: Encode oracle values to bytes format
- **Wallet Connection**: Connect MetaMask to interact with contracts
- **Data Submission**: Submit oracle data to DataBankPlayground contract
- **Data Feed**: View historical oracle data and current values

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```

3. **Open your browser** to `http://localhost:5173`

## How to Use

### 1. Connect Wallet & Configure Contract
- Connect your MetaMask wallet
- Ensure you're on Sepolia testnet
- The app defaults to the Sepolia TellorLab contract: `0x9825DA98095A56a442507288F6dcbe302a59d52C`
- Base Sepolia (chain id 84532) is also pre-configured with contract `0x145E61B9D7649A4686a010E22f59D375fc0FC797`
- You can also specify a custom contract address if needed

### 2. Create Query ID
- Use preset examples (SpotPrice, Empty Args) or create custom queries
- Specify query type (e.g., "SpotPrice", "MyCustomQuery")
- Add arguments with their Solidity types (string, uint256, etc.)
- Generate the queryId (keccak256 hash of queryData)

### 3. Encode Oracle Value
- Add values to encode with their types
- Support for decimals (useful for prices with 18 decimals)
- Generates ABI-encoded bytes value

### 4. Submit Data
- Review your queryId and encoded value
- Submit transaction to DataBankPlayground contract
- Monitor transaction confirmation

### 5. View Data Feed
- See current data for your queryId
- Fetch historical updates from blockchain events
- View timestamps and transaction details

## Example Workflow

1. **Create SpotPrice Query**:
   - Type: "SpotPrice"
   - Args: ["eth", "usd"] (both strings)

2. **Encode Price Value**:
   - Type: uint256
   - Value: 2100
   - Decimals: 18 (results in 2100000000000000000000)

3. **Submit**: Connect wallet and submit transaction

4. **View**: See your data in the feed

## Technical Details

- Built with React, Vite, Wagmi, and Viem
- Connects to Ethereum networks via MetaMask
- Uses DataBankPlayground contract's `updateOracleDataPlayground` function
- Reads data via `getCurrentAggregateData` and `OracleUpdated` events

## Important Notes

- **Testing Only**: DataBankPlayground is for testing purposes only
- **No Security**: Anyone can submit any data to DataBankPlayground
- **Production**: Real Tellor integrations require TellorDataBridge with validator signatures

## Learn More

- [Tellor Documentation](https://docs.tellor.io)
- [DataBankPlayground Guide](../guide-draft.md)
