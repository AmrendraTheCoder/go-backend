import { useState, useEffect } from 'react';
import {
    Card,
    Table,
    Button,
    Space,
    Typography,
    Row,
    Col,
    Modal,
    Form,
    Input,
    Select,
    InputNumber,
    message,
    Tooltip,
    Tag,
    Statistic,
    Descriptions,
} from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    EyeOutlined,
    DeleteOutlined,
    PhoneOutlined,
    MailOutlined,
    DollarOutlined,
} from '@ant-design/icons';
import { useCustomersStore } from '../stores/customersStore';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const CustomerManagement = () => {
    const [form] = Form.useForm();
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [detailsModalVisible, setDetailsModalVisible] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);

    const {
        customers,
        loading,
        stats,
        fetchCustomers,
        createCustomer,
        updateCustomer,
        deleteCustomer,
        getCustomerHistory,
    } = useCustomersStore();

    useEffect(() => {
        fetchCustomers();
    }, [fetchCustomers]);

    const handleSubmit = async (values) => {
        try {
            if (editingCustomer) {
                await updateCustomer(editingCustomer._id, values);
                message.success('Customer updated successfully');
            } else {
                await createCustomer(values);
                message.success('Customer created successfully');
            }
            setModalVisible(false);
            setEditingCustomer(null);
            form.resetFields();
        } catch (error) {
            message.error('Failed to save customer');
        }
    };

    const handleEdit = (customer) => {
        setEditingCustomer(customer);
        form.setFieldsValue(customer);
        setModalVisible(true);
    };

    const handleDelete = async (customerId) => {
        try {
            await deleteCustomer(customerId);
            message.success('Customer deleted successfully');
        } catch (error) {
            message.error('Failed to delete customer');
        }
    };

    const handleViewDetails = async (customer) => {
        setSelectedCustomer(customer);
        await getCustomerHistory(customer._id);
        setDetailsModalVisible(true);
    };

    const getBalanceColor = (balance) => {
        if (balance > 0) return '#52c41a'; // Green for positive
        if (balance < 0) return '#ff4d4f'; // Red for negative
        return '#1890ff'; // Blue for zero
    };

    const columns = [
        {
            title: 'Customer ID',
            dataIndex: 'customerId',
            key: 'customerId',
            width: 120,
            render: (text) => <Text strong>{text}</Text>,
        },
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            width: 200,
            render: (text) => <Text strong>{text}</Text>,
        },
        {
            title: 'Contact',
            key: 'contact',
            width: 250,
            render: (_, record) => (
                <Space direction="vertical" size="small">
                    <Space>
                        <PhoneOutlined />
                        <Text>{record.phone}</Text>
                    </Space>
                    <Space>
                        <MailOutlined />
                        <Text>{record.email}</Text>
                    </Space>
                </Space>
            ),
        },
        {
            title: 'Company',
            dataIndex: 'company',
            key: 'company',
            width: 150,
        },
        {
            title: 'Current Balance',
            dataIndex: 'currentBalance',
            key: 'currentBalance',
            width: 150,
            render: (balance) => (
                <Text style={{ color: getBalanceColor(balance), fontWeight: 'bold' }}>
                    ₹{balance?.toLocaleString() || 0}
                </Text>
            ),
        },
        {
            title: 'Total Jobs',
            dataIndex: 'totalJobs',
            key: 'totalJobs',
            width: 100,
            render: (count) => <Tag color="blue">{count || 0}</Tag>,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 100,
            render: (status) => (
                <Tag color={status === 'active' ? 'green' : 'red'}>
                    {status?.toUpperCase()}
                </Tag>
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 150,
            render: (_, record) => (
                <Space size="small">
                    <Tooltip title="View Details">
                        <Button
                            size="small"
                            icon={<EyeOutlined />}
                            onClick={() => handleViewDetails(record)}
                        />
                    </Tooltip>
                    <Tooltip title="Edit">
                        <Button
                            size="small"
                            type="primary"
                            icon={<EditOutlined />}
                            onClick={() => handleEdit(record)}
                        />
                    </Tooltip>
                    <Tooltip title="Delete">
                        <Button
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => {
                                Modal.confirm({
                                    title: 'Delete Customer',
                                    content: 'Are you sure you want to delete this customer?',
                                    onOk: () => handleDelete(record._id),
                                });
                            }}
                        />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    return (
        <div>
            <Row gutter={[24, 24]}>
                <Col span={24}>
                    <Title level={2}>Customer Management</Title>
                </Col>

                {/* Statistics Cards */}
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="Total Customers"
                            value={stats?.total || 0}
                            prefix={<TeamOutlined />}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="Active Customers"
                            value={stats?.active || 0}
                            prefix={<TeamOutlined />}
                            valueStyle={{ color: '#52c41a' }}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="Total Outstanding"
                            value={stats?.totalOutstanding || 0}
                            prefix={<DollarOutlined />}
                            formatter={value => `₹${value.toLocaleString()}`}
                            valueStyle={{ color: '#ff4d4f' }}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="Total Receivable"
                            value={stats?.totalReceivable || 0}
                            prefix={<DollarOutlined />}
                            formatter={value => `₹${value.toLocaleString()}`}
                            valueStyle={{ color: '#52c41a' }}
                        />
                    </Card>
                </Col>

                {/* Customers Table */}
                <Col span={24}>
                    <Card
                        title="Customers"
                        extra={
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={() => {
                                    setEditingCustomer(null);
                                    form.resetFields();
                                    setModalVisible(true);
                                }}
                            >
                                Add Customer
                            </Button>
                        }
                    >
                        <Table
                            columns={columns}
                            dataSource={customers}
                            rowKey="_id"
                            loading={loading}
                            pagination={{
                                pageSize: 10,
                                showSizeChanger: true,
                                showQuickJumper: true,
                                showTotal: (total, range) =>
                                    `${range[0]}-${range[1]} of ${total} customers`,
                            }}
                            scroll={{ x: 1200 }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Add/Edit Customer Modal */}
            <Modal
                title={editingCustomer ? 'Edit Customer' : 'Add New Customer'}
                open={modalVisible}
                onCancel={() => {
                    setModalVisible(false);
                    setEditingCustomer(null);
                    form.resetFields();
                }}
                footer={null}
                width={600}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                >
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="name"
                                label="Customer Name"
                                rules={[{ required: true, message: 'Please enter customer name' }]}
                            >
                                <Input placeholder="Enter customer name" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="company"
                                label="Company"
                                rules={[{ required: true, message: 'Please enter company name' }]}
                            >
                                <Input placeholder="Enter company name" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="email"
                                label="Email"
                                rules={[
                                    { required: true, message: 'Please enter email' },
                                    { type: 'email', message: 'Please enter valid email' }
                                ]}
                            >
                                <Input placeholder="Enter email address" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="phone"
                                label="Phone"
                                rules={[{ required: true, message: 'Please enter phone number' }]}
                            >
                                <Input placeholder="Enter phone number" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item
                        name="address"
                        label="Address"
                    >
                        <TextArea rows={3} placeholder="Enter complete address" />
                    </Form.Item>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="gstNumber"
                                label="GST Number"
                            >
                                <Input placeholder="Enter GST number" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="status"
                                label="Status"
                                initialValue="active"
                            >
                                <Select>
                                    <Option value="active">Active</Option>
                                    <Option value="inactive">Inactive</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item>
                        <Space>
                            <Button type="primary" htmlType="submit" loading={loading}>
                                {editingCustomer ? 'Update' : 'Create'} Customer
                            </Button>
                            <Button onClick={() => {
                                setModalVisible(false);
                                setEditingCustomer(null);
                                form.resetFields();
                            }}>
                                Cancel
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>

            {/* Customer Details Modal */}
            <Modal
                title="Customer Details"
                open={detailsModalVisible}
                onCancel={() => setDetailsModalVisible(false)}
                footer={null}
                width={800}
            >
                {selectedCustomer && (
                    <div>
                        <Descriptions bordered column={2}>
                            <Descriptions.Item label="Customer ID">
                                {selectedCustomer.customerId}
                            </Descriptions.Item>
                            <Descriptions.Item label="Name">
                                {selectedCustomer.name}
                            </Descriptions.Item>
                            <Descriptions.Item label="Company">
                                {selectedCustomer.company}
                            </Descriptions.Item>
                            <Descriptions.Item label="Email">
                                {selectedCustomer.email}
                            </Descriptions.Item>
                            <Descriptions.Item label="Phone">
                                {selectedCustomer.phone}
                            </Descriptions.Item>
                            <Descriptions.Item label="Current Balance">
                                <Text style={{ color: getBalanceColor(selectedCustomer.currentBalance) }}>
                                    ₹{selectedCustomer.currentBalance?.toLocaleString() || 0}
                                </Text>
                            </Descriptions.Item>
                            <Descriptions.Item label="Address" span={2}>
                                {selectedCustomer.address}
                            </Descriptions.Item>
                        </Descriptions>

                        {/* Job History would go here */}
                        <div style={{ marginTop: 24 }}>
                            <Title level={4}>Recent Jobs</Title>
                            <Text type="secondary">Job history will be displayed here</Text>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default CustomerManagement; 