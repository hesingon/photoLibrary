import { Row, Col, Card, Typography } from '@pankod/refine';
import UploadPhotos from './components/UploadPhotos';
import DisplayPhotos from './components/DisplayPhotos';
import { checkIsAdmin } from 'pages/PhotoLibrary/components/util';
const { Text } = Typography;

export const PhotoLibrary: React.FC = () => {

  return (
    <Row gutter={[16, 16]}>
      <Col xl={17} lg={16} md={24} sm={24} xs={24}>
        <Card
          bodyStyle={{
            height: 800,
            overflowY: 'scroll',
          }}
          title={
            <div>
              <Text strong>John's Public Photos</Text>
              {checkIsAdmin() && <UploadPhotos />}
            </div>
          }
        >
          <DisplayPhotos />
        </Card>
      </Col>
    </Row>
  );
};
