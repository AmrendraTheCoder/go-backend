import { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Button, Typography, Space, Badge } from 'antd';
import {
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    DashboardOutlined,
    FileTextOutlined,
    TeamOutlined,
    InventoryOutlined,
    UserOutlined,
    LogoutOutlined,
    SettingOutlined,
    BellOutlined,
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const DashboardLayout = ({ children }) => {
    const [collapsed, setCollapsed] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();

    const menuItems = [
        {
            key: '/dashboard/jobs',
            icon: <FileTextOutlined />,
            label: 'Job Management',
        },
        {
            key: '/dashboard/customers',
            icon: <TeamOutlined />,
            label: 'Customer Management',
        },
        {
            key: '/dashboard/inventory',
            icon: <InventoryOutlined />,
            label: 'Inventory Management',
        },
        {
            key: '/dashboard/users',
            icon: <UserOutlined />,
            label: 'User Management',
        },
    ];

    const userMenuItems = [
        {
            key: 'profile',
            icon: <UserOutlined />,
            label: 'Profile',
        },
        {
            key: 'settings',
            icon: <SettingOutlined />,
            label: 'Settings',
        },
        {
            type: 'divider',
        },
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: 'Logout',
            onClick: () => {
                logout();
                navigate('/login');
            },
        },
    ];

    const handleMenuClick = ({ key }) => {
        navigate(key);
    };

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider
                trigger={null}
                collapsible
                collapsed={collapsed}
                style={{
                    background: '#fff',
                    boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
                }}
            >
                <div style={{
                    height: 64,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderBottom: '1px solid #f0f0f0',
                    margin: '0 16px',
                }}>
                    {!collapsed ? (
                        <Text strong style={{ color: '#1890ff', fontSize: '16px' }}>
                            Manufacturing
                        </Text>
                    ) : (
                        <DashboardOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
                    )}
                </div>

                <Menu
                    mode="inline"
                    selectedKeys={[location.pathname]}
                    items={menuItems}
                    onClick={handleMenuClick}
                    style={{
                        height: 'calc(100% - 64px)',
                        borderRight: 0,
                        background: '#fff',
                    }}
                />
            </Sider>

            <Layout>
                <Header style={{
                    background: '#fff',
                    padding: '0 24px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}>
                    <Button
                        type="text"
                        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                        onClick={() => setCollapsed(!collapsed)}
                        style={{ fontSize: '16px', width: 64, height: 64 }}
                    />

                    <Space size="large">
                        <Badge count={3} size="small">
                            <Button type="text" icon={<BellOutlined />} size="large" />
                        </Badge>

                        <Dropdown
                            menu={{ items: userMenuItems }}
                            placement="bottomRight"
                            trigger={['click']}
                        >
                            <Space style={{ cursor: 'pointer' }}>
                                <Avatar
                                    style={{ backgroundColor: '#1890ff' }}
                                    icon={<UserOutlined />}
                                />
                                <div style={{ textAlign: 'left' }}>
                                    <div style={{ fontWeight: 'bold' }}>
                                        {user?.name || 'Admin User'}
                                    </div>
                                    <Text type="secondary" style={{ fontSize: '12px' }}>
                                        {user?.role || 'Administrator'}
                                    </Text>
                                </div>
                            </Space>
                        </Dropdown>
                    </Space>
                </Header>

                <Content style={{
                    margin: '24px',
                    background: '#f5f5f5',
                    minHeight: 280,
                }}>
                    {children}
                </Content>
            </Layout>
        </Layout>
    );
};

export default DashboardLayout; 