#!/bin/bash

# Set colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Running simple test...${NC}"

# Create a simple test file
cat > simple_test.py << 'EOF'
print("Hello, world!")
EOF

# Run the test
python simple_test.py

# Check if the test passed
if [ $? -eq 0 ]; then
  echo -e "${GREEN}Test passed!${NC}"
  exit 0
else
  echo -e "${RED}Test failed!${NC}"
  exit 1
fi
