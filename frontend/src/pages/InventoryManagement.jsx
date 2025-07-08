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
    Alert,
    Progress,
} from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    EyeOutlined,
    DeleteOutlined,
    WarningOutlined,
    ShoppingCartOutlined,
    InboxOutlined,
    ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useInventoryStore } from '../stores/inventoryStore';

const { Title, Text } = Typography;
const { Option } = Select;

const InventoryManagement = () => {
    const [form] = Form.useForm();
    const [selectedStock, setSelectedStock] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingStock, setEditingStock] = useState(null);
    const [alertFilter, setAlertFilter] = useState('all');

    const {
        inventory,
        loading,
        stats,
        lowStockAlerts,
        fetchInventory,
        createStockEntry,
        updateStockEntry,
        deleteStockEntry,
        updateStockLevel,
    } = useInventoryStore();

    useEffect(() => {
        fetchInventory();
    }, [fetchInventory]);

    const handleSubmit = async (values) => {
        try {
            if (editingStock) {
                await updateStockEntry(editingStock._id, values);
                message.success('Stock entry updated successfully');
            } else {
                await createStockEntry(values);
                message.success('Stock entry created successfully');
            }
            setModalVisible(false);
            setEditingStock(null);
            form.resetFields();
        } catch (error) {
            message.error('Failed to save stock entry');
        }
    };

    const handleEdit = (stock) => {
        setEditingStock(stock);
        form.setFieldsValue(stock);
        setModalVisible(true);
    };

    const handleDelete = async (stockId) => {
        try {
            await deleteStockEntry(stockId);
            message.success('Stock entry deleted successfully');
        } catch (error) {
            message.error('Failed to delete stock entry');
        }
    };

    const handleStockLevelUpdate = async (stockId, newQuantity) => {
        try {
            await updateStockLevel(stockId, newQuantity);
            message.success('Stock level updated successfully');
        } catch (error) {
            message.error('Failed to update stock level');
        }
    };

    const getStockStatus = (currentStock, minStock) => {
        const percentage = (currentStock / (minStock * 2)) * 100;
        if (percentage <= 50) return { status: 'exception', color: 'red', text: 'Critical' };
        if (percentage <= 75) return { status: 'active', color: 'orange', text: 'Low' };
        return { status: 'success', color: 'green', text: 'Good' };
    };

    const columns = [
        {
            title: 'Item Code',
            dataIndex: 'itemCode',
            key: 'itemCode',
            width: 120,
            render: (text) => <Text strong>{text}</Text>,
        },
        {
            title: 'Paper Details',
            key: 'paperDetails',
            width: 250,
            render: (_, record) => (
                <Space direction="vertical" size="small">
                    <Text strong>{record.paperType}</Text>
                    <Text type="secondary">{record.paperSize} - {record.gsm} GSM</Text>
                    {record.party && <Tag color="blue">{record.party}</Tag>}
                </Space>
            ),
        },
        {
            title: 'Current Stock',
            dataIndex: 'currentQuantity',
            key: 'currentQuantity',
            width: 150,
            render: (quantity, record) => {
                const status = getStockStatus(quantity, record.minimumStock);
                return (
                    <Space direction="vertical" size="small">
                        <Text strong>{quantity} {record.unit}</Text>
                        <Tag color={status.color}>{status.text}</Tag>
                    </Space>
                );
            },
        },
        {
            title: 'Stock Level',
            key: 'stockLevel',
            width: 150,
            render: (_, record) => {
                const percentage = Math.min((record.currentQuantity / (record.minimumStock * 2)) * 100, 100);
                const status = getStockStatus(record.currentQuantity, record.minimumStock);
                return (
                    <Progress
                        percent={percentage}
                        status={status.status}
                        size="small"
                        showInfo={false}
                    />
                );
            },
        },
        {
            title: 'Min Stock',
            dataIndex: 'minimumStock',
            key: 'minimumStock',
            width: 100,
            render: (min, record) => `${min} ${record.unit}`,
        },
        {
            title: 'Location',
            dataIndex: 'location',
            key: 'location',
            width: 120,
        },
        {
            title: 'Last Updated',
            dataIndex: 'lastUpdated',
            key: 'lastUpdated',
            width: 120,
            render: (date) => new Date(date).toLocaleDateString(),
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 200,
            render: (_, record) => (
                <Space size="small">
                    <Tooltip title="Quick Update">
                        <Button
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => {
                                Modal.confirm({
                                    title: 'Update Stock Quantity',
                                    content: (
                                        <div style={{ marginTop: 16 }}>
                                            <Input
                                                type="number"
                                                placeholder="Enter new quantity"
                                                id={`stock-quantity-${record._id}`}
                                                defaultValue={record.currentQuantity}
                                            />
                                        </div>
                                    ),
                                    onOk: () => {
                                        const newQuantity = document.getElementById(`stock-quantity-${record._id}`).value;
                                        handleStockLevelUpdate(record._id, parseFloat(newQuantity));
                                    },
                                });
                            }}
                        />
                    </Tooltip>

                    <Tooltip title="Edit">
                        <Button
                            size="small"
                            type="primary"
                            icon={<EyeOutlined />}
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
                                    title: 'Delete Stock Entry',
                                    content: 'Are you sure you want to delete this stock entry?',
                                    onOk: () => handleDelete(record._id),
                                });
                            }}
                        />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    const filteredInventory = alertFilter === 'all'
        ? inventory
        : inventory.filter(item => {
            if (alertFilter === 'low') {
                return item.currentQuantity <= item.minimumStock;
            }
            if (alertFilter === 'critical') {
                return item.currentQuantity <= (item.minimumStock * 0.5);
            }
            return true;
        });

    return (
        <div>
            <Row gutter={[24, 24]}>
                <Col span={24}>
                    <Title level={2}>Inventory Management</Title>
                </Col>

                {/* Alert Banner */}
                {lowStockAlerts.length > 0 && (
                    <Col span={24}>
                        <Alert
                            message={`${lowStockAlerts.length} items are running low on stock`}
                            description="Please review and reorder items marked as critical or low stock"
                            type="warning"
                            icon={<WarningOutlined />}
                            showIcon
                            closable
                        />
                    </Col>
                )}

                {/* Statistics Cards */}
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="Total Items"
                            value={stats?.totalItems || 0}
                            prefix={<InboxOutlined />}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="Low Stock Items"
                            value={stats?.lowStockItems || 0}
                            prefix={<WarningOutlined />}
                            valueStyle={{ color: '#faad14' }}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="Critical Stock"
                            value={stats?.criticalStockItems || 0}
                            prefix={<ExclamationCircleOutlined />}
                            valueStyle={{ color: '#ff4d4f' }}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="Total Value"
                            value={stats?.totalValue || 0}
                            prefix="₹"
                            formatter={value => value.toLocaleString()}
                            valueStyle={{ color: '#52c41a' }}
                        />
                    </Card>
                </Col>

                {/* Inventory Table */}
                <Col span={24}>
                    <Card
                        title="Stock Inventory"
                        extra={
                            <Space>
                                <Select
                                    value={alertFilter}
                                    onChange={setAlertFilter}
                                    style={{ width: 150 }}
                                >
                                    <Option value="all">All Items</Option>
                                    <Option value="low">Low Stock</Option>
                                    <Option value="critical">Critical Stock</Option>
                                </Select>
                                <Button
                                    type="primary"
                                    icon={<PlusOutlined />}
                                    onClick={() => {
                                        setEditingStock(null);
                                        form.resetFields();
                                        setModalVisible(true);
                                    }}
                                >
                                    Add Stock
                                </Button>
                            </Space>
                        }
                    >
                        <Table
                            columns={columns}
                            dataSource={filteredInventory}
                            rowKey="_id"
                            loading={loading}
                            pagination={{
                                pageSize: 10,
                                showSizeChanger: true,
                                showQuickJumper: true,
                                showTotal: (total, range) =>
                                    `${range[0]}-${range[1]} of ${total} items`,
                            }}
                            scroll={{ x: 1300 }}
                            rowClassName={(record) => {
                                const status = getStockStatus(record.currentQuantity, record.minimumStock);
                                if (status.text === 'Critical') return 'critical-stock-row';
                                if (status.text === 'Low') return 'low-stock-row';
                                return '';
                            }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Add/Edit Stock Modal */}
            <Modal
                title={editingStock ? 'Edit Stock Entry' : 'Add New Stock Entry'}
                open={modalVisible}
                onCancel={() => {
                    setModalVisible(false);
                    setEditingStock(null);
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
                                name="paperType"
                                label="Paper Type"
                                rules={[{ required: true, message: 'Please select paper type' }]}
                            >
                                <Select placeholder="Select paper type">
                                    <Option value="Bond Paper">Bond Paper</Option>
                                    <Option value="Art Paper">Art Paper</Option>
                                    <Option value="Newsprint">Newsprint</Option>
                                    <Option value="Coated Paper">Coated Paper</Option>
                                    <Option value="Cardboard">Cardboard</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="paperSize"
                                label="Paper Size"
                                rules={[{ required: true, message: 'Please select paper size' }]}
                            >
                                <Select placeholder="Select paper size">
                                    <Option value="A4">A4</Option>
                                    <Option value="A3">A3</Option>
                                    <Option value="Letter">Letter</Option>
                                    <Option value="Legal">Legal</Option>
                                    <Option value="Tabloid">Tabloid</Option>
                                    <Option value="Custom">Custom</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item
                                name="gsm"
                                label="GSM"
                                rules={[{ required: true, message: 'Please enter GSM' }]}
                            >
                                <InputNumber
                                    min={50}
                                    max={500}
                                    placeholder="GSM"
                                    style={{ width: '100%' }}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                name="currentQuantity"
                                label="Current Quantity"
                                rules={[{ required: true, message: 'Please enter quantity' }]}
                            >
                                <InputNumber
                                    min={0}
                                    placeholder="Quantity"
                                    style={{ width: '100%' }}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                name="unit"
                                label="Unit"
                                rules={[{ required: true, message: 'Please select unit' }]}
                            >
                                <Select placeholder="Select unit">
                                    <Option value="sheets">Sheets</Option>
                                    <Option value="reams">Reams</Option>
                                    <Option value="kg">Kilograms</Option>
                                    <Option value="tons">Tons</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="minimumStock"
                                label="Minimum Stock Level"
                                rules={[{ required: true, message: 'Please enter minimum stock' }]}
                            >
                                <InputNumber
                                    min={0}
                                    placeholder="Minimum stock"
                                    style={{ width: '100%' }}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="location"
                                label="Storage Location"
                            >
                                <Input placeholder="Storage location" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="party"
                                label="Supplier/Party"
                            >
                                <Input placeholder="Supplier name" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="costPerUnit"
                                label="Cost Per Unit (₹)"
                            >
                                <InputNumber
                                    min={0}
                                    step={0.01}
                                    placeholder="Cost per unit"
                                    style={{ width: '100%' }}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item>
                        <Space>
                            <Button type="primary" htmlType="submit" loading={loading}>
                                {editingStock ? 'Update' : 'Add'} Stock Entry
                            </Button>
                            <Button onClick={() => {
                                setModalVisible(false);
                                setEditingStock(null);
                                form.resetFields();
                            }}>
                                Cancel
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default InventoryManagement; 