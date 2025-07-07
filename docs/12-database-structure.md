# Database Structure

## How Data Is Organized

This document explains how information is stored and organized in the Ganpathi Overseas Manufacturing System database, written in simple terms.

## Think of It Like a Library

Imagine the database like a well-organized library:

- **Books** are like individual records (customers, jobs, inventory items)
- **Sections** are like different tables (customer section, job section, etc.)
- **Card catalogs** are like indexes that help find information quickly
- **Library rules** are like relationships that keep everything organized

## Main Data Categories

### 1. User Information (The Staff Directory)

**What it contains**:

- User accounts and login credentials
- Names, email addresses, and contact information
- Job roles and permissions (admin, manager, coordinator, operator)
- Password security and login history

**Think of it as**: Employee ID cards and security clearances

**Key Information Stored**:

- Username and encrypted password
- Full name and contact details
- Role-based permissions
- Account creation and last login dates
- Active/inactive status

### 2. Customer Information (The Client Directory)

**What it contains**:

- Complete customer profiles and contact information
- Company details and billing addresses
- Order history and preferences
- Credit limits and payment terms
- Communication preferences

**Think of it as**: A detailed address book with business relationships

**Key Information Stored**:

- Company name and primary contact person
- Complete address and contact information
- Email preferences and communication history
- Account balance and payment history
- Customer status (active, inactive, on hold)

### 3. Job Information (The Order Records)

**What it contains**:

- Complete job specifications and requirements
- Customer assignments and pricing information
- Production schedules and status tracking
- File attachments and artwork references
- Quality notes and completion records

**Think of it as**: Detailed work orders with complete instructions

**Key Information Stored**:

- Job number and descriptive title
- Customer assignment and contact information
- Technical specifications (size, quantity, paper type)
- Pricing, costs, and profitability data
- Timeline, priority, and status information
- File references and quality notes

### 4. Inventory Information (The Stock Records)

**What it contains**:

- Paper types and specifications
- Current stock levels and location information
- Supplier details and ordering information
- Usage tracking and waste records
- Cost information and reorder points

**Think of it as**: A detailed warehouse inventory system

**Key Information Stored**:

- Paper type, size, and GSM specifications
- Current quantity in stock
- Minimum stock levels and reorder points
- Supplier information and lead times
- Cost per unit and total value
- Usage history and trends

### 5. Machine Information (The Equipment Records)

**What it contains**:

- Machine specifications and capabilities
- Current status and availability
- Maintenance schedules and history
- Performance metrics and utilization
- Operator assignments and job schedules

**Think of it as**: Equipment logbooks and maintenance records

**Key Information Stored**:

- Machine name and technical specifications
- Current operational status
- Maintenance schedules and service history
- Production capacity and speed ratings
- Current job assignments and schedules

## How Information Connects

### Relationships Between Data (Like Family Trees)

**Customer to Jobs**:

- Each customer can have many jobs
- Each job belongs to exactly one customer
- System tracks order history and patterns

**Jobs to Inventory**:

- Each job uses specific paper types
- Inventory is automatically reduced when jobs complete
- System tracks material usage and costs

**Jobs to Machines**:

- Each job is assigned to specific machines
- Machines can handle multiple jobs in sequence
- System tracks production schedules and capacity

**Users to Jobs**:

- Users are assigned to jobs based on their roles
- System tracks who created, approved, and worked on each job
- Activity history maintained for accountability

### Data Integrity Rules (Like Library Rules)

**Referential Integrity**:

- Can't delete a customer who has active jobs
- Can't assign jobs to non-existent machines
- User permissions checked before data access

**Data Validation**:

- Email addresses must be properly formatted
- Phone numbers follow standard patterns
- Dates must be logical (due dates after creation dates)
- Quantities must be positive numbers

**Business Rules**:

- Job costs cannot exceed customer credit limits
- Inventory levels cannot go negative
- Only authorized users can approve large jobs
- Machine assignments must match job requirements

## Data Organization Structure

### Tables (Like Library Sections)

**Users Table**:

```
User ID (unique number for each person)
Username (login name)
Email (contact information)
Role (admin, manager, coordinator, operator)
Name (full name)
Status (active or inactive)
Created Date (when account was made)
```

**Customers Table**:

```
Customer ID (unique number for each customer)
Company Name (business name)
Contact Person (main point of contact)
Email and Phone (communication details)
Address (billing and shipping information)
Account Balance (current financial status)
Status (active, inactive, on hold)
```

**Jobs Table**:

