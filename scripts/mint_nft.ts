import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { AvatosNft } from "../target/types/avatos_nft";
import { PublicKey, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { Metaplex, walletAdapterIdentity } from "@metaplex-foundation/js";

const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

describe("spl-token-minter", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  // Generate a new keypair for the data account for the program
  const dataAccount = anchor.web3.Keypair.generate();

  const wallet = provider.wallet as anchor.Wallet;
  const connection = provider.connection;

  const program = anchor.workspace.AvatosNft as Program<AvatosNft>;

  /// Keypairs
  const metaplex = Metaplex.make(connection);
  // Normal NFT
  const nftMintKeypair = anchor.web3.Keypair.generate();
  const nftMetadata = metaplex
    .nfts()
    .pdas()
    .metadata({ mint: nftMintKeypair.publicKey });
  const nftMasterEdition = metaplex
    .nfts()
    .pdas()
    .masterEdition({ mint: nftMintKeypair.publicKey });
  const nftAta = metaplex.tokens().pdas().associatedTokenAccount({
    mint: nftMintKeypair.publicKey, // mint
    owner: wallet.publicKey, // owner
  });

  it("Mint Normal token!", async () => {
    // Associated token account PDA
    const tx = await program.methods
      .mintToken(
        wallet.publicKey, // payer
        nftMintKeypair.publicKey, // mint
        nftMetadata, // metadata
        nftMasterEdition, // edition
        nftAta // associated token account
      )
      .accounts({ dataAccount: dataAccount.publicKey })
      .remainingAccounts([
        { pubkey: wallet.publicKey, isWritable: true, isSigner: true },
        {
          pubkey: nftMintKeypair.publicKey,
          isWritable: true,
          isSigner: true,
        },
        { pubkey: nftMetadata, isWritable: true, isSigner: false },
        { pubkey: nftMasterEdition, isWritable: true, isSigner: false },
        { pubkey: nftAta, isWritable: true, isSigner: false },
        { pubkey: SYSVAR_RENT_PUBKEY, isWritable: false, isSigner: false },
        {
          pubkey: TOKEN_METADATA_PROGRAM_ID,
          isWritable: false,
          isSigner: false,
        },
      ])
      .signers([nftMintKeypair])
      .rpc();
    console.log("Your mint normal nft transaction signature", tx);
  });
});
