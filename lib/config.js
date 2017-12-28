'use babel';

export default {
  accessKey: {
    description: 'Access API Key. You can create access/secret key pair at https://cloud.backend.ai .',
    type: 'string',
    default: '',
    order: 1
  },
  secretKey: {
    description: 'Secret API Key.',
    type: 'string',
    default: '',
    order: 2
  },
  endpoint: {
    description: 'Backend.AI server endpoint. Default endpoint is Backend.AI Cloud service.',
    type: 'string',
    default: 'https://api.backend.ai',
    order: 3
  }
};
