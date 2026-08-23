#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   AI Job Portal - Local Development Server Startup${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}\n"

# Check if Docker MongoDB should be started
if [ "$1" = "--with-docker" ]; then
    echo -e "${YELLOW}Starting MongoDB with Docker...${NC}"
    docker run -d --name mongodb -p 27017:27017 -v mongodb_data:/data/db mongo:latest 2>/dev/null
    sleep 2
    echo -e "${GREEN}✓ MongoDB container started${NC}\n"
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js found${NC}"
echo -e "${GREEN}✓ npm version: $(npm -v)${NC}\n"

# Install backend dependencies if needed
echo -e "${YELLOW}Checking backend dependencies...${NC}"
if [ ! -d "backend/node_modules" ]; then
    echo -e "${YELLOW}Installing backend dependencies...${NC}"
    cd backend
    npm install
    cd ..
fi
echo -e "${GREEN}✓ Backend dependencies ready${NC}\n"

# Install frontend dependencies if needed
echo -e "${YELLOW}Checking frontend dependencies...${NC}"
if [ ! -d "frontend/node_modules" ]; then
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    cd frontend
    npm install
    cd ..
fi
echo -e "${GREEN}✓ Frontend dependencies ready${NC}\n"

# Check environment files
echo -e "${YELLOW}Checking environment files...${NC}"
if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}Creating backend/.env from .env.example${NC}"
    cp backend/.env.example backend/.env
    echo -e "${YELLOW}⚠ Remember to configure backend/.env with your API keys${NC}"
fi

if [ ! -f "frontend/.env.development" ]; then
    echo -e "${YELLOW}Creating frontend/.env.development${NC}"
    cp frontend/.env.example frontend/.env.development 2>/dev/null || echo "VITE_API_BASE_URL=http://localhost:5000" > frontend/.env.development
fi
echo -e "${GREEN}✓ Environment files ready${NC}\n"

# Start servers
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Starting servers...${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}\n"

# Create background process file to track PIDs
PID_FILE="/tmp/qdc_servers.pid"
> "$PID_FILE"

# Start backend
echo -e "${YELLOW}Starting backend server on http://localhost:5000${NC}"
cd backend
npm start > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID >> "$PID_FILE"
cd ..
sleep 2

# Start frontend
echo -e "${YELLOW}Starting frontend server on http://localhost:5173${NC}"
cd frontend
npm run dev > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID >> "$PID_FILE"
cd ..
sleep 3

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Servers started successfully!${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}\n"

echo -e "${GREEN}Backend Server:${NC}"
echo -e "  URL: ${BLUE}http://localhost:5000${NC}"
echo -e "  Log: tail -f /tmp/backend.log\n"

echo -e "${GREEN}Frontend Server:${NC}"
echo -e "  URL: ${BLUE}http://localhost:5173${NC}"
echo -e "  Log: tail -f /tmp/frontend.log\n"

echo -e "${YELLOW}Opening in browser...${NC}"
if command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:5173 &
elif command -v open &> /dev/null; then
    open http://localhost:5173 &
fi

echo -e "${GREEN}Press Ctrl+C to stop servers${NC}"
echo -e "${YELLOW}To stop manually: kill $BACKEND_PID $FRONTEND_PID${NC}\n"

# Cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}Stopping servers...${NC}"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    echo -e "${GREEN}✓ Servers stopped${NC}"

    if [ "$1" = "--with-docker" ]; then
        echo -e "${YELLOW}Stopping MongoDB container...${NC}"
        docker stop mongodb 2>/dev/null
        echo -e "${GREEN}✓ MongoDB stopped${NC}"
    fi
}

trap cleanup EXIT

# Keep script running
wait
