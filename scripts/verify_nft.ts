import * as anchor from "@coral-xyz/anchor";
import {
  Metaplex,
  PublicKey,
  walletAdapterIdentity,
} from "@metaplex-foundation/js";

describe("spl-token-minter", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const wallet = provider.wallet as anchor.Wallet;
  const connection = provider.connection;

  /// Keypairs
  const metaplex = Metaplex.make(connection);

  it("Verify NFT as collection item", async () => {
    metaplex.use(walletAdapterIdentity(wallet));
    const verify = await metaplex.nfts().verifyCollection(
      {
        mintAddress: new PublicKey(""),
        collectionMintAddress: new PublicKey(""),
        isSizedCollection: true,
      },
      { commitment: "finalized" }
    );
    console.log("Your verify transaction signature", verify);
  });
});
