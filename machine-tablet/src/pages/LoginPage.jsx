import { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Select, message, Row, Col, Typography, Space, Alert } from 'antd';
import { UserOutlined, LockOutlined, DesktopOutlined, WifiOutlined, DisconnectOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import socketService from '../services/socketService';

const { Title, Text } = Typography;
const { Option } = Select;

const LoginPage = () => {
    const navigate = useNavigate();
    const { login, loading, error } = useAuthStore();
    const [form] = Form.useForm();
    const [connectionStatus, setConnectionStatus] = useState(socketService.getConnectionStatus());

    // Sample machines for demo - in production this would come from API
    const availableMachines = [
        { id: 'MACHINE-001', name: 'Heidelberg Offset Press #1' },
        { id: 'MACHINE-002', name: 'Komori Sheet-Fed Press #2' },
        { id: 'MACHINE-003', name: 'Roland Digital Press #3' },
        { id: 'MACHINE-004', name: 'Konica Minolta AccurioPress #4' },
        { id: 'MACHINE-005', name: 'HP Indigo Press #5' }
    ];

    useEffect(() => {
        // Monitor connection status
        const connectionInterval = setInterval(() => {
            setConnectionStatus(socketService.getConnectionStatus());
        }, 2000);

        return () => {
            clearInterval(connectionInterval);
        };
    }, []);

    const handleLogin = async (values) => {
        const { email, password, machineId } = values;

        const result = await login(email, password, machineId);

        if (result.success) {
            message.success('Login successful!');
            navigate('/');
        } else {
            message.error(result.error || 'Login failed');
        }
    };

    return (
        <div className="login-container">
            <Row justify="center" align="middle" style={{ minHeight: '100vh', padding: '20px' }}>
                <Col xs={24} sm={20} md={16} lg={12} xl={8}>
                    <Card className="login-card tablet-card">
                        {/* Header */}
                        <div className="login-header">
                            <Space direction="vertical" align="center" style={{ width: '100%' }}>
                                <DesktopOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
                                <Title level={2} style={{ margin: '16px 0 8px', fontSize: '28px' }}>
                                    Machine Operator Login
                                </Title>
                                <Text type="secondary" style={{ fontSize: '16px', textAlign: 'center' }}>
                                    Sign in to access your machine's job queue
                                </Text>
                            </Space>
                        </div>

                        {/* Connection Status */}
                        <div style={{ marginBottom: '24px' }}>
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
                                                <span>Connection lost - working offline</span>
                                            </>
                                        )}
                                    </Space>
                                }
                                type={connectionStatus.connected ? 'success' : 'warning'}
                                showIcon={false}
                            />
                        </div>

                        {/* Error Display */}
                        {error && (
                            <Alert
                                message="Login Error"
                                description={error}
                                type="error"
                                style={{ marginBottom: '24px' }}
                                showIcon
                            />
                        )}

                        {/* Login Form */}
                        <Form
                            form={form}
                            name="machine-login"
                            onFinish={handleLogin}
                            layout="vertical"
                            size="large"
                            className="login-form"
                        >
                            <Form.Item
                                name="email"
                                label="Email"
                                rules={[
                                    { required: true, message: 'Please enter your email' },
                                    { type: 'email', message: 'Please enter a valid email' }
                                ]}
                            >
                                <Input
                                    prefix={<UserOutlined />}
                                    placeholder="Enter your email"
                                    autoComplete="email"
                                />
                            </Form.Item>

                            <Form.Item
                                name="password"
                                label="Password"
                                rules={[{ required: true, message: 'Please enter your password' }]}
                            >
                                <Input.Password
                                    prefix={<LockOutlined />}
                                    placeholder="Enter your password"
                                    autoComplete="current-password"
                                />
                            </Form.Item>

                            <Form.Item
                                name="machineId"
                                label="Machine"
                                rules={[{ required: true, message: 'Please select your machine' }]}
                            >
                                <Select
                                    placeholder="Select the machine you're operating"
                                    showSearch
                                    filterOption={(input, option) =>
                                        option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                                    }
                                >
                                    {availableMachines.map(machine => (
                                        <Option key={machine.id} value={machine.id}>
                                            {machine.name}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>

                            <Form.Item style={{ marginTop: '32px' }}>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    loading={loading}
                                    block
                                    size="large"
                                    style={{ height: '50px', fontSize: '18px' }}
                                >
                                    Sign In
                                </Button>
                            </Form.Item>
                        </Form>

                        {/* Demo Credentials */}
                        <div className="demo-credentials">
                            <Alert
                                message="Demo Credentials"
                                description={
                                    <div>
                                        <p><strong>Machine Operator:</strong></p>
                                        <p>Email: operator@printshop.com</p>
                                        <p>Password: operator123</p>
                                        <p><strong>Any machine can be selected for demo</strong></p>
                                    </div>
                                }
                                type="info"
                                showIcon
                            />
                        </div>

                        {/* Footer */}
                        <div className="login-footer">
                            <Text type="secondary" style={{ textAlign: 'center', display: 'block', fontSize: '14px' }}>
                                PrintShop Management System - Machine Interface
                            </Text>
                            <Text type="secondary" style={{ textAlign: 'center', display: 'block', fontSize: '12px', marginTop: '8px' }}>
                                For support, contact your system administrator
                            </Text>
                        </div>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default LoginPage; 