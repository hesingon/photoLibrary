import {
  AntdLayout,
  Space,
  Button,
  Avatar,
  Typography,
  useGetIdentity,
  useLogout,
} from "@pankod/refine";

const { Text } = Typography;

export const Header: React.FC = () => {

  const { data: user } = useGetIdentity();

  const { mutate: logout } = useLogout();

  return (
    <AntdLayout.Header
      style={{
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        padding: "0px 24px",
        height: "64px",
        backgroundColor: "#FFF",
      }}
    >
      <Button 
        onClick={() => logout()}
      >
        Log out
      </Button>
      <Space style={{ marginLeft: "8px" }}>
        {user?.name && (
          <Text ellipsis strong>
            {user.name}
          </Text>
        )}
        {user?.avatar && <Avatar src={user?.avatar} alt={user?.name} />}
      </Space>
    </AntdLayout.Header>
  );
};
