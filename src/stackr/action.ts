import { SolidityType } from "@stackr/sdk";
import { ActionSchemaWithNonce } from "../utils";

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

export const schemas = {
  CREATE_STREAM_SCHEMA,
  MODIFY_STREAM_SCHEMA,
  CLOSE_STREAM_SCHEMA,
};
