import { REQUIRE, STF, Transitions } from "@stackr/sdk/machine";
import { MicroFluidState, MicroFluidStateObject } from "./machine";

export const getCurrentBalance = (
  userState: MicroFluidStateObject,
  currentTime: number
) => {
  const timeElapsed = currentTime - userState.lastUpdate;
  const netFlow = userState.netFlow;
  const newBalance = userState.staticBalance + netFlow * timeElapsed;
  return newBalance;
};

type createStreamInputs = {
  creator: string;
  recipient: string;
  flowRate: number;
};

const createStream: STF<MicroFluidState, createStreamInputs> = {
  handler: ({ inputs, state, block }) => {
    // find sender
    const senderLeaf = state.leaves.find(
      (leaf) => leaf.address === inputs.creator
    );

    // this does not automatically return
    // REQUIRE(senderLeaf !== undefined, "Sender not found");

    if (senderLeaf === undefined) {
      throw new Error("Sender not found");
    }

    // check if stream is already created
    const streamIndex = senderLeaf?.streams.findIndex(
      (stream) => stream.receiver === inputs.recipient
    );

    REQUIRE(streamIndex === -1, "Stream already exists");

    // check if sender has enough balance
    const currentBalance = getCurrentBalance(senderLeaf, block.timestamp);

    REQUIRE(
      currentBalance >= inputs.flowRate,
      "Sender does not have enough balance"
    );

    // settle account of sender and recipient
    senderLeaf.staticBalance = currentBalance;
    senderLeaf.lastUpdate = block.timestamp;

    const recipientLeaf = state.leaves.find(
      (leaf) => leaf.address === inputs.recipient
    );

    // if recipient does not exist revert
    REQUIRE(recipientLeaf !== undefined, "Recipient not found");

    if (recipientLeaf === undefined) {
      return state;
    }

    const recipientBalance = getCurrentBalance(recipientLeaf, block.timestamp);
    recipientLeaf.staticBalance = recipientBalance;
    recipientLeaf.lastUpdate = block.timestamp;

    // update net flow of sender and recipient
    senderLeaf.netFlow -= inputs.flowRate;
    recipientLeaf.netFlow += inputs.flowRate;

    // create stream
    senderLeaf.streams.push({
      receiver: inputs.recipient,
      flowRate: inputs.flowRate,
      startTime: block.timestamp,
    });

    return state;
  },
};

const closeStream: STF<MicroFluidState, { streamId: number }> = {
  handler: ({ inputs, state, block }) => {
    const senderLeaf = state.leaves.find((leaf) =>
      leaf.streams.find((stream, index) => {
        if (index === inputs.streamId) {
          return true;
        }
        return false;
      })
    );

    REQUIRE(senderLeaf !== undefined, "Stream not found");

    if (senderLeaf === undefined) {
      return state;
    }

    const stream = senderLeaf.streams[inputs.streamId];

    // settle account of sender and recipient
    const currentBalance = getCurrentBalance(senderLeaf, block.timestamp);
    senderLeaf.staticBalance = currentBalance;
    senderLeaf.lastUpdate = block.timestamp;

    const recipientLeaf = state.leaves.find(
      (leaf) => leaf.address === stream.receiver
    );

    REQUIRE(recipientLeaf !== undefined, "Recipient not found");

    if (recipientLeaf === undefined) {
      return state;
    }

    const recipientBalance = getCurrentBalance(recipientLeaf, block.timestamp);
    recipientLeaf.staticBalance = recipientBalance;
    recipientLeaf.lastUpdate = block.timestamp;

    // update net flow of sender and recipient
    senderLeaf.netFlow += stream.flowRate;
    recipientLeaf.netFlow -= stream.flowRate;

    // remove stream
    senderLeaf.streams.splice(inputs.streamId, 1);

    return state;
  },
};

export const transitions: Transitions<MicroFluidState> = {
  createStream,
  closeStream,
};
