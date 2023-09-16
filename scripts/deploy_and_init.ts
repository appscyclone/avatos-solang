import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { AvatosNft } from "../target/types/avatos_nft";
import { PublicKey, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { Metaplex } from "@metaplex-foundation/js";

const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

async function main() {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  // Generate a new keypair for the data account for the program
  const dataAccount = anchor.web3.Keypair.generate();

  const wallet = provider.wallet as anchor.Wallet;
  const connection = provider.connection;

  const program = anchor.workspace.AvatosNft as Program<AvatosNft>;

  // Metadata for the Token
  const tokenTitle = "Avatos NFT";
  const tokenSymbol = "AVATOS";
  const collectionURI = "https://assets.avatos.xyz/metadata.json";
  const baseURI = "https://assets.avatos.xyz/magical/solana/";

  /// Keypairs
  const metaplex = Metaplex.make(connection);
  // Collection NFT
  const collectionMintKeypair = anchor.web3.Keypair.generate();
  const collectionMetadata = metaplex
    .nfts()
    .pdas()
    .metadata({ mint: collectionMintKeypair.publicKey });
  const collectionMasterEdition = metaplex
    .nfts()
    .pdas()
    .masterEdition({ mint: collectionMintKeypair.publicKey });
  const collectionAta = metaplex.tokens().pdas().associatedTokenAccount({
    mint: collectionMintKeypair.publicKey,
    owner: wallet.publicKey,
  });

  //// Initialize data account for the program, which is required by Solang
  const tx = await program.methods
    .new()
    .accounts({ dataAccount: dataAccount.publicKey })
    .signers([dataAccount])
    .rpc();
  console.log("Your transaction constructor signature", tx);

  const init_tx = await program.methods
    .initialize(
      wallet.publicKey, // payer
      collectionMintKeypair.publicKey, // mint
      collectionMetadata, // metadata
      collectionMasterEdition, // edition
      collectionAta, // associated token account
      collectionURI, // collection uri
      tokenTitle, // token name
      tokenSymbol, // token symbol
      baseURI // base uri
    )
    .accounts({ dataAccount: dataAccount.publicKey })
    .remainingAccounts([
      { pubkey: wallet.publicKey, isWritable: true, isSigner: true },
      {
        pubkey: collectionMintKeypair.publicKey,
        isWritable: true,
        isSigner: true,
      },
      { pubkey: collectionMetadata, isWritable: true, isSigner: false },
      { pubkey: collectionMasterEdition, isWritable: true, isSigner: false },
      { pubkey: collectionAta, isWritable: true, isSigner: false },
      { pubkey: SYSVAR_RENT_PUBKEY, isWritable: false, isSigner: false },
      {
        pubkey: TOKEN_METADATA_PROGRAM_ID,
        isWritable: false,
        isSigner: false,
      },
    ])
    .signers([collectionMintKeypair])
    .rpc();
  console.log("Your mint collection nft transaction signature", init_tx);
}

main();
