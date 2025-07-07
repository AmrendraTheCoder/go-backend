# Admin Dashboard Guide

## Complete Guide for Administrators and Managers

This guide covers everything administrators and managers need to know about using the Manufacturing Operations Management System. As an admin, you have access to all system functions and are responsible for overseeing operations, managing users, and making business decisions.

## 🎯 Admin Role Overview

### **What Admins Can Do:**

- View complete business overview dashboard
- Approve or reject print jobs
- Manage user accounts and permissions
- Set up customers and pricing
- Monitor inventory levels
- Generate reports and analytics
- Configure system settings
- View real-time operations status

### **Your Responsibilities:**

- Daily oversight of all operations
- Job approval and pricing decisions
- User management and security
- Business performance monitoring
- Quality control oversight
- System maintenance coordination

## 🏠 Dashboard Overview

### **Accessing the Dashboard**

1. Open your web browser
2. Go to `http://localhost:3000` (or your system's URL)
3. Login with your admin credentials
4. You'll see the main dashboard immediately

### **Dashboard Layout**

#### **Top Navigation Bar**

- **Company Logo/Name**: Ganpathi Overseas
- **User Menu**: Your profile and logout option
- **Notifications**: Bell icon with alerts
- **Search**: Quick search across all data

#### **Side Menu** (Main Navigation)

- 📊 **Dashboard** - Overview and key metrics
- 📋 **Jobs** - Job management and approval
- 👥 **Customers** - Customer database
- 📦 **Inventory** - Stock levels and materials
- 👤 **Users** - Employee account management
- 📄 **Paper Types** - Material specifications
- 📈 **Reports** - Analytics and reporting
- ⚙️ **Settings** - System configuration

### **Main Dashboard Widgets**

#### **Key Performance Indicators (KPIs)**

- **Active Jobs**: Number of jobs currently in progress
- **Pending Approvals**: Jobs waiting for your approval
- **Today's Revenue**: Earnings from completed jobs today
- **Stock Alerts**: Items running low on inventory

#### **Quick Action Buttons**

- **Approve Jobs**: Direct link to pending approvals
- **Add Customer**: Quick customer creation
- **View Reports**: Access to latest reports
- **Emergency Stop**: Halt all operations if needed

#### **Real-Time Status**

- **Machine 1 Status**: Current job and progress
- **Machine 2 Status**: Current job and progress
- **Staff Online**: Who's currently logged in
- **System Health**: Server and database status

## 📋 Job Management & Approval

### **Job Approval Workflow**

#### **Finding Jobs to Approve**

1. Click **"Jobs"** in the side menu
2. Look for the **"Pending Approval"** filter
3. You'll see a list of jobs waiting for approval
4. Each job shows:
   - Customer name
   - Job description
   - Estimated cost
   - Deadline
   - Priority level

#### **Reviewing a Job**

1. **Click on any job** to open detailed view
2. **Review the 4 sections**:
   - **Basic Info**: Customer, deadline, priority
   - **Job Details**: Specifications, quantities, materials
   - **Cost Calculation**: Materials, labor, markup
   - **Review**: Summary and notes

#### **Making Approval Decisions**

**To Approve a Job:**

1. Review all sections carefully
2. Check if pricing is correct
3. Verify material availability
4. Click **"Approve Job"** button
5. Add approval notes if needed
6. Job moves to production queue

**To Reject a Job:**

1. Click **"Reject Job"** button
2. **Must provide reason** for rejection
3. Common reasons:
   - Insufficient materials
   - Unrealistic deadline
   - Pricing issues
   - Quality concerns
4. Job returns to coordinator for revision

**To Request Changes:**

1. Click **"Request Changes"** button
2. Specify what needs to be modified:
   - Adjust pricing
   - Change deadline
   - Modify specifications
   - Update materials
3. Add detailed comments
4. Job returns to coordinator with your feedback

### **Job Monitoring After Approval**

#### **Tracking Progress**

- View job status in real-time
- See which machine is working on what
- Monitor time estimates vs. actual time
- Check quality milestones

#### **Managing Delays**

- Receive alerts for jobs running behind
- Reassign priorities if needed
- Communicate with customers about delays
- Adjust resource allocation

## 👥 Customer Management

### **Customer Database**

#### **Viewing Customers**

1. Click **"Customers"** in side menu
2. See complete customer list with:
   - Company name and contact person
   - Phone and email
   - Total orders and revenue
   - Last order date
   - Payment status

#### **Adding New Customers**

1. Click **"Add Customer"** button
2. Fill in required information:
   - **Company Details**: Name, address, business type
   - **Contact Information**: Primary contact, phone, email
   - **Business Information**: Payment terms, special requirements
   - **Preferences**: Default paper types, quality standards
3. Click **"Save Customer"**

#### **Customer Profiles**

Click on any customer to view:

- **Order History**: All previous jobs
- **Payment History**: Invoices and payments
- **Preferences**: Saved specifications and materials
- **Notes**: Important information about the customer
- **Performance**: Quality ratings and feedback

### **Customer Communication**

- Send status updates via email
- Share job progress photos
- Provide delivery confirmations
- Handle customer inquiries

## 📦 Inventory Management

### **Stock Overview**

#### **Viewing Inventory**

1. Click **"Inventory"** in side menu
2. See all paper stock with:
   - Paper type and specifications
   - Current quantity
   - Unit of measurement
   - Minimum stock level
   - Supplier information

#### **Stock Alerts**

- **Red Alert**: Stock below minimum level
- **Yellow Warning**: Stock getting low
- **Green Normal**: Adequate stock levels

### **Managing Stock Levels**

#### **Adding New Stock**

1. Click **"Add Stock"** button
2. Select or create paper type
3. Enter quantity received
4. Add supplier and cost information
5. Set minimum stock level
6. Save the entry

#### **Updating Existing Stock**

- Adjust quantities manually if needed
- Update minimum stock levels
- Change supplier information
- Modify cost data

### **Reorder Management**

- Set automatic reorder points
- Generate purchase orders
- Track supplier deliveries
- Manage vendor relationships

## 👤 User Management

### **Employee Accounts**

#### **Viewing Users**

1. Click **"Users"** in side menu
2. See all employee accounts:
   - Name and email
   - Role and permissions
   - Last login
   - Account status (active/inactive)

#### **Adding New Users**

1. Click **"Add User"** button
2. Enter employee information:
   - **Personal Details**: Name, email, phone
   - **Role Selection**: Choose from available roles
   - **Permissions**: Set specific access rights
   - **Initial Password**: System generates secure password
3. Save and provide login details to employee

#### **User Roles and Permissions**

**Available Roles:**

- **Administrator**: Full system access (your role)
- **Manager**: Most features except user management
- **Job Coordinator**: Job creation and management
- **Machine Operator**: Machine-specific interfaces
- **Stock Manager**: Inventory-focused access
- **Quality Checker**: Quality control functions

### **Security Management**

#### **Password Policies**

- Enforce strong passwords
- Set password expiration
- Require regular updates
- Monitor failed login attempts

#### **Access Control**

- Review user permissions regularly
- Deactivate accounts for former employees
- Monitor system access logs
- Set up role-based restrictions

## 📈 Reports and Analytics

### **Standard Reports**

#### **Production Reports**

- **Daily Production**: Jobs completed each day
- **Machine Efficiency**: Performance by machine
- **Quality Metrics**: Defect rates and issues
- **Turnaround Times**: Average completion times

#### **Financial Reports**

- **Revenue Summary**: Daily, weekly, monthly earnings
- **Cost Analysis**: Materials vs. labor costs
- **Profit Margins**: By job type and customer
- **Outstanding Payments**: Unpaid invoices

#### **Inventory Reports**

- **Stock Levels**: Current inventory status
- **Usage Patterns**: Material consumption trends
- **Reorder Recommendations**: What to purchase
- **Waste Analysis**: Material efficiency

### **Custom Reports**

#### **Creating Custom Reports**

1. Click **"Reports"** → **"Custom Report"**
2. Select data sources:
   - Jobs, customers, inventory, users
3. Choose date ranges
4. Select metrics and filters
5. Generate and save report

#### **Scheduled Reports**

- Set up daily/weekly/monthly reports
- Email reports to stakeholders
- Save reports for historical comparison
- Export to Excel or PDF

## ⚙️ System Settings

### **General Configuration**

#### **Company Information**

- Business name and address
- Contact information
- Logo and branding
- Operating hours

#### **Business Rules**

- Default markup percentages
- Standard lead times
- Quality standards
- Pricing formulas

### **Machine Configuration**

#### **Machine Settings**

- Machine capabilities and specifications
- Operating parameters
- Maintenance schedules
- Performance targets

#### **Job Assignment Rules**

- Automatic vs. manual assignment
- Priority handling
- Load balancing
- Overtime policies

### **Notification Settings**

#### **Alert Configuration**

- Stock level alerts
- Job deadline warnings
- Quality issue notifications
- System maintenance reminders

#### **Communication Preferences**

- Email notification settings
- SMS alerts for critical issues
- Dashboard notification display
- Report delivery schedules

## 🔔 Daily Admin Tasks

### **Morning Routine (15-20 minutes)**

1. **Check Dashboard** - Review overnight activity
2. **Review Alerts** - Address any urgent issues
3. **Approve Jobs** - Handle pending approvals
4. **Check Machine Status** - Ensure all systems operational
5. **Monitor Stock** - Review inventory alerts

### **Throughout the Day**

- **Monitor Real-time Updates** - Watch job progress
- **Handle Approvals** - Review new job requests
- **Respond to Issues** - Address problems as they arise
- **Customer Communication** - Handle inquiries and updates

### **End of Day (10-15 minutes)**

1. **Review Daily Performance** - Check KPIs and metrics
2. **Plan Tomorrow** - Review upcoming jobs and priorities
3. **Check System Health** - Ensure everything running smoothly
4. **Backup Verification** - Confirm data backup completed

## 📞 Emergency Procedures

### **System Issues**

#### **If System Goes Down**

1. **Don't Panic** - Check if internet/power is working
2. **Try Refresh** - Reload browser page
3. **Check Server** - Is the backend terminal still running?
4. **Contact IT Support** - If you can't resolve quickly
5. **Communicate** - Inform staff about the issue

#### **Data Issues**

- **Backup Recovery**: How to restore from backups
- **Data Corruption**: Steps to minimize damage
- **User Lockouts**: Resetting passwords and access

### **Business Emergencies**

#### **Rush Orders**

- Override normal approval process
- Reallocate resources quickly
- Communicate with affected customers
- Document emergency decisions

#### **Quality Issues**

- Stop production immediately
- Investigate root cause
- Communicate with customer
- Implement corrective measures

## 💡 Pro Tips for Admins

### **Efficiency Tips**

- **Use Keyboard Shortcuts**: Learn common shortcuts
- **Set Up Filters**: Save frequently used search filters
- **Customize Dashboard**: Arrange widgets for your workflow
- **Batch Operations**: Handle similar tasks together

### **Best Practices**

- **Regular Reviews**: Weekly analysis of all metrics
- **Proactive Communication**: Update customers before they ask
- **Document Decisions**: Keep notes on approvals and changes
- **Team Feedback**: Regular check-ins with staff

### **Performance Monitoring**

- **Watch Trends**: Look for patterns in data
- **Benchmark Performance**: Compare to previous periods
- **Identify Bottlenecks**: Find process improvement opportunities
- **Celebrate Success**: Recognize good performance

## 🆘 Troubleshooting Common Issues

### **Job Approval Problems**

- **Missing Information**: Request details from coordinator
- **Pricing Errors**: Check calculation formulas
- **Material Unavailable**: Coordinate with stock manager
- **Timeline Conflicts**: Adjust priorities or deadlines

### **User Access Issues**

- **Forgotten Passwords**: Reset using admin tools
- **Permission Problems**: Review and update user roles
- **Account Lockouts**: Unlock accounts and investigate cause
- **New Employee Setup**: Follow standard onboarding process

### **Report Generation Problems**

- **Slow Loading**: Check date ranges and data volume
- **Missing Data**: Verify data entry completeness
- **Export Issues**: Try different formats or smaller ranges
- **Scheduling Problems**: Check email settings and connectivity

---

**Related Guides:**

- [Job Coordinator Guide](07-job-coordinator-guide.md) - Understanding the job creation process
- [Machine Operator Guide](05-machine-operator-guide.md) - What operators see and do
- [Stock Manager Guide](06-stock-manager-guide.md) - Inventory management details
- [Troubleshooting Guide](14-troubleshooting.md) - Technical problem resolution
