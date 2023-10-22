import { CognitoUser, CognitoUserPool, AuthenticationDetails } from 'amazon-cognito-identity-js';

// Configure your Cognito user pool
const poolData = {
  UserPoolId: 'ap-southeast-1_aWhLMrog7',
  ClientId: '7ginjs0kkqor3u36o1magf11gv',
};
const userPool = new CognitoUserPool(poolData);

const authProvider = {
  login: async (params: any) => {
    const { username, password } = params;

    const authenticationData = {
      Username: username,
      Password: password,
    };

    const authenticationDetails = new AuthenticationDetails(authenticationData);

    const userData = {
      Username: username,
      Pool: userPool,
    };

    const cognitoUser = new CognitoUser(userData);

    return new Promise<void>((resolve, reject) => {
      cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: (session) => {
          // Authentication successful
          localStorage.setItem('accessToken', session.getAccessToken().getJwtToken());
          localStorage.setItem('username', session.getIdToken().payload.email);
          resolve();
        },
        onFailure: (err) => {
          // Authentication failed
          reject(err);
        },
        newPasswordRequired: (userAttributes) => {
          // User needs to set a new password
          // Handle this case accordingly
          reject(new Error('New password required'));
        },
      });
    });
  },
  logout: () => {
    // Clear tokens or perform any necessary logout actions
    localStorage.removeItem('accessToken');
    return Promise.resolve();
  },
  checkError: () => Promise.resolve(),
  checkAuth: () => {
    const accessToken = localStorage.getItem('accessToken');
    return accessToken ? Promise.resolve() : Promise.reject();
  },
  getPermissions: () => Promise.resolve(['admin']),
  getUserIdentity: () => {
    const username = localStorage.getItem('username');
    return Promise.resolve({
      id: 1,
      name: username,
      avatar: '/admin.png',
    });
  },
};

export default authProvider;