```
Job ID (unique number for each job)
Customer ID (links to customer)
Title (descriptive name)
Specifications (size, quantity, paper type)
Status (pending, approved, in progress, completed)
Pricing (cost and selling price)
Due Date (when customer needs it)
Created Date (when job was entered)
```

**Inventory Table**:

```
Item ID (unique number for each paper type)
Paper Type (name and description)
Size (dimensions)
GSM (paper weight)
Current Stock (how many sheets available)
Minimum Level (when to reorder)
Supplier (who provides it)
Cost per Unit (pricing information)
```

**Machines Table**:

```
Machine ID (unique number for each machine)
Machine Name (identifier)
Type (printing, cutting, finishing)
Status (running, idle, maintenance)
Capabilities (what it can produce)
Current Job (what it's working on)
```

### Indexes (Like Library Card Catalogs)

**Speed up common searches**:

- Customer names for quick lookup
- Job status for filtering active work
- Machine availability for scheduling
- Inventory levels for stock checks
- User roles for permission checking

## Data Security and Access

### Who Can See What (Permission Levels)

**Admin Level**:

- All data in all tables
- Can modify user accounts and permissions
- Access to financial and sensitive information
- System configuration and backup data

**Manager Level**:

- All job and customer information
- Inventory and machine data
- Financial summaries and reports
- User activity (limited to their department)

**Coordinator Level**:

- Customer and job information they work with
- Inventory levels and availability
- Machine schedules for planning
- Their own user profile information

**Operator Level**:

- Jobs assigned to their machines
- Inventory for their current jobs
- Machine status they operate
- Their own profile and schedule

### Data Protection Measures

**Encryption**:

- Passwords stored with advanced encryption
- Sensitive data protected in transit
- Database files secured with encryption
- Backup files encrypted for safety

**Access Logging**:

- All data access recorded with timestamps
- User actions tracked for accountability
- Failed login attempts monitored
- Suspicious activity alerts generated

## Backup and Recovery

### Data Backup Strategy (Like Making Copies)

**Daily Backups**:

- Complete database copied every night
- Incremental changes backed up hourly
- Critical data protected in real-time
- Backup integrity verified automatically

**Multiple Backup Locations**:

- Local server backup for quick recovery
- Off-site backup for disaster protection
- Cloud backup for additional security
- Archive backups for long-term storage

### Recovery Procedures

**If data is lost or corrupted**:

1. **Immediate assessment** of damage scope
2. **Latest backup identification** and verification
3. **System restoration** from backup files
4. **Data integrity checking** and validation
5. **User notification** and system restart

## Performance Optimization

### Keeping the System Fast

**Database Design**:

- Tables organized for efficient access
- Indexes created for common searches
- Data relationships optimized
- Regular maintenance and cleanup

**Query Optimization**:

- Common searches pre-configured
- Complex reports run during off-peak hours
- Data caching for frequently accessed information
- System performance monitoring and tuning

### Growth Planning

**Scalability Features**:

- Database can grow to handle more customers
- System performance maintained as data increases
- Additional servers can be added if needed
- Archive procedures for old data

## Common Data Operations

### Daily Data Activities

**Job Management**:

- New jobs added throughout the day
- Status updates from production floor
- Customer communications logged
- Progress photos and documentation uploaded

**Inventory Tracking**:

- Stock levels updated as materials used
- New deliveries recorded and verified
- Reorder alerts generated automatically
- Supplier communications tracked

**User Activities**:

- Login sessions and security monitoring
- Permission changes and role updates
- Activity logging for accountability
- Performance metrics collection

### Reporting and Analytics

**Data Analysis**:

- Customer order patterns and trends
- Machine utilization and efficiency
- Inventory turnover and optimization
- Financial performance and profitability

**Business Intelligence**:

- Predictive analytics for planning
- Trend identification and forecasting
- Performance benchmarking
- Strategic decision support

## Troubleshooting Data Issues

### Common Problems and Solutions

**Data Inconsistencies**:

- Regular integrity checks identify issues
- Automatic correction procedures when possible
- Manual review and correction when needed
- Process improvements to prevent recurrence

**Performance Issues**:

- Database maintenance and optimization
- Index rebuilding and statistics updates
- Query performance analysis and tuning
- Hardware capacity assessment and upgrades

**Access Problems**:

- User permission verification and updates
- Password reset and security procedures
- Network connectivity troubleshooting
- System restart and recovery procedures

---

_This database structure ensures reliable, secure, and efficient storage of all business information while supporting growth and maintaining excellent performance for all users._
