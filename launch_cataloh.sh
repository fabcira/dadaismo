#!/bin/bash

# Define the port to check
PORT=5055

# Check if a process is running on the specified port
PID=$(lsof -i :$PORT -t)

if [ -n "$PID" ]; then
  echo "A process is running on port $PORT (PID: $PID). Stopping the process..."
  
  # Kill the process
  kill -9 $PID
  
  if [ $? -eq 0 ]; then
    echo "Process killed successfully."
  else
    echo "Failed to kill the process."
    exit 1
  fi
else
  echo "No process is running on port $PORT."
fi

# Start the Python application
echo "Starting the application..."
nohup python app.py >> logging/log.txt 2>&1 &

if [ $? -eq 0 ]; then
  echo "Application started and logging to logging/log.txt"
else
  echo "Failed to start the application."
fi

