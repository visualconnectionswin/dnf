#!/bin/bash

# Update package lists
sudo apt-get update

# Install dependencies
sudo apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    curl \
    unzip \
    libgconf-2-4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libxss1 \
    libgbm1 \
    libnss3 \
    libx11-xcb1 \
    libxcb-dri3-0 \
    libdrm2 \
    libxcb-present0 \
    libxcb-dri3-0 \
    libxshmfence1 \
    libxrandr2 \
    libxrender1 \
    libxi6 \
    libxcursor1 \
    libxcomposite1 \
    libxdamage1 \
    libxtst6 \
    libxss1 \
    libasound2 \
    libdbus-1-3

# Download and install Chrome
wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
sudo sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list'
sudo apt-get update
sudo apt-get install -y google-chrome-stable

# Verify installation
google-chrome --version
