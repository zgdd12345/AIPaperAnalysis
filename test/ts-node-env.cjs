/* eslint-env node */
/* global process, __dirname */
const path = require("node:path");

process.env.TS_NODE_PROJECT = path.join(__dirname, "tsconfig.json");
