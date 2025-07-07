# Frequently Asked Questions (FAQ)

## Common Questions and Answers

This FAQ covers the most common questions about the Manufacturing Operations Management System. The questions are organized by topic and user type to help you find answers quickly.

## 🚀 Getting Started

### **Q: I'm new to the system. Where should I start?**

**A:** Start with the [Project Overview](01-project-overview.md) to understand what the system does, then follow the [Quick Start Guide](02-quick-start.md) to get it running. After that, check your role-specific guide:

- [Admin Dashboard Guide](04-admin-guide.md) for managers
- [Machine Operator Guide](05-machine-operator-guide.md) for production staff
- [Stock Manager Guide](06-stock-manager-guide.md) for inventory control

### **Q: What web browser should I use?**

**A:** The system works best with:

- **Chrome** (recommended) - version 90 or newer
- **Firefox** - version 88 or newer
- **Safari** - version 14 or newer
- **Edge** - version 90 or newer

### **Q: Can I use this on my phone?**

**A:** Yes, but with limitations. The system works on smartphones for viewing information and basic updates, but it's designed for tablets and computers. For data entry and detailed work, use a tablet or computer.

### **Q: How many people can use the system at once?**

**A:** The system supports up to 20 simultaneous users comfortably, with a maximum of 50 users with proper hardware. For best performance, we recommend 5-10 active users at the same time.

## 🔐 Login and Access

### **Q: I forgot my password. How do I reset it?**

**A:** Contact your administrator to reset your password. They can generate a new temporary password for you through the user management section.

### **Q: Why can't I access certain features?**

**A:** Access is controlled by your user role. Each role has different permissions:

- **Machine Operators**: Can only see their machine's jobs and update status
- **Stock Managers**: Focus on inventory functions
- **Job Coordinators**: Can create and manage jobs
- **Admins**: Have access to everything

### **Q: My account is locked. What should I do?**

**A:** This usually happens after multiple failed login attempts. Contact your administrator to unlock your account. They can also check if there were any security issues.

### **Q: Can I change my own password?**

**A:** Currently, password changes must be done by administrators. This is a security feature that may be updated in future versions.

## 📋 Job Management

### **Q: How do I create a new print job?**

**A:** If you're a Job Coordinator or Admin:

1. Click "Jobs" in the main menu
2. Click "Add New Job"
3. Fill out the 4-section form:
   - Basic Info (customer, deadline, priority)
   - Job Details (specifications, quantities)
   - Cost Calculation (materials, labor)
   - Review (summary and notes)
4. Submit for approval

### **Q: Why is my job stuck in "Pending Approval"?**

**A:** Jobs need admin approval before production starts. Check with your manager or administrator. They may need additional information or have questions about pricing or specifications.

### **Q: Can I modify a job after it's been approved?**

**A:** Minor updates (notes, progress) can be made, but major changes (specifications, pricing) require admin approval. Contact your administrator for significant modifications.

### **Q: How do I assign a job to a specific machine?**

**A:** Only administrators can assign jobs to machines. This is typically done during the approval process or can be changed later through the admin interface.

### **Q: What's the difference between job status options?**

**A:** Common statuses include:

- **Draft**: Job being created, not yet submitted
- **Pending Approval**: Waiting for admin review
- **Approved**: Ready for production
- **In Progress**: Currently being worked on
- **Completed**: Finished and ready for delivery
- **On Hold**: Temporarily paused
- **Cancelled**: Job cancelled

## 🏭 Machine Operations

### **Q: I'm a machine operator. How do I see my assigned jobs?**

**A:** Log into your tablet, select your machine (Machine 1 or Machine 2), and your assigned jobs will appear in the job queue. The current job is shown at the top.

### **Q: What should I do if I encounter a quality issue?**

**A:**

1. **Stop production immediately**
2. Click "Report Issue" on your tablet
3. Select "Quality Problem"
4. Take photos of the issue
5. Describe the problem clearly
6. Wait for supervisor response before continuing

### **Q: How do I update job progress?**

**A:** Your tablet shows progress automatically, but you can manually update by:

1. Clicking "Update Progress"
2. Entering the completion percentage
3. Adding any relevant notes
4. Confirming the update

### **Q: I can't take photos with my tablet. What's wrong?**

**A:** Common issues:

- **Camera permissions**: Check if browser has camera access
- **Storage full**: Delete old photos or clear storage
- **Network issues**: Photos need internet to upload
- Contact your supervisor if problems persist

### **Q: What if my machine breaks down during a job?**

**A:**

1. **Stop the job safely**
2. Click "Pause Job" and select "Machine Malfunction"
3. Report the issue with photos if safe to do so
4. Contact maintenance or your supervisor
5. Don't attempt repairs unless authorized

## 📦 Inventory Management

### **Q: How do I add new paper stock to the system?**

**A:** If you're a Stock Manager or Admin:

1. Go to "Inventory" section
2. Click "Add Stock"
3. Select or create the paper type
4. Enter quantity received and supplier details
5. Save the entry

### **Q: The system says we're low on paper, but I see plenty. Why?**

**A:** The system tracks digital quantities that may not match physical reality. Check:

- **Has all received stock been entered** into the system?
- **Are minimum stock levels set correctly** for that paper type?
- **Have recent usage amounts been recorded** accurately?

### **Q: How does the system track paper usage?**

**A:** Paper usage is calculated automatically when jobs are completed, based on the specifications and quantities in each job. Manual adjustments can be made by stock managers for waste, damage, or other factors.

### **Q: Can I set up automatic reorder alerts?**

**A:** Yes! Set minimum stock levels for each paper type, and the system will alert you when quantities fall below these levels. Admins can configure who receives these alerts.

