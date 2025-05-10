#!/bin/bash

# Run Jest tests with coverage
echo "Running Jest tests..."
npm test -- --coverage

# Check if tests passed
if [ $? -eq 0 ]; then
  echo "All tests passed!"
  
  # Open coverage report
  echo "Opening coverage report..."
  open coverage/lcov-report/index.html
else
  echo "Tests failed. Please check the output above for details."
  exit 1
fi
