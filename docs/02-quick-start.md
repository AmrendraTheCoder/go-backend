# Quick Start Guide
## Getting Your Manufacturing System Running

This guide will help you get the Manufacturing Operations Management System up and running, even if you have no coding experience. Follow these steps carefully, and you'll have the system working in about 30-45 minutes.

## 📋 Before You Start

### What You'll Need:
1. **A Computer or Laptop** - Windows, Mac, or Linux
2. **Internet Connection** - For downloading required software
3. **About 45 minutes** - To complete the setup process
4. **Admin Rights** - Ability to install software on your computer

### Quick Check:
- [ ] Computer is connected to internet
- [ ] You can install new software (ask IT if unsure)
- [ ] You have at least 2GB free disk space

## 🚀 Step-by-Step Setup

### Step 1: Download Required Software

The system needs two pieces of software to run:

#### **Node.js** (The Engine)
1. Go to [nodejs.org](https://nodejs.org)
2. Click the **green button** that says "LTS" (Long Term Support)
3. Download and install it like any other program
4. When installation finishes, **restart your computer**

#### **MongoDB** (The Database)
1. Go to [mongodb.com/try/download/community](https://www.mongodb.com/try/download/community)
2. Select your operating system (Windows/Mac/Linux)
3. Download and install following their instructions
4. **Important**: Choose "Install as Service" if asked

### Step 2: Get the System Files

#### Option A: Download from GitHub (Easier)
1. Go to your project's GitHub page
2. Click the green **"Code"** button
3. Select **"Download ZIP"**
4. Extract the ZIP file to a folder like `Documents/PrintingSystem`

#### Option B: Using Git (If you have it)
```bash
git clone [your-repository-url]
cd go-backend
```

### Step 3: Open Terminal/Command Prompt

#### **On Windows:**
1. Press `Windows Key + R`
2. Type `cmd` and press Enter
3. Navigate to your project folder:
   ```
   cd Documents\PrintingSystem\go-backend
   ```

#### **On Mac:**
1. Press `Cmd + Space`
2. Type `Terminal` and press Enter
3. Navigate to your project folder:
   ```
   cd Documents/PrintingSystem/go-backend
   ```

#### **On Linux:**
1. Press `Ctrl + Alt + T`
2. Navigate to your project folder:
   ```
   cd Documents/PrintingSystem/go-backend
   ```

### Step 4: Install System Dependencies

In your terminal/command prompt, type these commands one by one:

```bash
# Install server dependencies
cd server
npm install
```

Wait for this to finish (may take 2-5 minutes), then:

```bash
# Install client dependencies
cd ../client
npm install
```

**Note**: If you see any warnings in red text, that's usually okay. Only worry if the process stops completely.

### Step 5: Set Up the Database

#### **Start MongoDB**
- **Windows**: MongoDB should start automatically if installed as service
- **Mac**: In terminal, type `brew services start mongodb/brew/mongodb-community`
- **Linux**: Type `sudo systemctl start mongod`

#### **Create Database Connection**
1. Go back to the `server` folder:
   ```bash
   cd ../server
   ```

2. Create a file called `.env` (note the dot at the beginning):
   ```bash
   # On Windows
   echo. > .env
   
   # On Mac/Linux
   touch .env
   ```

3. Open the `.env` file in any text editor and add:
   ```
   MONGODB_URI=mongodb://localhost:27017/ganpathi_printing
   JWT_SECRET=your-secret-key-change-this-in-production
   PORT=5002
   ```

### Step 6: Start the System

#### **Start the Backend Server**
In your terminal, make sure you're in the `server` folder and run:

```bash
npm start
```

You should see messages like:
```
✅ Server running on port 5002
✅ MongoDB connected successfully
✅ Socket.io server initialized
```

**Keep this terminal window open!** The server needs to keep running.

#### **Start the Frontend (In a New Terminal)**
1. Open a **new** terminal/command prompt window
2. Navigate to the client folder:
   ```bash
   cd Documents/PrintingSystem/go-backend/client
   ```
3. Start the frontend:
   ```bash
   npm start
   ```

Your web browser should automatically open to `http://localhost:3000`

## 🎉 First Time Setup

### Create Your Admin Account

When you first open the system:

1. **Register Your First User**:
   - Click "Register" or "Sign Up"
   - Enter your details:
     - Name: Your full name
     - Email: Your work email
     - Password: Choose a strong password
     - Role: Select "Administrator"

2. **Login**:
   - Use the email and password you just created
   - You should see the admin dashboard

### Add Sample Data (Optional)

To test the system with sample data:

1. Go to the terminal where your server is running
2. Press `Ctrl + C` to stop the server
3. Run the setup command:
   ```bash
   npm run setup-sample-data
   ```
4. Start the server again:
   ```bash
   npm start
   ```

This adds sample customers, paper types, and a few test jobs.

## 🔍 Verify Everything Is Working

### Check These Pages:

1. **Dashboard** - Should show overview statistics
2. **Jobs** - Should be empty or show sample jobs
3. **Customers** - Should show sample customers if you ran setup
4. **Inventory** - Should show paper stock information
5. **Users** - Should show your admin account

### Test Real-Time Features:

1. Open the system in two browser tabs
2. Create a new job in one tab
3. Check if it appears in the other tab automatically

## 🛠️ Common Setup Issues

### **"npm is not recognized" Error**
- **Solution**: Restart your computer after installing Node.js
- **Or**: Add Node.js to your system PATH (Google "add Node.js to PATH [your OS]")

### **"MongoDB connection failed"**
- **Check**: Is MongoDB running?
  - Windows: Check Services for "MongoDB"
  - Mac/Linux: Run `ps aux | grep mongod`
- **Solution**: Start MongoDB service manually

### **"Port 5002 is in use"**
- **Solution**: Change the PORT in your `.env` file to a different number like 5003

### **Page Won't Load**
- **Check**: Are both frontend and backend running?
- **Check**: Is your internet connection working?
- **Try**: Refresh the page or clear browser cache

### **Can't Create Admin Account**
- **Check**: Is the backend server running and connected to database?
- **Try**: Look at the terminal for error messages
- **Solution**: Restart the backend server

## 📱 Accessing From Other Devices

### **From Tablets (For Machine Operators):**
1. Find your computer's IP address:
   - Windows: `ipconfig` in command prompt
   - Mac/Linux: `ifconfig` in terminal
2. On the tablet, open web browser and go to:
   `http://[YOUR-IP-ADDRESS]:3000`
3. Example: `http://192.168.1.100:3000`

### **From Other Computers:**
Same process as tablets - use your computer's IP address instead of `localhost`

## 🔄 Daily Startup

Once everything is set up, to start the system each day:

1. **Start MongoDB** (if not auto-starting)
2. **Open Terminal/Command Prompt**
3. **Navigate to server folder**:
   ```bash
   cd Documents/PrintingSystem/go-backend/server
   ```
4. **Start backend**:
   ```bash
   npm start
   ```
5. **Open new terminal for frontend**:
   ```bash
   cd Documents/PrintingSystem/go-backend/client
   npm start
   ```

## 💡 Pro Tips

- **Bookmark the system**: Add `http://localhost:3000` to your browser bookmarks
- **Keep terminals open**: Don't close the terminal windows while using the system
- **Regular backups**: Ask your IT person to set up automatic database backups
- **User training**: Have each employee go through their specific user guide

## 🆘 Need Help?

If you get stuck:

1. **Check**: [Troubleshooting Guide](14-troubleshooting.md)
2. **Review**: [FAQ](15-faq.md)
3. **Look at**: Terminal/command prompt for error messages
4. **Contact**: Your system administrator or IT support

---

**Next Steps**: Once the system is running, check out the [System Requirements](03-system-requirements.md) to ensure optimal performance, then move on to the appropriate user guide for your role. 