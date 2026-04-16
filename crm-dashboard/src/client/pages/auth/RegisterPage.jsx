import { App, Button, Form, Input } from 'antd';
import { LockOutlined, MailOutlined, UserOutlined, UserAddOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function RegisterPage() {
  const [form] = Form.useForm();
  const { notification } = App.useApp();
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async () => {
    try {
      const values = await form.validateFields();
      await register(values);
      notification.success({
        title: 'Đăng ký thành công',
        description: 'Tài khoản user của bạn đã được tạo và đăng nhập tự động.',
        placement: 'topRight',
      });
      navigate('/client');
    } catch (error) {
      notification.error({
        title: 'Đăng ký thất bại',
        description:
          error instanceof Error ? error.message : 'Không thể tạo tài khoản mới.',
        placement: 'topRight',
      });
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Đăng ký tài khoản</h1>
        <p className="text-sm text-gray-400 mb-6">Tạo tài khoản mới để bắt đầu mua sắm.</p>

        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item
            label="Họ và tên"
            name="name"
            rules={[
              { required: true, message: 'Vui lòng nhập họ tên' },
              { min: 2, message: 'Họ tên phải có ít nhất 2 ký tự' },
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder="Nguyễn Văn A" />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Vui lòng nhập email' },
              { type: 'email', message: 'Email không hợp lệ' },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="you@example.com" />
          </Form.Item>

          <Form.Item
            label="Mật khẩu"
            name="password"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu' },
              { min: 6, message: 'Mật khẩu tối thiểu 6 ký tự' },
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="••••••••" />
          </Form.Item>

          <Form.Item
            label="Nhập lại mật khẩu"
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Vui lòng nhập lại mật khẩu' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Mật khẩu nhập lại không khớp'));
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="••••••••" />
          </Form.Item>

          <Button
            type="primary"
            icon={<UserAddOutlined />}
            block
            className="!bg-[#6160DC] hover:!bg-[#5756c5] !rounded-xl !font-bold"
            onClick={handleRegister}
          >
            Đăng ký
          </Button>
        </Form>

        <div className="mt-4 text-sm text-gray-500 text-center">
          Đã có tài khoản?{' '}
          <Link to="/client/login" className="text-[#6160DC] font-semibold">
            Đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
}
