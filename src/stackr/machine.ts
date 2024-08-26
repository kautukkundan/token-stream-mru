import { State, StateMachine } from "@stackr/sdk/machine";
import { solidityPackedKeccak256, ZeroHash } from "ethers";
import { MemoryMerkleTree } from "../utils";
import { transitions } from "./transitions";

import MerkleTree from "merkletreejs";
import * as genesisState from "../../genesis-state.json";

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

export class MicroFluidState extends State<
  MicroFluidStateObject[],
  MemoryMerkleTree<MicroFluidStateObject>
> {
  constructor(state: MicroFluidStateObject[]) {
    super(state);
  }

  transformer() {
    return {
      wrap: () => {
        return new MemoryMerkleTree(this.state, (leaf) => {
          // merklize all the streams
          let streamsMerkleRoot = ZeroHash;

          if (leaf.streams.length !== 0) {
            const hashedStreams = leaf.streams.map((stream) => {
              return solidityPackedKeccak256(
                ["address", "uint256", "uint256"],
                [stream.receiver, stream.flowRate, stream.startTime]
              );
            });
            // get merkle root of streams
            streamsMerkleRoot = new MerkleTree(hashedStreams).getHexRoot();
          }

          // hash the leaf
          return solidityPackedKeccak256(
            ["address", "uint256", "int256", "uint256", "uint256", "bytes32"],
            [
              leaf.address,
              leaf.staticBalance,
              leaf.netFlow,
              leaf.lastUpdate,
              leaf.liquidationTime,
              streamsMerkleRoot,
            ]
          );
        });
      },
      unwrap: (wrappedState: MemoryMerkleTree<MicroFluidStateObject>) => {
        return wrappedState.leaves;
      },
    };
  }

  getRootHash(): string {
    if (this.state.length === 0) {
      return ZeroHash;
    }
    return this.transformer().wrap().merkleTree.getHexRoot();
  }
}

const microFluidStateMachine = new StateMachine({
  id: "micro-fluid",
  stateClass: MicroFluidState,
  initialState: genesisState.state,
  on: transitions,
});

// error doesnt bubble up
// const obj = new MicroFluidState(genesisState.state);
// console.log(obj.getRootHash());

export { microFluidStateMachine };
