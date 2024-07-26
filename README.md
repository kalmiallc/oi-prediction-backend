# OI Prediction Showcase backend

This repository contains a backend  workers and initial data storage for the Olympics showcase, written in Express.js. Data is stored in MongoDB, and Vercel workers are used to run cron parsers.

Olympics Prediction Showcase is a simple sports results prediction application centered around the Olympics, enabling users to view and place predictions on various Olympic team sports. This decentralized application (dApp) features a frontend that directly interacts with a smart contract, ensuring all prediction data is securely provided by the smart contract.

This backend application has two main purposes:

1. Provide cron-based workers, which start the attestation procedure and receive Merkle proofs from the attestation providers.
2. Provide an source for the initial contract data. The data source is taken from the Official Olympics page <https://olympics.com/en/paris-2024/schedule>.

## Features

- Provide cron-based workers to interact with attestation procedure
- Initial data for the events
- Data storage in MongoDB

## Complete showcase

The complete showcase consists of four parts:

1. Prediction smart contract
2. Front-end application
3. This backend application
4. Verification server

## Technologies

- **Backend Framework:** Express.js
- **Database:** MongoDB
- **Deployment:** Vercel
- **Cron Jobs:** Vercel Workers

## Installation

1. Install dependencies:

```
npm install
```

2. Create a .env file in the root directory and add the following variables:

```
MONGODB_URI=your_mongodb_uri
```

3. Run:

```
npm start
```

## License

This project is [MIT licensed](LICENSE.md).
