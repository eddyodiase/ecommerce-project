## Intro to the Project
This is the backend for the [ecommerce-project](https://github.com/SuperSimpleDev/ecommerce-project).
- 95% of the code was generated with AI.

## Video Tutorials
**Part 1 - Create the Backend:** https://youtu.be/vBprybSmJs8

## Set up this backend
1. Make sure you have NodeJS installed (version 22+). If not, [click here to install](https://nodejs.org/).
2. Download this code by clicking the green `Code` button (in the top-right) > Click `Download Zip`.
3. Unzip the code. On Windows, right-click the zip file > `Extract All`. On Mac, double-click the zip file.
4. Open this code in VSCode.
5. At the top menu of VSCode, click `Terminal` > `New Terminal`.
6. In the Terminal, run `npm install`, and run `npm run dev`.

## Production deployment

Use Node.js 22 or newer and deploy the frontend and backend over HTTPS. Build the frontend from
`ecommerce-project` with `npm ci`, `npm run lint`, `npm test`, and `npm run build`; the build output
is written to this backend's `dist` directory and served by the Express app.

Set `NODE_ENV=production`, `FRONTEND_URL` to the public HTTPS storefront URL, and configure
`DB_TYPE` (`mysql` or `postgres`) plus `RDS_HOSTNAME`, `RDS_PORT`, `RDS_DB_NAME`, `RDS_USERNAME`,
and `RDS_PASSWORD` for a durable managed database. Configure `ADMIN_API_KEY` with a unique random
value of at least 32 characters, and set real payment/bank details only when those payment methods
are enabled. Paystack is disabled unless `PAYSTACK_ENABLED=true` and a secret key is configured;
Pay on Delivery is enabled by default. `CORS_ORIGINS` is optional and accepts comma-separated
HTTPS origins.

Do not use the example credentials in production, commit `.env`, or deploy the development SQLite
database. The admin key is required to review listings or manage orders. Customer order details are
available only with the access token issued and stored on the device used to place the order.

## Troubleshooting
If you run into issues, see the [troubleshooting steps](troubleshooting.md).
