import { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Tag, Space, Typography, Descriptions, Switch, Slider, message, Alert, Input } from 'antd';
import {
    ArrowLeftOutlined,
    SettingOutlined,
    UserOutlined,
    DesktopOutlined,
    WifiOutlined,
    DisconnectOutlined,
    BugOutlined,
    ReloadOutlined,
    SaveOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import socketService from '../services/socketService';
import { reportMachineIssue, checkConnectivity } from '../services/apiClient';

const { Title, Text } = Typography;
const { TextArea } = Input;

const Settings = () => {
    const navigate = useNavigate();
    const { user, machineId } = useAuthStore();
    const [connectionStatus, setConnectionStatus] = useState(socketService.getConnectionStatus());
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [soundVolume, setSoundVolume] = useState(75);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [issueReport, setIssueReport] = useState('');
    const [reportingIssue, setReportingIssue] = useState(false);
    const [checkingConnection, setCheckingConnection] = useState(false);

    useEffect(() => {
        // Load saved settings from localStorage
        const savedSettings = localStorage.getItem('machine-tablet-settings');
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            setNotificationsEnabled(settings.notificationsEnabled ?? true);
            setSoundVolume(settings.soundVolume ?? 75);
            setAutoRefresh(settings.autoRefresh ?? true);
        }

        // Monitor connection status
        const connectionInterval = setInterval(() => {
            setConnectionStatus(socketService.getConnectionStatus());
        }, 2000);

        return () => {
            clearInterval(connectionInterval);
        };
    }, []);

    const handleBack = () => {
        navigate('/');
    };

    const saveSettings = () => {
        const settings = {
            notificationsEnabled,
            soundVolume,
            autoRefresh
        };
        localStorage.setItem('machine-tablet-settings', JSON.stringify(settings));
        message.success('Settings saved successfully');
    };

    const handleReportIssue = async () => {
        if (!issueReport.trim()) {
            message.error('Please describe the issue');
            return;
        }

        setReportingIssue(true);
        try {
            await reportMachineIssue(machineId, {
                description: issueReport,
                severity: 'medium',
                reportedBy: user?.email,
                timestamp: new Date().toISOString()
            });

            message.success('Issue reported successfully');
            setIssueReport('');
        } catch (error) {
            message.error('Failed to report issue: ' + error.message);
        } finally {
            setReportingIssue(false);
        }
    };

    const handleConnectionTest = async () => {
        setCheckingConnection(true);
        try {
            const result = await checkConnectivity();
            if (result.online) {
                message.success(`Connection OK - Latency: ${result.latency || 'N/A'}`);
            } else {
                message.warning('Connection issues detected');
            }
        } catch (error) {
            message.error('Connection test failed: ' + error.message);
        } finally {
            setCheckingConnection(false);
        }
    };

    const handleReconnect = () => {
        socketService.reconnect();
        message.info('Attempting to reconnect...');
    };

    return (
        <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
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
                                    <SettingOutlined style={{ marginRight: '12px' }} />
                                    Settings
                                </Title>
                                <Text type="secondary" style={{ fontSize: '16px' }}>
                                    Machine operator configuration
                                </Text>
                            </div>
                        </Space>
                    </Col>
                    <Col>
                        <Button
                            type="primary"
                            icon={<SaveOutlined />}
                            onClick={saveSettings}
                            size="large"
                        >
                            Save Settings
                        </Button>
                    </Col>
                </Row>
            </Card>

            <Row gutter={[20, 20]}>
                {/* User & Machine Info */}
                <Col xs={24} lg={12}>
                    <Card className="tablet-card" style={{ height: '100%' }}>
                        <Title level={4} style={{ marginBottom: '20px' }}>
                            <UserOutlined style={{ marginRight: '8px' }} />
                            User Information
                        </Title>
                        <Descriptions layout="vertical" size="large">
                            <Descriptions.Item label="Operator Name" span={2}>
                                <Text strong style={{ fontSize: '16px' }}>{user?.name || 'Unknown'}</Text>
                            </Descriptions.Item>
                            <Descriptions.Item label="Email" span={2}>
                                <Text style={{ fontSize: '16px' }}>{user?.email || 'Unknown'}</Text>
                            </Descriptions.Item>
                            <Descriptions.Item label="Machine ID" span={1}>
                                <Text style={{ fontSize: '16px' }}>{machineId || 'Not Assigned'}</Text>
                            </Descriptions.Item>
                            <Descriptions.Item label="Role" span={1}>
                                <Tag color="blue" style={{ fontSize: '14px' }}>Machine Operator</Tag>
                            </Descriptions.Item>
                        </Descriptions>
                    </Card>
                </Col>

                {/* Connection Status */}
                <Col xs={24} lg={12}>
                    <Card className="tablet-card" style={{ height: '100%' }}>
                        <Title level={4} style={{ marginBottom: '20px' }}>
                            <DesktopOutlined style={{ marginRight: '8px' }} />
                            Connection Status
                        </Title>

                        <Space direction="vertical" style={{ width: '100%' }} size="large">
                            <Alert
                                message={
                                    <Space>
                                        {connectionStatus.connected ? (
                                            <>
                                                <WifiOutlined style={{ color: '#52c41a' }} />
                                                <span>Connected to server</span>
                                            </>
                                        ) : (
                                            <>
                                                <DisconnectOutlined style={{ color: '#ff4d4f' }} />
                                                <span>Disconnected from server</span>
                                            </>
                                        )}
                                    </Space>
                                }
                                type={connectionStatus.connected ? 'success' : 'error'}
                                showIcon={false}
                            />

                            <div>
                                <Text style={{ fontSize: '16px', marginBottom: '8px', display: 'block' }}>
                                    Last Connected: {connectionStatus.lastConnected
                                        ? new Date(connectionStatus.lastConnected).toLocaleString()
                                        : 'Never'
                                    }
                                </Text>
                                <Text style={{ fontSize: '16px', marginBottom: '8px', display: 'block' }}>
                                    Reconnect Attempts: {connectionStatus.reconnectAttempts || 0}
                                </Text>
                            </div>

                            <Space>
                                <Button
                                    icon={<ReloadOutlined />}
                                    onClick={handleConnectionTest}
                                    loading={checkingConnection}
                                    size="large"
                                >
                                    Test Connection
                                </Button>
                                <Button
                                    icon={<WifiOutlined />}
                                    onClick={handleReconnect}
                                    size="large"
                                    type="primary"
                                    disabled={connectionStatus.connected}
                                >
                                    Reconnect
                                </Button>
                            </Space>
                        </Space>
                    </Card>
                </Col>

                {/* App Settings */}
                <Col xs={24} lg={12}>
                    <Card className="tablet-card" style={{ height: '100%' }}>
                        <Title level={4} style={{ marginBottom: '20px' }}>
                            App Settings
                        </Title>

                        <Space direction="vertical" style={{ width: '100%' }} size="large">
                            <div>
                                <Row justify="space-between" align="middle" style={{ marginBottom: '12px' }}>
                                    <Col>
                                        <Text style={{ fontSize: '16px' }}>Enable Notifications</Text>
                                    </Col>
                                    <Col>
                                        <Switch
                                            checked={notificationsEnabled}
                                            onChange={setNotificationsEnabled}
                                            size="default"
                                        />
                                    </Col>
                                </Row>
                                <Text type="secondary">Receive alerts for new jobs and updates</Text>
                            </div>

                            <div>
                                <Text style={{ fontSize: '16px', marginBottom: '12px', display: 'block' }}>
                                    Sound Volume: {soundVolume}%
                                </Text>
                                <Slider
                                    value={soundVolume}
                                    onChange={setSoundVolume}
                                    tooltip={{ formatter: (value) => `${value}%` }}
                                />
                                <Text type="secondary">Adjust notification sound volume</Text>
                            </div>

                            <div>
                                <Row justify="space-between" align="middle" style={{ marginBottom: '12px' }}>
                                    <Col>
                                        <Text style={{ fontSize: '16px' }}>Auto Refresh</Text>
                                    </Col>
                                    <Col>
                                        <Switch
                                            checked={autoRefresh}
                                            onChange={setAutoRefresh}
                                            size="default"
                                        />
                                    </Col>
                                </Row>
                                <Text type="secondary">Automatically refresh job queue every 30 seconds</Text>
                            </div>
                        </Space>
                    </Card>
                </Col>

                {/* Issue Reporting */}
                <Col xs={24} lg={12}>
                    <Card className="tablet-card" style={{ height: '100%' }}>
                        <Title level={4} style={{ marginBottom: '20px' }}>
                            <BugOutlined style={{ marginRight: '8px' }} />
                            Report Issue
                        </Title>

                        <Space direction="vertical" style={{ width: '100%' }} size="large">
                            <Text style={{ fontSize: '16px' }}>
                                Experiencing problems with the machine or app? Describe the issue below:
                            </Text>

                            <TextArea
                                rows={6}
                                value={issueReport}
                                onChange={(e) => setIssueReport(e.target.value)}
                                placeholder="Describe the issue you're experiencing..."
                                style={{ fontSize: '16px' }}
                            />

                            <Button
                                type="primary"
                                icon={<BugOutlined />}
                                onClick={handleReportIssue}
                                loading={reportingIssue}
                                size="large"
                                block
                                disabled={!issueReport.trim()}
                            >
                                Report Issue
                            </Button>
                        </Space>
                    </Card>
                </Col>

                {/* Device Information */}
                <Col xs={24}>
                    <Card className="tablet-card">
                        <Title level={4} style={{ marginBottom: '20px' }}>
                            Device Information
                        </Title>
                        <Row gutter={[40, 20]}>
                            <Col xs={24} sm={12} md={8}>
                                <div>
                                    <Text strong style={{ fontSize: '16px', display: 'block', marginBottom: '4px' }}>
                                        User Agent
                                    </Text>
                                    <Text type="secondary" style={{ fontSize: '14px', wordBreak: 'break-all' }}>
                                        {navigator.userAgent}
                                    </Text>
                                </div>
                            </Col>
                            <Col xs={24} sm={12} md={8}>
                                <div>
                                    <Text strong style={{ fontSize: '16px', display: 'block', marginBottom: '4px' }}>
                                        Screen Resolution
                                    </Text>
                                    <Text type="secondary" style={{ fontSize: '14px' }}>
                                        {window.screen.width} × {window.screen.height}
                                    </Text>
                                </div>
                            </Col>
                            <Col xs={24} sm={12} md={8}>
                                <div>
                                    <Text strong style={{ fontSize: '16px', display: 'block', marginBottom: '4px' }}>
                                        Viewport Size
                                    </Text>
                                    <Text type="secondary" style={{ fontSize: '14px' }}>
                                        {window.innerWidth} × {window.innerHeight}
                                    </Text>
                                </div>
                            </Col>
                            <Col xs={24} sm={12} md={8}>
                                <div>
                                    <Text strong style={{ fontSize: '16px', display: 'block', marginBottom: '4px' }}>
                                        Online Status
                                    </Text>
                                    <Tag color={navigator.onLine ? 'green' : 'red'}>
                                        {navigator.onLine ? 'Online' : 'Offline'}
                                    </Tag>
                                </div>
                            </Col>
                            <Col xs={24} sm={12} md={8}>
                                <div>
                                    <Text strong style={{ fontSize: '16px', display: 'block', marginBottom: '4px' }}>
                                        Language
                                    </Text>
                                    <Text type="secondary" style={{ fontSize: '14px' }}>
                                        {navigator.language}
                                    </Text>
                                </div>
                            </Col>
                            <Col xs={24} sm={12} md={8}>
                                <div>
                                    <Text strong style={{ fontSize: '16px', display: 'block', marginBottom: '4px' }}>
                                        Platform
                                    </Text>
                                    <Text type="secondary" style={{ fontSize: '14px' }}>
                                        {navigator.platform}
                                    </Text>
                                </div>
                            </Col>
                        </Row>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default Settings; 