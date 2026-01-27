import Web3 from "web3";
import { CHAIN_RPC_URL } from "../../config/env.js";

const web3 = new Web3(CHAIN_RPC_URL);

class NonceQueue {
  constructor() {
    this.queue = Promise.resolve();
    this.currentNonce = null;
  }

  async _initNonce(address) {
    if (this.currentNonce === null) {
      const count = await web3.eth.getTransactionCount(address, "pending");
      // Ensure nonce is a BigInt for consistent arithmetic
      this.currentNonce = BigInt(count);
    }
  }

  enqueue(address, fn) {
    this.queue = this.queue.then(async () => {
      await this._initNonce(address);

      const nonce = this.currentNonce;
      this.currentNonce += 1n; // Use BigInt literal for increment

      return fn(nonce);
    });

    return this.queue;
  }
}

export const nonceQueue = new NonceQueue();
