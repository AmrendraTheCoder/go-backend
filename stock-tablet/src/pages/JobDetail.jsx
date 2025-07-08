import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Card,
    Row,
    Col,
    Button,
    Tag,
    Space,
    Steps,
    Input,
    Upload,
    message,
    Modal,
    Descriptions,
    Timeline,
    Progress,
    Spin,
    Typography,
    Divider
} from 'antd';
import {
    ArrowLeftOutlined,
    PlayCircleOutlined,
    PauseCircleOutlined,
    CheckCircleOutlined,
    CameraOutlined,
    FileTextOutlined,
    ClockCircleOutlined,
    UserOutlined,
    InfoCircleOutlined,
    ExclamationCircleOutlined
} from '@ant-design/icons';
import { useJobStore } from '../stores/jobStore';

const { Step } = Steps;
const { TextArea } = Input;
const { Title, Text } = Typography;

const JobDetail = () => {
    const { jobId } = useParams();
    const navigate = useNavigate();
    const {
        jobs,
        currentJob,
        loading,
        error,
        startJob,
        updateJobProgress,
        completeJob,
        uploadJobPhotos,
        setCurrentJob
    } = useJobStore();

    const [statusModalVisible, setStatusModalVisible] = useState(false);
    const [completionModalVisible, setCompletionModalVisible] = useState(false);
    const [progressNotes, setProgressNotes] = useState('');
    const [completionNotes, setCompletionNotes] = useState('');
    const [uploadFileList, setUploadFileList] = useState([]);
    const [currentStep, setCurrentStep] = useState(0);

    // Find the job in the jobs array or use currentJob
    const job = currentJob?.id === parseInt(jobId) ? currentJob : jobs.find(j => j.id === parseInt(jobId));

    useEffect(() => {
        if (job && job.id !== currentJob?.id) {
            setCurrentJob(job);
        }
    }, [job, currentJob, setCurrentJob]);

    useEffect(() => {
        // Set current step based on job status
        if (job) {
            const stepMap = {
                'pending': 0,
                'in_progress': 1,
                'paused': 1,
                'completed': 2,
                'cancelled': 0
            };
            setCurrentStep(stepMap[job.status] || 0);
        }
    }, [job]);

    const handleBack = () => {
        navigate('/');
    };

    const handleStartJob = async () => {
        const result = await startJob(job.id);
        if (result.success) {
            message.success('Job started successfully');
        } else {
            message.error(result.error);
        }
    };

    const handlePauseJob = () => {
        setStatusModalVisible(true);
    };

    const handleResumeJob = async () => {
        const result = await updateJobProgress(job.id, 'in_progress', 'Job resumed by operator');
        if (result.success) {
            message.success('Job resumed');
        } else {
            message.error(result.error);
        }
    };

    const handleCompleteJob = () => {
        setCompletionModalVisible(true);
    };

    const handleStatusUpdate = async (status) => {
        const result = await updateJobProgress(job.id, status, progressNotes);
        if (result.success) {
            message.success('Job status updated');
            setStatusModalVisible(false);
            setProgressNotes('');
        } else {
            message.error(result.error);
        }
    };

    const handleJobCompletion = async () => {
        const result = await completeJob(job.id, completionNotes);
        if (result.success) {
            message.success('Job completed successfully!');
            setCompletionModalVisible(false);
            setCompletionNotes('');
            navigate('/');
        } else {
            message.error(result.error);
        }
    };

    const handlePhotoUpload = async ({ fileList }) => {
        setUploadFileList(fileList);

        // Upload completed files
        const completedFiles = fileList.filter(file => file.status === 'done');
        if (completedFiles.length > 0) {
            const photos = completedFiles.map(file => file.response || file);
            const result = await uploadJobPhotos(job.id, photos);
            if (result.success) {
                message.success('Photos uploaded successfully');
            } else {
                message.error(result.error);
            }
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            pending: 'orange',
            in_progress: 'blue',
            completed: 'green',
            paused: 'yellow',
            cancelled: 'red'
        };
        return colors[status] || 'default';
    };

    const getPriorityColor = (priority) => {
        const colors = {
            high: '#ff4d4f',
            medium: '#fa8c16',
            low: '#52c41a'
        };
        return colors[priority] || '#d9d9d9';
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const calculateProgress = () => {
        if (!job) return 0;

        const statusProgress = {
            'pending': 0,
            'in_progress': 50,
            'paused': 50,
            'completed': 100,
            'cancelled': 0
        };

        return statusProgress[job.status] || 0;
    };

    if (!job) {
        return (
            <div style={{ padding: '20px', textAlign: 'center' }}>
                <Spin size="large" />
                <p style={{ marginTop: '16px', fontSize: '16px' }}>Loading job details...</p>
            </div>
        );
    }

    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header */}
            <Card className="tablet-card" style={{ marginBottom: '20px' }}>
                <Row align="middle" justify="space-between">
                    <Col>
                        <Space>
                            <Button
                                icon={<ArrowLeftOutlined />}
                                onClick={handleBack}
                                size="large"
                                type="text"
                            />
                            <div>
                                <Title level={2} style={{ margin: 0, fontSize: '28px' }}>
                                    {job.title}
                                </Title>
                                <Text type="secondary" style={{ fontSize: '16px' }}>
                                    Job #{job.id} • {job.customerName}
                                </Text>
                            </div>
                        </Space>
                    </Col>
                    <Col>
                        <Space>
                            <Tag color={getStatusColor(job.status)} style={{ fontSize: '16px', padding: '8px 16px' }}>
                                {job.status.replace('_', ' ').toUpperCase()}
                            </Tag>
                            <Tag color={getPriorityColor(job.priority)} style={{ fontSize: '16px', padding: '8px 16px' }}>
                                {job.priority.toUpperCase()} PRIORITY
                            </Tag>
                        </Space>
                    </Col>
                </Row>
            </Card>

            {/* Progress Section */}
            <Card className="tablet-card" style={{ marginBottom: '20px' }}>
                <Title level={4} style={{ marginBottom: '20px' }}>Job Progress</Title>
                <Progress
                    percent={calculateProgress()}
                    status={job.status === 'completed' ? 'success' : 'active'}
                    strokeWidth={12}
                    style={{ marginBottom: '24px' }}
                />
                <Steps current={currentStep} size="small">
                    <Step title="Queued" description="Waiting to start" icon={<ClockCircleOutlined />} />
                    <Step title="In Progress" description="Currently working" icon={<PlayCircleOutlined />} />
                    <Step title="Completed" description="Job finished" icon={<CheckCircleOutlined />} />
                </Steps>
            </Card>

            {/* Action Buttons */}
            <Card className="tablet-card" style={{ marginBottom: '20px' }}>
                <Row gutter={[16, 16]}>
                    {job.status === 'pending' && (
                        <Col xs={24} sm={12} md={8}>
                            <Button
                                type="primary"
                                icon={<PlayCircleOutlined />}
                                onClick={handleStartJob}
                                loading={loading}
                                size="large"
                                block
                                style={{ height: '60px', fontSize: '18px' }}
                            >
                                Start Job
                            </Button>
                        </Col>
                    )}

                    {job.status === 'in_progress' && (
                        <>
                            <Col xs={24} sm={12} md={8}>
                                <Button
                                    icon={<PauseCircleOutlined />}
                                    onClick={handlePauseJob}
                                    size="large"
                                    block
                                    style={{ height: '60px', fontSize: '18px' }}
                                >
                                    Pause Job
                                </Button>
                            </Col>
                            <Col xs={24} sm={12} md={8}>
                                <Button
                                    type="primary"
                                    icon={<CheckCircleOutlined />}
                                    onClick={handleCompleteJob}
                                    size="large"
                                    block
                                    style={{ height: '60px', fontSize: '18px' }}
                                >
                                    Complete Job
                                </Button>
                            </Col>
                        </>
                    )}

                    {job.status === 'paused' && (
                        <Col xs={24} sm={12} md={8}>
                            <Button
                                type="primary"
                                icon={<PlayCircleOutlined />}
                                onClick={handleResumeJob}
                                loading={loading}
                                size="large"
                                block
                                style={{ height: '60px', fontSize: '18px' }}
                            >
                                Resume Job
                            </Button>
                        </Col>
                    )}

                    <Col xs={24} sm={12} md={8}>
                        <Upload
                            name="jobPhotos"
                            listType="picture-card"
                            fileList={uploadFileList}
                            onChange={handlePhotoUpload}
                            multiple
                            accept="image/*"
                            style={{ width: '100%' }}
                        >
                            <div style={{ padding: '20px' }}>
                                <CameraOutlined style={{ fontSize: '24px' }} />
                                <div style={{ marginTop: '8px', fontSize: '16px' }}>Upload Photos</div>
                            </div>
                        </Upload>
                    </Col>
                </Row>
            </Card>

            <Row gutter={[20, 20]}>
                {/* Job Details */}
                <Col xs={24} lg={12}>
                    <Card className="tablet-card" style={{ height: '100%' }}>
                        <Title level={4} style={{ marginBottom: '20px' }}>
                            <InfoCircleOutlined style={{ marginRight: '8px' }} />
                            Job Details
                        </Title>
                        <Descriptions layout="vertical" size="large">
                            <Descriptions.Item label="Customer" span={2}>
                                <Text strong style={{ fontSize: '16px' }}>{job.customerName}</Text>
                            </Descriptions.Item>
                            <Descriptions.Item label="Paper Type" span={2}>
                                <Text style={{ fontSize: '16px' }}>{job.paperType}</Text>
                            </Descriptions.Item>
                            <Descriptions.Item label="Quantity" span={1}>
                                <Text style={{ fontSize: '16px' }}>{job.quantity || 'N/A'}</Text>
                            </Descriptions.Item>
                            <Descriptions.Item label="Estimated Time" span={1}>
                                <Text style={{ fontSize: '16px' }}>{job.estimatedTime || 'N/A'}</Text>
                            </Descriptions.Item>
                            <Descriptions.Item label="Due Date" span={2}>
                                <Text style={{ fontSize: '16px' }}>{formatDateTime(job.dueDate)}</Text>
                            </Descriptions.Item>
                            <Descriptions.Item label="Created" span={1}>
                                <Text style={{ fontSize: '16px' }}>{formatDateTime(job.createdAt)}</Text>
                            </Descriptions.Item>
                            <Descriptions.Item label="Started" span={1}>
                                <Text style={{ fontSize: '16px' }}>{formatDateTime(job.startedAt)}</Text>
                            </Descriptions.Item>
                        </Descriptions>

                        {job.description && (
                            <>
                                <Divider />
                                <Title level={5}>Description</Title>
                                <Text style={{ fontSize: '16px' }}>{job.description}</Text>
                            </>
                        )}
                    </Card>
                </Col>

                {/* Job History & Notes */}
                <Col xs={24} lg={12}>
                    <Card className="tablet-card" style={{ height: '100%' }}>
                        <Title level={4} style={{ marginBottom: '20px' }}>
                            <FileTextOutlined style={{ marginRight: '8px' }} />
                            Job History
                        </Title>
                        {job.notes && job.notes.length > 0 ? (
                            <Timeline>
                                {job.notes.map((note, index) => (
                                    <Timeline.Item
                                        key={index}
                                        color={note.author === 'machine_operator' ? 'blue' : 'green'}
                                    >
                                        <div style={{ fontSize: '16px' }}>
                                            <Text strong>{note.text}</Text>
                                            <br />
                                            <Text type="secondary" style={{ fontSize: '14px' }}>
                                                {formatDateTime(note.timestamp)} • {note.author.replace('_', ' ')}
                                            </Text>
                                        </div>
                                    </Timeline.Item>
                                ))}
                            </Timeline>
                        ) : (
                            <Text type="secondary" style={{ fontSize: '16px' }}>
                                No history available yet
                            </Text>
                        )}
                    </Card>
                </Col>
            </Row>

            {/* Status Update Modal */}
            <Modal
                title="Update Job Status"
                open={statusModalVisible}
                onOk={() => handleStatusUpdate('paused')}
                onCancel={() => setStatusModalVisible(false)}
                okText="Pause Job"
                okButtonProps={{ size: 'large' }}
                cancelButtonProps={{ size: 'large' }}
            >
                <Space direction="vertical" style={{ width: '100%' }}>
                    <Text>Please add a note about why the job is being paused:</Text>
                    <TextArea
                        rows={4}
                        value={progressNotes}
                        onChange={(e) => setProgressNotes(e.target.value)}
                        placeholder="e.g., Machine maintenance required, material shortage, etc."
                        style={{ fontSize: '16px' }}
                    />
                </Space>
            </Modal>

            {/* Completion Modal */}
            <Modal
                title="Complete Job"
                open={completionModalVisible}
                onOk={handleJobCompletion}
                onCancel={() => setCompletionModalVisible(false)}
                okText="Complete Job"
                okButtonProps={{ size: 'large', type: 'primary' }}
                cancelButtonProps={{ size: 'large' }}
            >
                <Space direction="vertical" style={{ width: '100%' }}>
                    <Text>Add completion notes (optional):</Text>
                    <TextArea
                        rows={4}
                        value={completionNotes}
                        onChange={(e) => setCompletionNotes(e.target.value)}
                        placeholder="e.g., Job completed successfully, quality notes, etc."
                        style={{ fontSize: '16px' }}
                    />
                </Space>
            </Modal>
        </div>
    );
};

export default JobDetail; 