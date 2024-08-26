# token-stream

Initialized using [@stackr/sdk](https://www.stackrlabs.xyz/)

## About

This token streaming MRU is inspired by Superfluid's token streaming protocol. This is an upgrade of an earlier implementation of the same which used stackr's alpha release. It can be found [here](https://github.com/Stream-fi/stream-roll).

## How it works

### State

The overall rollup has a simple state object defined as follows:

```typescript
export type MicroFluidStateObject = {
  address: string;
  staticBalance: number;
  netFlow: number;
  lastUpdate: number;
  liquidationTime: number;
  streams: {
    receiver: string;
    flowRate: number;
    startTime: number;
  }[];
};
```

The state object is updated every time a new stream is created or an existing stream is updated. The state object is stored as a standalone merkle tree. The rollup is then able to calculate the net flow of the token for each user by summing the flow rates of all the streams that the user is a receiver of. The net flow is then used to calculate the user's balance at any given time.

### Actions

The rollup supports the following actions:

- Create Stream
- Modify Stream
- Close Stream

```typescript
const CREATE_STREAM_SCHEMA = new ActionSchemaWithNonce("create_stream", {
  creator: SolidityType.ADDRESS,
  recipient: SolidityType.ADDRESS,
  flowRate: SolidityType.UINT,
});

const MODIFY_STREAM_SCHEMA = new ActionSchemaWithNonce("modify_stream", {
  streamId: SolidityType.UINT,
  flowRate: SolidityType.UINT,
});

const CLOSE_STREAM_SCHEMA = new ActionSchemaWithNonce("close_stream", {
  streamId: SolidityType.UINT,
});
```

### State transitions

There are only 2 state [transitions](https://github.com/kautukkundan/token-stream-mru/blob/main/src/stackr/transitions.ts) that can occur

- Create Stream
- Close Stream

Create stream updates the state object by adding a new stream to the streams array. Close stream updates the state object by removing the stream from the streams array.

### User current balance

The user's current balance is calculated by summing the static balance and the net flow of the user. The static balance is the balance of the user at the time of the last update. The net flow is the sum of the flow rates of all the streams that the user is a receiver of.

```typescript
export const getCurrentBalance = (
  userState: MicroFluidStateObject,
  currentTime: number
) => {
  const timeElapsed = currentTime - userState.lastUpdate;
  const netFlow = userState.netFlow;
  const newBalance = userState.staticBalance + netFlow * timeElapsed;
  return newBalance;
};
```

## Notable features

- **State Efficiency** - The state object is stored as a standalone merkle tree. This allows the rollup to calculate the net flow of the token for each user by summing the flow rates of all the streams that the user is a receiver of. The net flow is then used to calculate the user's balance at any given time.
- **Action Efficiency** - The rollup supports only 3 actions: Create Stream, Modify Stream, Close Stream. This makes the rollup more efficient as it does not have to handle a wide range of actions. Each action is simple and only has minimal number of bytes.
- **Low frequency State update** - state is updated only when a stream is created or closed. This makes the rollup more efficient as it does not have to update the state for each user at every block. The current balance of each user is calculated on the fly using the state object which is just math.

## Future work

The current implementation is a simple version of the token streaming MRU. There are several features that can be added to make it more robust and efficient. This project was bootstrapped in just a few hours as a proof of concept. Here are some features that can be added:

- **Liquidation** - Implement a liquidation mechanism to allow users to liquidate their streams in case of a dispute.
- **Curves** - Implement different curves for the flow rate of the streams. This will allow users to create streams with different flow rates.
