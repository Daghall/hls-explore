#!/usr/bin/env node

"use strict";

const run = require("./index.js");
const terminal = require("terminal-kit").terminal;

(async () => {
  await run(terminal, process);
})();
