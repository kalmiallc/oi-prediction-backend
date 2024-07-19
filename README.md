# Flare OI Bet Showcase BE and Olympics API

This project contains a BE workers and API for the Olympics showcase, written in Express.js. Data is stored in MongoDB, and Vercel workers are used to run cron parsers.

Flare Olympics Bet Showcase is a simple sports betting application centered around the Olympics, enabling users to view and place bets on various Olympic team sports. This decentralized application (dApp) features a frontend that directly interacts with a smart contract, ensuring all betting data is securely provided by the smart contract.

This backend application has two main purposes:

1. Provide cron-based workers, which start the attestation procedure and receive Merkle proofs from the attestation providers.
2. Provide an API (as one of the sources) on which the attestation server can get data.

## Overview

This repository contains a sports events betting contract, part of the Flare Data Connector Olympics showcase. This showcase enables users to place bets on team sports events, supporting wagers with straightforward outcomes: win, lose, or draw. The results of the events are retrieved into the smart contract using the Flare Data Connector capabilities.

The complete showcase consists of four parts:

1. Betting smart contract
2. Front-end application
3. Backend application that calls the provider API for verification
4. Verification server

## Features

- API for Olympics sports events
- Provide cron-based workers to interact with attestation procedure
- Data storage in MongoDB

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
Distributed under the MIT License. See LICENSE for more information.
