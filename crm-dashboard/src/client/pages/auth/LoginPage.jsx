import { App, Button, Form, Input } from 'antd';
import { LockOutlined, LoginOutlined, MailOutlined, UserAddOutlined } from '@ant-design/icons';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
  const [form] = Form.useForm();
  const { notification } = App.useApp();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectTo = location.state?.from || '/client';

  const handleLogin = async () => {
    try {
      const values = await form.validateFields();
      const user = await login(values);
      notification.success({
        title: 'Đăng nhập thành công',
        description: `Xin chào ${user.name}!`,
        placement: 'topRight',
      });
      navigate(redirectTo, { replace: true });
    } catch (error) {
      notification.error({
        title: 'Đăng nhập thất bại',
        description:
          error instanceof Error
            ? error.message
            : 'Vui lòng kiểm tra lại email và mật khẩu.',
        placement: 'topRight',
      });
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Đăng nhập</h1>
        <p className="text-sm text-gray-400 mb-6">Đăng nhập để quản lý giỏ hàng và đặt hàng.</p>

        <Form form={form} layout="vertical" requiredMark={false}>
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
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="••••••••" />
          </Form.Item>

          <Button
            type="primary"
            icon={<LoginOutlined />}
            block
            className="!bg-[#6160DC] hover:!bg-[#5756c5] !rounded-xl !font-bold"
            onClick={handleLogin}
          >
            Đăng nhập
          </Button>
        </Form>

        <div className="mt-4 text-sm text-gray-500 text-center">
          Chưa có tài khoản?{' '}
          <Link to="/client/register" className="text-[#6160DC] font-semibold">
            <UserAddOutlined className="mr-1" />
            Đăng ký ngay
          </Link>
        </div>
      </div>
    </div>
  );
}
