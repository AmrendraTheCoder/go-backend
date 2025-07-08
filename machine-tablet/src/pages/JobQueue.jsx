import { useEffect, useState } from 'react';
import { Card, Row, Col, Button, Tag, Space, Select, Statistic, message, Empty, Spin, Avatar } from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SettingOutlined,
  ReloadOutlined,
  FilterOutlined,
  UserOutlined,
  WifiOutlined,
  DisconnectOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useJobStore } from '../stores/jobStore';
import socketService from '../services/socketService';

const { Option } = Select;

const JobQueue = () => {
  const navigate = useNavigate();
  const { user, machineId, logout } = useAuthStore();
  const {
    jobs,
    loading,
    error,
    stats,
    filters,
    fetchMachineJobs,
    startJob,
    setFilters,
    getFilteredJobs,
    clearError
  } = useJobStore();

  const [connectionStatus, setConnectionStatus] = useState(socketService.getConnectionStatus());
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Fetch initial jobs
    if (machineId) {
      fetchMachineJobs(machineId);
    }

    // Monitor connection status
    const connectionInterval = setInterval(() => {
      setConnectionStatus(socketService.getConnectionStatus());
    }, 2000);

    return () => {
      clearInterval(connectionInterval);
    };
  }, [machineId, fetchMachineJobs]);

  useEffect(() => {
    if (error) {
      message.error(error);
      clearError();
    }
  }, [error, clearError]);

  const handleStartJob = async (job) => {
    const result = await startJob(job.id);
    if (result.success) {
      message.success(`Started job: ${job.title}`);
      navigate(`/jobs/${job.id}`);
    } else {
      message.error(result.error);
    }
  };

  const handleViewJob = (job) => {
    navigate(`/jobs/${job.id}`);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    if (machineId) {
      await fetchMachineJobs(machineId);
    }
    setRefreshing(false);
  };

  const handleFilterChange = (type, value) => {
    setFilters({ [type]: value });
  };

  const handleSettings = () => {
    navigate('/settings');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
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

  const formatTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const filteredJobs = getFilteredJobs();

  return (
    <div className="job-queue-container" style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header Section */}
      <Card className="tablet-card" style={{ marginBottom: '20px' }}>
        <Row align="middle" justify="space-between">
          <Col>
            <Space align="center">
              <Avatar size={48} icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
              <div>
                <h2 style={{ margin: 0, fontSize: '24px' }}>
                  {user?.name || 'Machine Operator'}
                </h2>
                <div style={{ color: '#666', fontSize: '16px' }}>
                  Machine: {machineId || 'Not Assigned'}
                </div>
              </div>
            </Space>
          </Col>
          <Col>
            <Space>
              {/* Connection Status */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {connectionStatus.connected ? (
                  <>
                    <WifiOutlined style={{ color: '#52c41a', fontSize: '18px' }} />
                    <span style={{ color: '#52c41a', fontSize: '14px' }}>Online</span>
                  </>
                ) : (
                  <>
                    <DisconnectOutlined style={{ color: '#ff4d4f', fontSize: '18px' }} />
                    <span style={{ color: '#ff4d4f', fontSize: '14px' }}>Offline</span>
                  </>
                )}
              </div>

              <Button
                icon={<SettingOutlined />}
                onClick={handleSettings}
                size="large"
                type="text"
              />
              <Button
                onClick={handleLogout}
                size="large"
                danger
              >
                Logout
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Statistics Section */}
      <Row gutter={[16, 16]} style={{ marginBottom: '20px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card className="tablet-card">
            <Statistic
              title="Total Jobs"
              value={stats.total}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ fontSize: '28px', fontWeight: 'bold' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="tablet-card">
            <Statistic
              title="Pending"
              value={stats.pending}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ fontSize: '28px', fontWeight: 'bold', color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="tablet-card">
            <Statistic
              title="In Progress"
              value={stats.inProgress}
              prefix={<PlayCircleOutlined />}
              valueStyle={{ fontSize: '28px', fontWeight: 'bold', color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="tablet-card">
            <Statistic
              title="Completed Today"
              value={stats.completedToday}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ fontSize: '28px', fontWeight: 'bold', color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters Section */}
      <Card className="tablet-card" style={{ marginBottom: '20px' }}>
        <Row align="middle" justify="space-between">
          <Col>
            <Space size="large">
              <div>
                <FilterOutlined style={{ marginRight: '8px' }} />
                <span style={{ fontSize: '16px', fontWeight: '600' }}>Filters:</span>
              </div>
              <div>
                <span style={{ marginRight: '8px' }}>Status:</span>
                <Select
                  value={filters.status}
                  onChange={(value) => handleFilterChange('status', value)}
                  style={{ width: 120 }}
                  size="large"
                >
                  <Option value="all">All</Option>
                  <Option value="pending">Pending</Option>
                  <Option value="in_progress">In Progress</Option>
                  <Option value="completed">Completed</Option>
                </Select>
              </div>
              <div>
                <span style={{ marginRight: '8px' }}>Priority:</span>
                <Select
                  value={filters.priority}
                  onChange={(value) => handleFilterChange('priority', value)}
                  style={{ width: 120 }}
                  size="large"
                >
                  <Option value="all">All</Option>
                  <Option value="high">High</Option>
                  <Option value="medium">Medium</Option>
                  <Option value="low">Low</Option>
                </Select>
              </div>
            </Space>
          </Col>
          <Col>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              loading={refreshing}
              size="large"
              type="primary"
            >
              Refresh
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Jobs Grid */}
      <Spin spinning={loading} tip="Loading jobs...">
        {filteredJobs.length === 0 ? (
          <Card className="tablet-card">
            <Empty
              description={
                <span style={{ fontSize: '18px' }}>
                  {filters.status === 'all' && filters.priority === 'all'
                    ? 'No jobs assigned to this machine'
                    : 'No jobs match the current filters'
                  }
                </span>
              }
              style={{ padding: '60px 0' }}
            />
          </Card>
        ) : (
          <Row gutter={[20, 20]} className="job-queue-grid">
            {filteredJobs.map((job) => (
              <Col key={job.id} xs={24} sm={24} md={12} lg={8} xl={6}>
                <Card
                  className={`job-card priority-${job.priority} tablet-card clickable`}
                  onClick={() => handleViewJob(job)}
                  hoverable
                  actions={[
                    job.status === 'pending' ? (
                      <Button
                        type="primary"
                        icon={<PlayCircleOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartJob(job);
                        }}
                        size="large"
                        block
                        style={{ margin: '0 16px' }}
                      >
                        Start Job
                      </Button>
                    ) : job.status === 'in_progress' ? (
                      <Button
                        type="default"
                        icon={<PauseCircleOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewJob(job);
                        }}
                        size="large"
                        block
                        style={{ margin: '0 16px' }}
                      >
                        Continue
                      </Button>
                    ) : (
                      <Button
                        type="default"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewJob(job);
                        }}
                        size="large"
                        block
                        style={{ margin: '0 16px' }}
                      >
                        View Details
                      </Button>
                    )
                  ]}
                >
                  <div className="job-card-header">
                    <div>
                      <h3 className="job-card-title">{job.title}</h3>
                      <div className="job-card-id">Job #{job.id}</div>
                    </div>
                    <div>
                      <Tag color={getStatusColor(job.status)} style={{ fontSize: '14px', padding: '4px 12px' }}>
                        {job.status.replace('_', ' ').toUpperCase()}
                      </Tag>
                    </div>
                  </div>

                  <div className="job-card-details">
                    <div className="job-card-detail">
                      <div className="job-card-detail-label">Customer</div>
                      <div className="job-card-detail-value">{job.customerName}</div>
                    </div>
                    <div className="job-card-detail">
                      <div className="job-card-detail-label">Priority</div>
                      <div
                        className="job-card-detail-value"
                        style={{ color: getPriorityColor(job.priority) }}
                      >
                        {job.priority.toUpperCase()}
                      </div>
                    </div>
                    <div className="job-card-detail">
                      <div className="job-card-detail-label">Due Time</div>
                      <div className="job-card-detail-value">{formatTime(job.dueDate)}</div>
                    </div>
                    <div className="job-card-detail">
                      <div className="job-card-detail-label">Paper Type</div>
                      <div className="job-card-detail-value">{job.paperType}</div>
                    </div>
                    {job.quantity && (
                      <div className="job-card-detail">
                        <div className="job-card-detail-label">Quantity</div>
                        <div className="job-card-detail-value">{job.quantity}</div>
                      </div>
                    )}
                    {job.estimatedTime && (
                      <div className="job-card-detail">
                        <div className="job-card-detail-label">Est. Time</div>
                        <div className="job-card-detail-value">{job.estimatedTime}</div>
                      </div>
                    )}
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Spin>
    </div>
  );
};

export default JobQueue; 