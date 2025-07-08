import { useState } from 'react';
import { Card, Button, Space, Typography, Modal } from 'antd';
import { DownloadOutlined, CloseOutlined, MobileOutlined, DesktopOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const PWAPrompt = ({ installPrompt, onInstall, onDismiss }) => {
  const [visible, setVisible] = useState(true);
  const [installing, setInstalling] = useState(false);

  const handleInstall = async () => {
    if (!installPrompt) return;

    setInstalling(true);
    
    try {
      // Show the install prompt
      installPrompt.prompt();
      
      // Wait for the user to respond to the prompt
      const { outcome } = await installPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
        onInstall();
      } else {
        console.log('User dismissed the install prompt');
        onDismiss();
      }
    } catch (error) {
      console.error('Error during install:', error);
      onDismiss();
    } finally {
      setInstalling(false);
      setVisible(false);
    }
  };

  const handleDismiss = () => {
    setVisible(false);
    onDismiss();
  };

  if (!visible || !installPrompt) {
    return null;
  }

  return (
    <Modal
      open={visible}
      footer={null}
      closable={false}
      centered
      width={600}
      className="pwa-install-modal"
    >
      <Card 
        className="tablet-card"
        style={{ 
          border: 'none',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        }}
      >
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <MobileOutlined 
            style={{ 
              fontSize: '64px', 
              color: 'white',
              marginBottom: '20px'
            }} 
          />
          
          <Title level={2} style={{ color: 'white', marginBottom: '16px' }}>
            Install Machine Operator App
          </Title>
          
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Text style={{ fontSize: '18px', color: 'rgba(255,255,255,0.9)' }}>
              Install this app on your tablet for a better experience:
            </Text>
            
            <div style={{ textAlign: 'left', padding: '0 20px' }}>
              <Space direction="vertical" size="middle">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <DesktopOutlined style={{ fontSize: '20px', color: 'white' }} />
                  <Text style={{ fontSize: '16px', color: 'rgba(255,255,255,0.9)' }}>
                    Works offline - access job queue even without internet
                  </Text>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <DesktopOutlined style={{ fontSize: '20px', color: 'white' }} />
                  <Text style={{ fontSize: '16px', color: 'rgba(255,255,255,0.9)' }}>
                    Faster loading and better performance
                  </Text>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <DesktopOutlined style={{ fontSize: '20px', color: 'white' }} />
                  <Text style={{ fontSize: '16px', color: 'rgba(255,255,255,0.9)' }}>
                    Full-screen tablet interface
                  </Text>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <DesktopOutlined style={{ fontSize: '20px', color: 'white' }} />
                  <Text style={{ fontSize: '16px', color: 'rgba(255,255,255,0.9)' }}>
                    Real-time notifications for new jobs
                  </Text>
                </div>
              </Space>
            </div>
            
            <Space size="large" style={{ marginTop: '32px' }}>
              <Button
                type="primary"
                size="large"
                icon={<DownloadOutlined />}
                onClick={handleInstall}
                loading={installing}
                style={{
                  height: '56px',
                  fontSize: '18px',
                  fontWeight: '600',
                  minWidth: '160px',
                  background: 'white',
                  borderColor: 'white',
                  color: '#1890ff'
                }}
              >
                {installing ? 'Installing...' : 'Install App'}
              </Button>
              
              <Button
                size="large"
                icon={<CloseOutlined />}
                onClick={handleDismiss}
                style={{
                  height: '56px',
                  fontSize: '18px',
                  fontWeight: '600',
                  minWidth: '120px',
                  background: 'rgba(255,255,255,0.1)',
                  borderColor: 'rgba(255,255,255,0.3)',
                  color: 'white'
                }}
              >
                Not Now
              </Button>
            </Space>
          </Space>
        </div>
      </Card>
    </Modal>
  );
};

export default PWAPrompt; 