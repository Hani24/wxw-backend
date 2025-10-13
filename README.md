#### Backend



##### Envs Common Configs

```bash

# All envs root
/src/envs/<ENV-TYPE>

# Main App-Envs:
/src/envs/<ENV-TYPE>/config.js
copy /src/envs/<ENV-TYPE>/config.example.js => /src/envs/<ENV-TYPE>/config.js

# Common Sequelize config:
/src/envs/<ENV-TYPE>/sequelize.config.js

```

##### Envs Server Configs

```bash

copy /src/envs/<ENV-TYPE>/server.config.example.js => /src/envs/<ENV-TYPE>/server.config.js

```

##### Envs Server Configs Description

```json
{

  "ops":"...",
  "mainServices": [
    // list of services names (auto-injected as App[ service-name ])
    // from ./src/services/{...}
  ],
  "ops":"...",
}
```

##### Logs App: 

```bash
./logs/
├── info/*.log
├── debug/*.log
├── access/*.log
├── error/*.log
├── warn/*.log
└── fatal/*.log
```

##### PM2 Configs and logs: 

```bash

# config:
./pm2.<ENV-TYPE>.ecosystem.config.js

# logs: 
./pm2/*.log

```

##### Sequelize

```bash

# required Sequelize.RC file @[/] App-Root: /.sequelizerc

require('./src/envs/init.env.js');
require('babel-register');
const path = require('path');
const SRC = __dirname+'/src';
const NODE_ENV = process.env.NODE_ENV;

module.exports = {
  'env': NODE_ENV,
  'debug' : true,
  'config': SRC+'/envs/'+NODE_ENV+'/sequelize.config.js',
  'models-path': SRC+'/DB/models',
  'seeders-path': SRC+'/DB/seeders',
  'migrations-path': SRC+'/DB/migrations'
};

# All models are auto-injected in App and can be accessed @runtime via App.getModel('NameOfModel')...

# All Models relations are defined in:
./src/DB/setUpForeignKeys.js
```

##### Sequelize data locations:

Visual (html/css) DB Schema: /src/public_html/dev/data-view/db/schema/main.html

```bash

root: /src/DB

# common (static) Model methods that are applied to each model
/src/DB/common-methods/*

# migrations
/src/DB/migrations/

# models
/src/DB/models/

# seeds
/src/DB/seeds/
```

##### Sequelize exec

```bash
# All exec-ops like migrate, run etc, must me used with NODE_ENV as <ENV-TYPE> e.g.:

npm run start:dev # NODE_ENV=dev nodemon index.js
npm run migrate:dev # NODE_ENV=dev npx sequelize db:migrate --env dev
# etc ...
```

##### Emails and templates: 

```bash

#Emails: (auto-injected)
./src/email-templates/*.js

#Templates: (auto-injected)
./src/services/Mailer/templates/templates/***

#Runtime exec results of sent emails: 
/app-runtime/data/emails/<UEMID>@<DOMAIN>.html

```

##### Background Jobs:

```bash
/src/cron/jobs/*.job.js
```


##### Crypto:

```bash

/src/crypto/certs/*
# aff-dev.devio.key # dev keys supplied in the repo, do not use it in prod
# aff-dev.devio.pem # dev keys supplied in the repo, do not use it in prod
```

###### Generate new keys if required:

```bash

KEY_NAME="aff-dev.devio";

openssl req \
-passout pass:mySuperP@$$w0rd \
-x509 \
-nodes \
-new \
-newkey rsa:2048 \
-keyout "$KEY_NAME.key.pem" \
-out "$KEY_NAME.cert.pem" \
-subj /CN="$KEY_NAME" \
-reqexts SAN \
-extensions SAN \
-config <(cat /usr/lib/ssl/openssl.cnf <(printf "[SAN]\nsubjectAltName=DNS:$1")) \
-sha256 \
-days 3650

```

###### RSA Keys:

```bash

# if no keys are available, backend will generate new pair with name provided via ENV: 

# Main App-Envs: => /src/envs/<ENV-TYPE>/config.js
# const RSA_SEC_KEY = `rsa.${NODE_ENV}.sec.key`;
# const RSA_PUB_KEY = `rsa.${NODE_ENV}.pub.key`;
# const RSA_MODULUS_LENGTH = 4096;

root: /src/crypto/rsa/

```