## 👥 Customer Management

### **Q: How do I add a new customer to the system?**

**A:** If you have customer management permissions:

1. Go to "Customers" section
2. Click "Add Customer"
3. Fill in company details, contact information, and preferences
4. Save the new customer record

### **Q: Can customers see their job progress?**

**A:** Currently, customers don't have direct access to the system. Job updates are communicated through traditional methods (phone, email) by your staff. A customer portal may be added in future versions.

### **Q: How do I view a customer's order history?**

**A:** Click on any customer name in the customer list to view their complete profile, including all previous orders, payment history, and preferences.

## 📊 Reports and Analytics

### **Q: How do I generate a production report?**

**A:** If you're an Admin:

1. Go to "Reports" section
2. Select "Production Reports"
3. Choose date range and filters
4. Click "Generate Report"
5. Export to PDF or Excel if needed

### **Q: Can I schedule reports to be sent automatically?**

**A:** Yes! In the Reports section, you can set up daily, weekly, or monthly reports to be automatically generated and emailed to specified recipients.

### **Q: What's the difference between revenue and profit in reports?**

**A:**

- **Revenue**: Total money received from completed jobs
- **Profit**: Revenue minus all costs (materials, labor, overhead)
- **Margin**: Profit as a percentage of revenue

## 🔧 Technical Issues

### **Q: The system is running slowly. What can I do?**

**A:** Try these steps:

1. **Close other browser tabs** and applications
2. **Clear browser cache** and cookies
3. **Check internet connection** speed
4. **Restart your browser**
5. **Contact IT support** if problems persist

### **Q: I get an error message when trying to save data. Help!**

**A:** Common causes:

- **Internet connection lost**: Check network connectivity
- **Session expired**: Try logging out and back in
- **Missing required fields**: Make sure all required information is filled
- **File too large**: Reduce photo size or document size

### **Q: Real-time updates aren't working. Jobs don't update automatically.**

**A:** This could be a WebSocket connection issue:

1. **Refresh your browser page**
2. **Check if others have the same problem**
3. **Verify internet connection is stable**
4. **Contact your administrator** if widespread

### **Q: Can I use the system offline?**

**A:** No, the system requires an internet connection to function. All data is stored on the server and synchronized in real-time. Make sure you have a reliable internet connection.

## 💾 Data and Backup

### **Q: What happens if the system crashes? Is our data safe?**

**A:** The system includes automatic backup features:

- **Database backups**: Scheduled regular backups
- **Automatic saving**: Data is saved as you work
- **Recovery procedures**: Your administrator can restore from backups
- Always notify your administrator immediately if you suspect data loss

### **Q: Can I export data from the system?**

**A:** Yes, most data can be exported:

- **Reports**: Export to PDF or Excel
- **Customer lists**: Export to spreadsheet
- **Job data**: Export job details and history
- Contact your administrator for bulk data exports

### **Q: How long is data kept in the system?**

**A:** The system is designed to keep data indefinitely unless manually deleted. Historical job data, customer information, and reports are preserved for business analysis and record-keeping.

## 🔄 Updates and Maintenance

### **Q: How do I know when the system is being updated?**

**A:** System updates are announced in advance:

- **Notification on dashboard** for planned maintenance
- **Email notifications** to all users
- **Brief downtime** for major updates (usually outside business hours)

### **Q: Will my settings be lost when the system is updated?**

**A:** No, user settings, preferences, and data are preserved during updates. However, it's always good practice to note any custom configurations.

### **Q: Can I suggest new features?**

**A:** Absolutely! Contact your administrator with feature requests. They can compile user feedback and work with the development team to prioritize improvements.

## 🆘 Emergency Situations

### **Q: What should I do if the entire system goes down?**

**A:**

1. **Don't panic** - check if it's just your connection
2. **Try refreshing** your browser
3. **Check with other users** to see if it's widespread
4. **Contact your administrator** immediately
5. **Continue critical operations manually** if needed
6. **Document any work done offline** to enter later

### **Q: I accidentally deleted important data. Can it be recovered?**

**A:** Possibly. Contact your administrator immediately:

- **Don't try to recreate** the data yet
- **Note exactly what was deleted** and when
- **Stop using the system** in that area if possible
- Your administrator may be able to restore from backups

### **Q: There's a safety issue and I need to stop all production immediately.**

**A:**

1. **Stop all work immediately**
2. **Ensure everyone's safety first**
3. **Use the "Emergency Stop"** button if available in admin interface
4. **Contact emergency services** if needed
5. **Notify management** about the situation
6. **Document the issue** for investigation

## 📞 Getting Help

### **Q: Who should I contact for different types of problems?**

**A:**

- **Login issues**: Your administrator
- **How-to questions**: Check this FAQ first, then your supervisor
- **Technical problems**: IT support or system administrator
- **Business process questions**: Your manager or administrator
- **Feature requests**: Your administrator

### **Q: Is there training available for new users?**

**A:** Yes! Training resources include:

- **This documentation** (start here)
- **Role-specific guides** for your job function
- **Hands-on training** with your supervisor
- **Video tutorials** (if available from your organization)

### **Q: How can I become more efficient with the system?**

**A:**

- **Learn keyboard shortcuts** for common actions
- **Use filters and search** to find information quickly
- **Set up notifications** for important updates
- **Customize your dashboard** layout
- **Practice regularly** with all features you need

---

**Still have questions?**

- Check the [Troubleshooting Guide](14-troubleshooting.md) for technical issues
- Review the guide specific to your role
- Contact your system administrator
- Refer to the [main documentation index](README.md)
