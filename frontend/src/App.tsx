import { Refine, Resource } from '@pankod/refine';

import '@pankod/refine/dist/styles.min.css';
import simpleRestDataProvider from '@pankod/refine-simple-rest';
import { PhotoLibrary } from './pages/PhotoLibrary';
import { Login } from 'pages/login';
import {
  Title,
  Header,
  Sider,
  Footer,
  Layout,
  OffLayoutArea,
} from 'components';
import { useTranslation } from 'react-i18next';
import authProvider from 'components/auth';

function App() {
  const { t, i18n } = useTranslation();

  const API_URL = 'https://api.fake-rest.refine.dev';
  const dataProvider = simpleRestDataProvider(API_URL);

  const i18nProvider = {
    translate: (key: string, params: object) => t(key, params),
    changeLocale: (lang: string) => i18n.changeLanguage(lang),
    getLocale: () => i18n.language,
  };

  return (
    <Refine
      authProvider={authProvider}
      dataProvider={dataProvider}
      Title={Title}
      Header={Header}
      Sider={Sider}
      Footer={Footer}
      Layout={Layout}
      LoginPage={Login}
      OffLayoutArea={OffLayoutArea}
      i18nProvider={i18nProvider}
    >
      <Resource name="Photo" list={PhotoLibrary} />
    </Refine>
  );
}

export default App;
