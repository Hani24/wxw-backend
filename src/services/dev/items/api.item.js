const logger = require('mii-logger.js');
const Axi = require('../../Axi');

class Api {

  constructor( App, name, params={} ){
    this.App = App;
    this.name = name;
    this.params = params;

    this.apiBase = App.getEnv('PROTODOMAIN');
    this._api = Axi( this.App, { base: this.apiBase });
    this._api.addDefaultHeader('content-type', 'application/json');
    this._authToken = '';

  }

  setAuthToken(token){
    this._authToken = this.App.isString(token) ? token : '';
    this._api.addDefaultHeader('Authorization',`Bearer ${this._authToken}`);
  }

  async get(){
    const res = await this._api.get(...arguments);
    return res.success && res.data.success ? res.data : res;
  }
  async post(){
    const res = await this._api.post(...arguments);
    return res.success && res.data.success ? res.data : res;
  }
  async put(){
    const res = await this._api.put(...arguments);
    return res.success && res.data.success ? res.data : res;
  }
  async head(){
    const res = await this._api.head(...arguments);
    return res.success && res.data.success ? res.data : res;
  }
  async delete(){
    const res = await this._api.delete(...arguments);
    return res.success && res.data.success ? res.data : res;
  }
  async option(){
    const res = await this._api.option(...arguments);
    return res.success && res.data.success ? res.data : res;
  }

  // local-host dev-auths
  getDevAuthTokens(){
    return {
      admin: {
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjcsInNlc3Npb25JZCI6MzIsInRva2VuIjoiMTBiNWIzYTA2ZWEyMGI4YWZmMjdjYTI0YWY0MDZjMGNiYzg0OTFiMGRlODE3M2E5MTZhOThkZmQxZTYxOGVjMSIsInJvbGUiOiJhZG1pbiIsImNvdW50cnkiOiJCRSIsInRpbWV6b25lIjoiRXVyb3BlL0JydXNzZWxzIiwiaXAiOiIxNDEuMTM1LjIwMC4xMDIiLCJkYXRlIjoiMjAyMi0wNC0yMlQyMTo1MTozNSIsImlhdCI6MTY1MDY1NzA5NX0.xZwT-Q2GFPq30c194zbQgafDH2b4M-_XiUrqObpRVQY',
      },
      restaurant: {
        name: 'kfc',
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjgsInJlc3RhdXJhbnRJZCI6Miwic2Vzc2lvbklkIjozMSwidG9rZW4iOiJhMTJmNzhkY2UxN2Q4NTc3MzZhMDczYjUwMmIxMTk1ZjlkZDg2MDQ4ODA4OTA1ZmQ4MGFhYjU0NTBkMTQ2ZjFkIiwicm9sZSI6InJlc3RhdXJhbnQiLCJjb3VudHJ5IjoiQkUiLCJ0aW1lem9uZSI6IkV1cm9wZS9CcnVzc2VscyIsImlwIjoiMTQxLjEzNS4yMDAuMTAyIiwiZGF0ZSI6IjIwMjItMDctMTVUMTc6MDE6MDUiLCJpYXQiOjE2NTc4OTcyNjV9.8DbuGPSHShA_ItnXwFa93WLp0U0Jk8oeYAhFAz2WgeE',
      },
      courier: {
        phone: '+32499333333',
        userId: 52,
        courierId: 8,
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjUyLCJzZXNzaW9uSWQiOjYwLCJ0b2tlbiI6IjYzZjhmMGM1NzQ0ODEzYWFlNGUzMDBhNGUzNDRiMTdhYTBhMGYxYWRiYjExYWY3ODg0MThmNGY5ZTI5ZjA1ZmMiLCJyb2xlIjoiY291cmllciIsImlhdCI6MTY1ODQ4Njg1NH0.ez24uHlNwVIP6JKrDP4_Hk5QaDewnGORYUHBiKntDXk',
      },
      client: {
        phone: '+32499111111',
        userId: 51,
        clientId: 0,
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjUxLCJzZXNzaW9uSWQiOjY0LCJ0b2tlbiI6IjQ5M2FiN2YyM2QzMjgwMjIwMWEyNTFiZGQwNmUwN2M3MmYzYzlmMzMxMzUzNWRmM2Y5ZmZmNGFiMjJjYjZlZTYiLCJyb2xlIjoiY2xpZW50IiwiaWF0IjoxNjU4NDg3NTM2fQ.Kvhh4PSZIHJ3nRlOQSBglIg1S4vKgKiGmh1poVlOTWI',
      },
    }
  }

}

module.exports = (App, name, params={})=>{
  return new Api(App, name, params);
}
