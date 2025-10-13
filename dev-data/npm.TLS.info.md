https://github.blog/2021-08-23-npm-registry-deprecating-tls-1-0-tls-1-1/

#### Ensuring your compatibility

To make sure that your version of npm supports TLS 1.2, you can install 
a test package from an HTTPS endpoint that already has TLS 1.0 and TLS 1.1 disabled:

```bash
npm install -g https://tls-test.npmjs.com/tls-test-1.0.0.tgz

```