# API Documentation

## Understanding the System's Backend Communication

This document explains how different parts of the Manufacturing Operations Management System communicate with each other. While you don't need to understand programming to use the system, this information can be helpful for troubleshooting, integration with other systems, or working with developers.

## 🌐 What is an API?

### **Simple Explanation**

An **API (Application Programming Interface)** is like a waiter in a restaurant:

- You (the frontend) tell the waiter (API) what you want
- The waiter goes to the kitchen (database) to get it
- The waiter brings back your order (data)

### **In Our System**

- **Frontend**: The web pages you see and interact with
- **Backend API**: The server that processes requests and manages data
- **Database**: Where all information is stored

## 🔧 API Overview

### **Base URL**

All API requests start with: `http://localhost:5002/api`

### **Authentication**

Most API endpoints require you to be logged in and provide a **JWT token** (like a digital key) with each request.

### **Response Format**

All responses come in **JSON format** (structured text data that computers can easily read).

### **Status Codes**

- **200**: Success
- **201**: Created successfully
- **400**: Bad request (missing information)
- **401**: Unauthorized (need to login)
- **403**: Forbidden (don't have permission)
- **404**: Not found
- **500**: Server error

## 🔐 Authentication Endpoints

### **Login**

**Purpose**: User authentication and token generation

- **Method**: POST
- **URL**: `/api/auth/login`
- **What it does**: Checks username/password and gives you access
- **Required data**:
  - Email address
  - Password
- **Returns**: JWT token for accessing other features

### **Register**

**Purpose**: Create new user account

- **Method**: POST
- **URL**: `/api/auth/register`
- **What it does**: Creates a new employee account
- **Required data**:
  - Name, email, password
  - Role (admin, operator, etc.)
- **Returns**: Success confirmation

### **Refresh Token**

**Purpose**: Get a new access token when old one expires

- **Method**: POST
- **URL**: `/api/auth/refresh`
- **What it does**: Extends your login session
- **Returns**: New JWT token

## 📋 Job Management Endpoints

### **Get All Jobs**

**Purpose**: Retrieve list of print jobs

- **Method**: GET
- **URL**: `/api/jobs`
- **What it does**: Shows all jobs with filters
- **Filters available**:
  - Status (pending, approved, in-progress, completed)
  - Machine assignment
  - Date range
  - Customer
- **Returns**: List of jobs with details

### **Get Single Job**

**Purpose**: Get detailed information about one job

- **Method**: GET
- **URL**: `/api/jobs/:id`
- **What it does**: Shows complete job details
- **Returns**: All job information including:
  - Basic info, job details, cost calculation
  - Progress updates, photos, notes

### **Create New Job**

**Purpose**: Add a new print job to the system

- **Method**: POST
- **URL**: `/api/jobs`
- **What it does**: Creates new job from 4-section form
- **Required data**:
  - Customer information
  - Job specifications
  - Material requirements
  - Deadline and priority
- **Returns**: New job ID and details

### **Update Job**

**Purpose**: Modify existing job information

- **Method**: PUT
- **URL**: `/api/jobs/:id`
- **What it does**: Updates job details, status, or assignments
- **Can update**:
  - Job status
  - Machine assignment
  - Progress percentage
  - Notes and comments
- **Returns**: Updated job information

### **Approve/Reject Job**

**Purpose**: Admin approval workflow

- **Method**: PATCH
- **URL**: `/api/jobs/:id/approve` or `/api/jobs/:id/reject`
- **What it does**: Changes job status based on admin decision
- **Required data**:
  - Approval/rejection reason
  - Any modifications to pricing or specs
- **Returns**: Updated job status

## 👥 Customer Management Endpoints

### **Get All Customers**

**Purpose**: Retrieve customer database

- **Method**: GET
- **URL**: `/api/customers`
- **What it does**: Lists all customers with basic info
- **Filters available**:
  - Search by name
  - Filter by status
  - Sort by various fields
- **Returns**: Customer list with contact details

### **Get Customer Details**

**Purpose**: View complete customer profile

- **Method**: GET
- **URL**: `/api/customers/:id`
- **What it does**: Shows customer profile with order history
- **Returns**: Complete customer information including:
  - Contact details
  - Order history
  - Payment information
  - Preferences and notes

### **Add New Customer**

**Purpose**: Create customer record

- **Method**: POST
- **URL**: `/api/customers`
- **What it does**: Adds new customer to database
- **Required data**:
  - Company name and contact person
  - Phone, email, address
  - Business type and preferences
- **Returns**: New customer ID and details

### **Update Customer**

**Purpose**: Modify customer information

- **Method**: PUT
- **URL**: `/api/customers/:id`
- **What it does**: Updates customer profile information
- **Returns**: Updated customer details

## 📦 Inventory Management Endpoints

### **Get Inventory**

**Purpose**: View current stock levels

- **Method**: GET
- **URL**: `/api/inventory`
- **What it does**: Shows all paper stock and materials
- **Filters available**:
  - Paper type
  - Stock level (low, normal, high)
  - Supplier
- **Returns**: Complete inventory with quantities

### **Add Stock**

**Purpose**: Record new inventory receipt

- **Method**: POST
- **URL**: `/api/inventory`
- **What it does**: Adds new stock to inventory
- **Required data**:
  - Paper type and specifications
  - Quantity and units
  - Supplier and cost information
- **Returns**: Updated inventory record

### **Update Stock Levels**

**Purpose**: Adjust inventory quantities

- **Method**: PUT
- **URL**: `/api/inventory/:id`
- **What it does**: Updates stock quantities (usage, adjustments)
- **Returns**: Updated stock information

### **Stock Alerts**

**Purpose**: Get low stock notifications

- **Method**: GET
- **URL**: `/api/inventory/alerts`
- **What it does**: Lists items below minimum stock levels
- **Returns**: Items needing reorder

## 📄 Paper Types Endpoints

### **Get Paper Types**

**Purpose**: List available paper specifications

- **Method**: GET
- **URL**: `/api/papertypes`
- **What it does**: Shows all configured paper types
- **Returns**: Paper types with GSM options and sizes

### **Add Paper Type**

**Purpose**: Configure new paper specification

- **Method**: POST
- **URL**: `/api/papertypes`
- **What it does**: Adds new paper type to system
- **Required data**:
  - Paper type name
  - Available GSM weights
  - Standard sizes
  - Pricing information
- **Returns**: New paper type configuration

## 👤 User Management Endpoints

### **Get Users**

**Purpose**: List all system users

- **Method**: GET
- **URL**: `/api/users`
- **What it does**: Shows employee accounts (admin only)
- **Returns**: User list with roles and status

### **Create User**

**Purpose**: Add new employee account

- **Method**: POST
- **URL**: `/api/users`
- **What it does**: Creates new user account (admin only)
- **Required data**:
  - Name, email, role
  - Initial password
  - Permissions
- **Returns**: New user account details

### **Update User**

**Purpose**: Modify user account

- **Method**: PUT
- **URL**: `/api/users/:id`
- **What it does**: Updates user information, role, or status
- **Returns**: Updated user information

## 🔄 Real-Time Communication

### **WebSocket Connection**

**Purpose**: Live updates and notifications

- **Protocol**: WebSocket (Socket.io)
- **URL**: `ws://localhost:5002`
- **What it does**: Enables real-time updates without page refresh
- **Events handled**:
  - Job status changes
  - New job assignments
  - Inventory alerts
  - System notifications

### **Real-Time Events**

#### **Job Updates**

- **Event**: `job_status_update`
- **Triggers**: When job status changes
- **Data sent**: Job ID, new status, timestamp
- **Recipients**: All users watching that job

#### **Inventory Alerts**

- **Event**: `inventory_alert`
- **Triggers**: When stock goes below minimum
- **Data sent**: Item details, current quantity
- **Recipients**: Admins and stock managers

#### **Machine Status**

- **Event**: `machine_update`
- **Triggers**: When machine status changes
- **Data sent**: Machine ID, status, current job
- **Recipients**: Operators and supervisors

## 📊 Analytics and Reporting

### **Dashboard Data**

**Purpose**: Get summary statistics for dashboard

- **Method**: GET
- **URL**: `/api/analytics/dashboard`
- **What it does**: Provides KPI data for admin dashboard
- **Returns**:
  - Active jobs count
  - Today's revenue
  - Pending approvals
  - Stock alerts

### **Production Reports**

**Purpose**: Generate production analysis

- **Method**: GET
- **URL**: `/api/analytics/production`
- **Parameters**: Date range, machine, customer
- **What it does**: Analyzes production performance
- **Returns**: Detailed production metrics

### **Financial Reports**

**Purpose**: Revenue and cost analysis

- **Method**: GET
- **URL**: `/api/analytics/financial`
- **Parameters**: Date range, customer, job type
- **What it does**: Calculates financial performance
- **Returns**: Revenue, costs, and profit data

## 🔒 Security Features

### **Authentication Requirements**

All endpoints except login/register require:

- **Valid JWT token** in request header
- **Appropriate user role** for the action
- **Active user account** (not disabled)

### **Role-Based Access**

- **Admin**: Access to all endpoints
- **Manager**: Most endpoints except user management
- **Job Coordinator**: Job and customer endpoints
- **Machine Operator**: Limited to job status updates
- **Stock Manager**: Inventory and paper type endpoints

### **Rate Limiting**

- **Login attempts**: Limited to prevent brute force attacks
- **API requests**: Limited per user to prevent abuse
- **File uploads**: Size and type restrictions

## 📁 File Upload Endpoints

### **Job Photos**

**Purpose**: Upload photos for job documentation

- **Method**: POST
- **URL**: `/api/jobs/:id/photos`
- **What it does**: Stores photos linked to specific jobs
- **File types**: JPG, PNG, WebP
- **Max size**: 10MB per photo
- **Returns**: Photo URL and metadata

### **Customer Documents**

**Purpose**: Upload customer-related files

- **Method**: POST
- **URL**: `/api/customers/:id/documents`
- **What it does**: Stores files linked to customer accounts
- **File types**: PDF, DOC, images
- **Returns**: Document URL and details

## 🛠️ Utility Endpoints

### **Health Check**

**Purpose**: Verify system status

- **Method**: GET
- **URL**: `/api/health`
- **What it does**: Checks if all system components are working
- **Returns**: Status of server, database, and services

### **System Info**

**Purpose**: Get system configuration

- **Method**: GET
- **URL**: `/api/system/info`
- **What it does**: Provides system version and configuration
- **Returns**: Version numbers, features enabled

## 💡 Working with the API

### **For Non-Developers**

You typically won't interact with these endpoints directly. Instead:

- **Use the web interface** - It automatically makes these API calls
- **Understand the flow** - Helps with troubleshooting
- **Know the capabilities** - Useful for feature requests

### **For Integration**

If you want to connect other systems:

- **Use the documented endpoints** above
- **Include proper authentication** tokens
- **Handle errors gracefully** with appropriate retry logic
- **Respect rate limits** to avoid being blocked

### **For Troubleshooting**

When something isn't working:

- **Check network connectivity** to the API server
- **Verify authentication** tokens are valid
- **Look at browser developer tools** for error messages
- **Contact technical support** with specific error details

---

**Related Documentation:**

- [Database Structure](12-database-structure.md) - How data is organized
- [Real-time Features](13-realtime-features.md) - Live updates explained
- [Troubleshooting Guide](14-troubleshooting.md) - Common problems and solutions
- [System Requirements](03-system-requirements.md) - Technical requirements
