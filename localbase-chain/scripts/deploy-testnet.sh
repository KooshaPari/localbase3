#!/bin/bash
set -e

# Configuration
CHAIN_ID="localbase-testnet-1"
VALIDATOR_MONIKER="localbase-validator"
KEY_NAME="validator"
KEY_MNEMONIC="your test mnemonic phrase here replace with actual mnemonic in production"
STAKE_DENOM="ulb"
CHAIN_DIR="$HOME/.localbase"
BINARY="localbase"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}LocalBase Testnet Deployment Script${NC}"
echo "Chain ID: $CHAIN_ID"
echo "Validator Moniker: $VALIDATOR_MONIKER"
echo "Stake Denomination: $STAKE_DENOM"
echo "Chain Directory: $CHAIN_DIR"
echo

# Check if binary exists
if ! command -v $BINARY &> /dev/null; then
    echo -e "${RED}Error: $BINARY binary not found. Please build the binary first.${NC}"
    exit 1
fi

# Initialize chain
echo -e "${YELLOW}Initializing chain...${NC}"
$BINARY init $VALIDATOR_MONIKER --chain-id $CHAIN_ID

# Add key
echo -e "${YELLOW}Adding validator key...${NC}"
echo "$KEY_MNEMONIC" | $BINARY keys add $KEY_NAME --recover --keyring-backend test

# Get validator address
VALIDATOR_ADDRESS=$($BINARY keys show $KEY_NAME -a --keyring-backend test)
echo "Validator Address: $VALIDATOR_ADDRESS"

# Modify genesis file
echo -e "${YELLOW}Configuring genesis...${NC}"

# Update stake denomination
$BINARY config set client chain-id $CHAIN_ID
$BINARY config set client keyring-backend test

# Add genesis account
echo -e "${YELLOW}Adding genesis account...${NC}"
$BINARY add-genesis-account $VALIDATOR_ADDRESS 10000000000000$STAKE_DENOM

# Create validator gentx
echo -e "${YELLOW}Creating genesis transaction...${NC}"
$BINARY gentx $KEY_NAME 1000000000000$STAKE_DENOM \
  --chain-id $CHAIN_ID \
  --moniker=$VALIDATOR_MONIKER \
  --commission-rate=0.10 \
  --commission-max-rate=0.20 \
  --commission-max-change-rate=0.01 \
  --min-self-delegation=1 \
  --keyring-backend test

# Collect genesis transactions
echo -e "${YELLOW}Collecting genesis transactions...${NC}"
$BINARY collect-gentxs

# Validate genesis
echo -e "${YELLOW}Validating genesis...${NC}"
$BINARY validate-genesis

# Update configuration
echo -e "${YELLOW}Updating configuration...${NC}"

# Enable API
sed -i 's/enable = false/enable = true/g' $CHAIN_DIR/config/app.toml

# Enable Swagger UI
sed -i 's/swagger = false/swagger = true/g' $CHAIN_DIR/config/app.toml

# Set minimum gas prices
sed -i 's/minimum-gas-prices = ""/minimum-gas-prices = "0.001ulb"/g' $CHAIN_DIR/config/app.toml

# Set timeout commit to 1s for faster blocks in testnet
sed -i 's/timeout_commit = "5s"/timeout_commit = "1s"/g' $CHAIN_DIR/config/config.toml

# Enable prometheus metrics
sed -i 's/prometheus = false/prometheus = true/g' $CHAIN_DIR/config/config.toml

# Create systemd service file
echo -e "${YELLOW}Creating systemd service file...${NC}"
SERVICE_FILE="/etc/systemd/system/localbase.service"

sudo bash -c "cat > $SERVICE_FILE" << EOF
[Unit]
Description=LocalBase Node
After=network-online.target

[Service]
User=$USER
ExecStart=$(which $BINARY) start
Restart=always
RestartSec=3
LimitNOFILE=65535

[Install]
WantedBy=multi-user.target
EOF

# Start the node
echo -e "${YELLOW}Starting the node...${NC}"
sudo systemctl daemon-reload
sudo systemctl enable localbase
sudo systemctl start localbase

echo -e "${GREEN}LocalBase testnet deployed successfully!${NC}"
echo "Check node status with: sudo systemctl status localbase"
echo "View logs with: sudo journalctl -u localbase -f"
echo
echo -e "${YELLOW}Chain ID:${NC} $CHAIN_ID"
echo -e "${YELLOW}RPC Endpoint:${NC} http://localhost:26657"
echo -e "${YELLOW}REST API:${NC} http://localhost:1317"
echo -e "${YELLOW}Validator Address:${NC} $VALIDATOR_ADDRESS"
