import { ActionSchema, SolidityType } from "@stackr/sdk";
import MerkleTree from "merkletreejs";

export class ActionSchemaWithNonce extends ActionSchema {
  constructor(name: string, schema: Record<string, SolidityType>) {
    super(name, {
      nonce: SolidityType.UINT,
      ...schema,
    });
  }
}

export class MemoryMerkleTree<Leaf> {
  public readonly merkleTree: MerkleTree;
  public readonly leaves: Leaf[];
  private hasher: (leaf: Leaf) => string;

  constructor(leaves: Leaf[], hasher: (leaf: Leaf) => string) {
    this.hasher = hasher;
    this.leaves = leaves;
    this.merkleTree = this.createTree(leaves);
  }

  createTree(leaves: Leaf[]) {
    const hashedLeaves = leaves.map((leaf) => {
      return this.hasher(leaf);
    });
    return new MerkleTree(hashedLeaves);
  }
}
