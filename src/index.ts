import { MicroRollup } from "@stackr/sdk";
import { Playground } from "@stackr/sdk/plugins";
import { stackrConfig } from "../stackr.config.ts";
import { schemas } from "./stackr/action.ts";
import { microFluidStateMachine } from "./stackr/machine.ts";
import { getCurrentBalance } from "./stackr/transitions.ts";

type MicroFluidMachine = typeof microFluidStateMachine;

const mru = await MicroRollup({
  config: stackrConfig,
  actionSchemas: [...Object.values(schemas)],
  stateMachines: [microFluidStateMachine],
  isSandbox: true,
});

await mru.init();
const pg = Playground.init(mru);

pg.addGetMethod("/custom/balance/:user", async (_req, res) => {
  const stateMachine = mru.stateMachines.get<MicroFluidMachine>("micro-fluid");

  if (!stateMachine) {
    return res.json("State machine not found");
  }

  const user = _req.params.user;
  const state = stateMachine.state;
  const userState = state.find((s) => s.address === user);

  if (!userState) {
    return res.json("User not found");
  }

  const newBalance = getCurrentBalance(userState, Date.now());
  return res.json({ user: user, balance: newBalance });
});

pg.addGetMethod("/custom/latest-balances-all/", async (_req, res) => {
  const stateMachine = mru.stateMachines.get<MicroFluidMachine>("micro-fluid");

  if (!stateMachine) {
    return res.json("State machine not found");
  }

  const state = stateMachine.state;
  const latestBalances = state.map((userState) => {
    const newBalance = getCurrentBalance(userState, Date.now());
    return {
      user: userState.address,
      balance: newBalance,
      flowRate: userState.netFlow,
    };
  });

  return res.json(latestBalances);
});

export { MicroFluidMachine, mru };
