import { useState } from 'react';
import { Form, Input, Button, Card, Alert, Typography, Space } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAuthStore } from '../stores/authStore';

const { Title, Text } = Typography;

const LoginPage = () => {
    const [form] = Form.useForm();
    const { login, loading, error, clearError } = useAuthStore();

    const handleSubmit = async (values) => {
        clearError();
        const result = await login(values);
        if (!result.success) {
            // Error is handled in the store
        }
    };

    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}>
            <Card
                style={{
                    width: 400,
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                }}
            >
                <Space direction="vertical" size="large" style={{ width: '100%', textAlign: 'center' }}>
                    <div>
                        <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
                            Manufacturing Operations
                        </Title>
                        <Text type="secondary">Admin Portal</Text>
                    </div>

                    {error && (
                        <Alert
                            message={error}
                            type="error"
                            showIcon
                            closable
                            onClose={clearError}
                        />
                    )}

                    <Form
                        form={form}
                        name="login"
                        onFinish={handleSubmit}
                        size="large"
                        autoComplete="off"
                    >
                        <Form.Item
                            name="email"
                            rules={[
                                { required: true, message: 'Please input your email!' },
                                { type: 'email', message: 'Please enter a valid email!' },
                            ]}
                        >
                            <Input
                                prefix={<UserOutlined />}
                                placeholder="Email"
                                autoComplete="username"
                            />
                        </Form.Item>

                        <Form.Item
                            name="password"
                            rules={[
                                { required: true, message: 'Please input your password!' },
                                { min: 6, message: 'Password must be at least 6 characters!' },
                            ]}
                        >
                            <Input.Password
                                prefix={<LockOutlined />}
                                placeholder="Password"
                                autoComplete="current-password"
                            />
                        </Form.Item>

                        <Form.Item>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={loading}
                                style={{ width: '100%' }}
                            >
                                Sign In
                            </Button>
                        </Form.Item>
                    </Form>

                    <Text type="secondary" style={{ fontSize: '12px' }}>
                        Demo Credentials: admin@company.com / password123
                    </Text>
                </Space>
            </Card>
        </div>
    );
};

export default LoginPage; 