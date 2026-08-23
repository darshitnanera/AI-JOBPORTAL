# MongoDB Setup Guide for Local Development

## Option 1: Using Docker (Recommended)

```bash
# Pull MongoDB image
docker pull mongo:latest

# Run MongoDB container
docker run -d \
  --name mongodb \
  -p 27017:27017 \
  -v mongodb_data:/data/db \
  mongo:latest

# Check if running
docker ps | grep mongodb

# To stop MongoDB
docker stop mongodb

# To start MongoDB again
docker start mongodb

# To remove MongoDB container
docker rm mongodb
```

## Option 2: Local MongoDB Installation (Ubuntu/Debian)

```bash
# Import MongoDB GPG key
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Update package lists
sudo apt-get update

# Install MongoDB
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod

# Enable MongoDB to start on boot
sudo systemctl enable mongod

# Check status
sudo systemctl status mongod

# Stop MongoDB
sudo systemctl stop mongod
```

## Option 3: Using MongoDB Atlas Cloud

1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free account
3. Create a new cluster
4. Get connection string
5. Update MONGO_URI in .env:
   ```
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
   ```

## Verify MongoDB Connection

```bash
# From the backend directory
mongosh mongodb://localhost:27017/qdc-job-portal

# If installed globally, or use Node.js to test:
node -e "const mongoose = require('mongoose'); mongoose.connect('mongodb://localhost:27017/qdc-job-portal').then(() => console.log('Connected!')).catch(e => console.log('Error:', e.message));"
```

## Environment Configuration

Ensure your `.env` file has:
```
MONGO_URI=mongodb://localhost:27017/qdc-job-portal
```

## Initial Data Seeding

After MongoDB is running, you can seed initial data:
```bash
npm run seed
```

## Troubleshooting

- **Connection refused**: Make sure MongoDB is running
- **Permission denied**: Use sudo for system-wide MongoDB installation
- **Port already in use**: Change port in .env or stop other MongoDB instances