###### App (express-middlewares): (auto-injected) /src/express/middlewares/middlewares/

Middlewares are applied/injected automatic @startup

```bash

root: /src/express/middlewares/middlewares/

# Middlewate names are formed as:
<number>.<name>.middleware.js
number: injection order of all middleware
name: any string name
extention: must end with <.middleware.js>, else middleware will be ignored
```

###### App (express-routes): (auto-injected) /src/routes/

```bash

# private: executes 2 types of Auth.
#   1. Main User Auth via middleware: /src/express/middlewares/middlewares/01.passport.middleware.js
#   2. Role Based Auth via middleware: /src/express/middlewares/middlewares/02.access.middleware.js
#   3. Each role can only access own sub-set of routes: 
#      example: role:admin => only: /src/routes/private/admin etc ...
#      only: /src/routes/private/common can be accessed by all authenticated users
#   4. /src/routes/public/ can be accessed by anyone via any browser/app/api etc ...
#   5. There are 3 exeptions in the access-rules:
#      Super-Admin (owner): can access any restaurant routes and data via admin-token 
#      Restaurant-Manager: can access any restaurant via manager-token 
#      Restaurant-Employee: can access ONLY small sub-set of /src/routes/private/restaurant/***** via employee-token 

./src/routes/*
├── private # required User-Auth + Role-Auth (admin,restaurant,manager,employee)
│   ├── admin
│   ├── client
│   ├── common
│   ├── courier
│   └── restaurant
└── public # will try to auth User if access-token is provided, if not, user-data like coords etc, will not be applied 
    ├── admin
    ├── client
    ├── courier
    ├── dev
    ├── faq
    ├── info
    ├── restaurant
    ├── services
    ├── share
    ├── system
    └── user
```


###### App auto post-boot tasks:

Task are executed (once at startup) right after App has been successfuly inited and ready to process data

```bash

root: /src/post-boot/tasks/

# Task names are formed as:
<number>.<name>.task.js
number: execution order of all tasks
name: any string name
extention: must end with <.task.js>, else taks will be ignored
```



###### Push-Events:

```ỳaml
- push notifications types:

  - courier:
    - info: in use
    # - adminMessage: not in use
    # - courierMessage: not in use
    # - supplierMessage: not in use
    # - clientMessage: not in use

    - supplierCanceledOrder: in use
    - supplierOrderIsReady: in use
    - supplierOrderCompleted: in use
    - supplierOrderDelayed: in use

    - courierOrderRequest: in use
    - courierAcceptedOrder: in use
    - courierCanceledOrder: in use
    - courierDeliveredOrder: in use
    - courierEmailVerificationRequired: in use
    - courierKycVerificationRequired: in use
    - courierRequestApproved: in use
    - courierRequestRejected: in use

    - clientCanceledOrder: in use
    - clientRejectedOrder: in use
    - clientDintGetInTouch: in use
    - clientPaidOrder: in use

    - orderRated: in use
    - orderDiscarded: in use

    - withdrawRequestApproved: in use
    - withdrawRequestRejected: in use
    - withdrawRequestCompleted: in use

  - client:
    - info: in use
    - adminMessage: in use
    - courierMessage: in use
    - supplierMessage: in use
    - clientMessage: in use

    - supplierAcceptedOrder: in use
    - supplierCanceledOrder: in use
    - supplierOrderDelayed: in use
    # - supplierOrderIsReady: not in use
    - allSuppliersHaveConfirmed: in use

    - clientConfirmedOrder: in use
    - clientCanceledOrder: in use
    - clientRejectedOrder: in use
    - clientDintGetInTouch: in use

    - courierAcceptedOrder: in use
    - courierCanceledOrder: in use
    - courierDeliveredOrder: in use
    - courierHasCollectedTheOrders: in use

    - paymentSucceeded: in use
    - paymentFailed: in use
    - paymentActionRequired: in use

    - rateOrder: in use
    - orderRated: in use
    - orderRefunded: in use
    - orderDiscarded: in use
```