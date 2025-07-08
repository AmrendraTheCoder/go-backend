import { useState, useEffect } from 'react';
import {
    Card,
    Table,
    Button,
    Space,
    Tag,
    Typography,
    Row,
    Col,
    Statistic,
    Modal,
    Form,
    Input,
    Select,
    InputNumber,
    message,
    Tooltip,
    Badge,
} from 'antd';
import {
    EyeOutlined,
    EditOutlined,
    CheckOutlined,
    CloseOutlined,
    DollarOutlined,
    ClockCircleOutlined,
    PrinterOutlined,
    WarningOutlined,
} from '@ant-design/icons';
import { useJobsStore } from '../stores/jobsStore';
import JobDetailsModal from '../components/Jobs/JobDetailsModal';
import PricingModal from '../components/Jobs/PricingModal';

const { Title, Text } = Typography;
const { Option } = Select;

const JobManagement = () => {
    const [selectedJob, setSelectedJob] = useState(null);
    const [detailsModalVisible, setDetailsModalVisible] = useState(false);
    const [pricingModalVisible, setPricingModalVisible] = useState(false);
    const [statusFilter, setStatusFilter] = useState('all');

    const {
        jobs,
        loading,
        stats,
        fetchJobs,
        approveJob,
        rejectJob,
        updateJobPricing,
    } = useJobsStore();

    useEffect(() => {
        fetchJobs();
    }, [fetchJobs]);

    const handleApprove = async (jobId) => {
        try {
            await approveJob(jobId);
            message.success('Job approved successfully');
        } catch (error) {
            message.error('Failed to approve job');
        }
    };

    const handleReject = async (jobId, reason) => {
        try {
            await rejectJob(jobId, reason);
            message.success('Job rejected');
        } catch (error) {
            message.error('Failed to reject job');
        }
    };

    const handlePricingUpdate = async (jobId, pricing) => {
        try {
            await updateJobPricing(jobId, pricing);
            message.success('Pricing updated successfully');
            setPricingModalVisible(false);
        } catch (error) {
            message.error('Failed to update pricing');
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            pending: 'orange',
            approved: 'green',
            rejected: 'red',
            'in-progress': 'blue',
            completed: 'purple',
            cancelled: 'gray',
        };
        return colors[status] || 'default';
    };

    const getPriorityColor = (priority) => {
        const colors = {
            high: 'red',
            medium: 'orange',
            low: 'green',
        };
        return colors[priority] || 'default';
    };

    const columns = [
        {
            title: 'Job ID',
            dataIndex: 'jobId',
            key: 'jobId',
            width: 120,
            render: (text) => <Text strong>{text}</Text>,
        },
        {
            title: 'Customer',
            dataIndex: ['customer', 'name'],
            key: 'customer',
            width: 150,
        },
        {
            title: 'Job Type',
            dataIndex: 'jobType',
            key: 'jobType',
            width: 120,
            render: (text) => <Tag>{text}</Tag>,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 120,
            render: (status) => (
                <Tag color={getStatusColor(status)}>
                    {status?.toUpperCase()}
                </Tag>
            ),
        },
        {
            title: 'Priority',
            dataIndex: 'priority',
            key: 'priority',
            width: 100,
            render: (priority) => (
                <Tag color={getPriorityColor(priority)}>
                    {priority?.toUpperCase()}
                </Tag>
            ),
        },
        {
            title: 'Estimated Cost',
            dataIndex: 'estimatedCost',
            key: 'estimatedCost',
            width: 120,
            render: (cost) => `₹${cost?.toLocaleString() || 0}`,
        },
        {
            title: 'Due Date',
            dataIndex: 'dueDate',
            key: 'dueDate',
            width: 120,
            render: (date) => new Date(date).toLocaleDateString(),
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 200,
            render: (_, record) => (
                <Space size="small">
                    <Tooltip title="View Details">
                        <Button
                            size="small"
                            icon={<EyeOutlined />}
                            onClick={() => {
                                setSelectedJob(record);
                                setDetailsModalVisible(true);
                            }}
                        />
                    </Tooltip>

                    {record.status === 'pending' && (
                        <>
                            <Tooltip title="Approve">
                                <Button
                                    size="small"
                                    type="primary"
                                    icon={<CheckOutlined />}
                                    onClick={() => handleApprove(record._id)}
                                />
                            </Tooltip>
                            <Tooltip title="Reject">
                                <Button
                                    size="small"
                                    danger
                                    icon={<CloseOutlined />}
                                    onClick={() => {
                                        Modal.confirm({
                                            title: 'Reject Job',
                                            content: (
                                                <Input.TextArea
                                                    placeholder="Reason for rejection..."
                                                    id="rejection-reason"
                                                />
                                            ),
                                            onOk: () => {
                                                const reason = document.getElementById('rejection-reason').value;
                                                handleReject(record._id, reason);
                                            },
                                        });
                                    }}
                                />
                            </Tooltip>
                        </>
                    )}

                    <Tooltip title="Update Pricing">
                        <Button
                            size="small"
                            icon={<DollarOutlined />}
                            onClick={() => {
                                setSelectedJob(record);
                                setPricingModalVisible(true);
                            }}
                        />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    const filteredJobs = statusFilter === 'all'
        ? jobs
        : jobs.filter(job => job.status === statusFilter);

    return (
        <div>
            <Row gutter={[24, 24]}>
                <Col span={24}>
                    <Title level={2}>Job Management Dashboard</Title>
                </Col>

                {/* Statistics Cards */}
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="Total Jobs"
                            value={stats?.total || 0}
                            prefix={<FileTextOutlined />}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="Pending Approval"
                            value={stats?.pending || 0}
                            prefix={<ClockCircleOutlined />}
                            valueStyle={{ color: '#faad14' }}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="In Progress"
                            value={stats?.inProgress || 0}
                            prefix={<PrinterOutlined />}
                            valueStyle={{ color: '#1890ff' }}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="Completed Today"
                            value={stats?.completedToday || 0}
                            prefix={<CheckOutlined />}
                            valueStyle={{ color: '#52c41a' }}
                        />
                    </Card>
                </Col>

                {/* Jobs Table */}
                <Col span={24}>
                    <Card
                        title="Job Queue"
                        extra={
                            <Space>
                                <Select
                                    value={statusFilter}
                                    onChange={setStatusFilter}
                                    style={{ width: 150 }}
                                >
                                    <Option value="all">All Jobs</Option>
                                    <Option value="pending">Pending</Option>
                                    <Option value="approved">Approved</Option>
                                    <Option value="in-progress">In Progress</Option>
                                    <Option value="completed">Completed</Option>
                                    <Option value="rejected">Rejected</Option>
                                </Select>
                                <Button type="primary" onClick={() => fetchJobs()}>
                                    Refresh
                                </Button>
                            </Space>
                        }
                    >
                        <Table
                            columns={columns}
                            dataSource={filteredJobs}
                            rowKey="_id"
                            loading={loading}
                            pagination={{
                                pageSize: 10,
                                showSizeChanger: true,
                                showQuickJumper: true,
                                showTotal: (total, range) =>
                                    `${range[0]}-${range[1]} of ${total} jobs`,
                            }}
                            scroll={{ x: 1200 }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Job Details Modal */}
            <JobDetailsModal
                visible={detailsModalVisible}
                job={selectedJob}
                onClose={() => {
                    setDetailsModalVisible(false);
                    setSelectedJob(null);
                }}
            />

            {/* Pricing Modal */}
            <PricingModal
                visible={pricingModalVisible}
                job={selectedJob}
                onClose={() => {
                    setPricingModalVisible(false);
                    setSelectedJob(null);
                }}
                onUpdate={handlePricingUpdate}
            />
        </div>
    );
};

export default JobManagement; 