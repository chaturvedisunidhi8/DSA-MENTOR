#!/bin/bash

# Setup script for Ollama (Local LLM for AI responses)
# This provides GPT-level intelligence without external APIs

echo "========================================"
echo "DSA MENTOR - Ollama Setup"
echo "========================================"
echo ""

# Check if Ollama is already installed
if command -v ollama &> /dev/null; then
    echo "✓ Ollama is already installed"
    ollama --version
else
    echo "Installing Ollama..."
    curl -fsSL https://ollama.com/install.sh | sh
    
    if [ $? -eq 0 ]; then
        echo "✓ Ollama installed successfully"
    else
        echo "✗ Failed to install Ollama"
        exit 1
    fi
fi

echo ""
echo "Starting Ollama service..."
# Check if Ollama is running
if pgrep -x "ollama" > /dev/null; then
    echo "✓ Ollama service is already running"
else
    # Start Ollama in background
    nohup ollama serve > /tmp/ollama.log 2>&1 &
    sleep 3
    
    if pgrep -x "ollama" > /dev/null; then
        echo "✓ Ollama service started"
    else
        echo "✗ Failed to start Ollama service"
        echo "Try running manually: ollama serve"
        exit 1
    fi
fi

echo ""
echo "Pulling Llama 3.2 model (this may take a few minutes)..."
ollama pull llama3.2

if [ $? -eq 0 ]; then
    echo "✓ Llama 3.2 model downloaded successfully"
else
    echo "✗ Failed to download model"
    exit 1
fi

echo ""
echo "Testing Ollama setup..."
TEST_RESPONSE=$(ollama run llama3.2 "Say 'OK' if you're working" 2>&1 | head -n 1)

if [[ "$TEST_RESPONSE" == *"OK"* ]] || [[ "$TEST_RESPONSE" == *"ok"* ]]; then
    echo "✓ Ollama is working correctly!"
else
    echo "⚠ Ollama responded but check output:"
    echo "$TEST_RESPONSE"
fi

echo ""
echo "========================================"
echo "Setup Complete!"
echo "========================================"
echo ""
echo "Ollama is now running on: http://localhost:11434"
echo "Model: llama3.2"
echo ""
echo "Next steps:"
echo "1. Update your .env file with:"
echo "   OLLAMA_BASE_URL=http://localhost:11434"
echo "   OLLAMA_MODEL=llama3.2"
echo ""
echo "2. Restart your backend server"
echo ""
echo "Alternative models (optional):"
echo "  - llama3.2 (default, 3B parameters, fast)"
echo "  - llama3 (larger, 8B parameters, more accurate)"
echo "  - codellama (optimized for code)"
echo ""
echo "To switch models:"
echo "  ollama pull llama3"
echo "  Update OLLAMA_MODEL=llama3 in .env"
echo ""
echo "To stop Ollama:"
echo "  pkill ollama"
echo ""
