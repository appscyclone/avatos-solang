import "../libraries/spl_token.sol";
import "../libraries/spl_associated_token.sol";
import "../libraries/mpl_metadata.sol";

@program_id("2x68unHHXezB2TvqfE93CbjFsmj6E5wfgLNKrSTqs1ig")
contract avatos_nft {
    string private _name;
    string private _symbol;
    string private _baseURI;
    address private _owner;
    address private _collectionMint;
    address private _collectionMeta;
    address private _collectionEdition;
    uint256 private _totalSupply;

    @space(320)
    @payer(payer)
    constructor(
        address owner_
    ) {
        _owner = owner_;
    }

    function initialize(
        address payer, // payer account
        address mint, // mint account to be created
        address metadata, // metadata account to be created
        address edition, // edition account to be created
        address tokenAccount, // Associated Token Account
        string collectionUri, // uri for the metadata account
        string name_,
        string symbol_,
        string baseURI_
    ) public onlyOwner {
        require(_name == "", "initialized");

        _name = name_;
        _symbol = symbol_;
        _baseURI = baseURI_;

        _createCollectionToken(
            payer,
            mint,
            metadata,
            edition,
            tokenAccount,
            collectionUri
        );
        _collectionMint = mint;
        _collectionMeta = metadata;
        _collectionEdition = edition;
    }

    modifier onlyOwner() {
        for (uint64 i = 0; i < tx.accounts.length; i++) {
            AccountInfo ai = tx.accounts[i];

            if (ai.key == _owner && ai.is_signer) {
                _;
                return;
            }
        }
        print("not owner");
        revert();
    }

    function owner() public view returns (address) {
        return _owner;
    }

    function setBaseURI(string baseURI_) public onlyOwner {
        _baseURI = baseURI_;
    }

    function baseURI() public view returns (string) {
        return _baseURI;
    }

    function totalSupply() public view returns (uint256) {
        return _totalSupply;
    }

    // Call only once
    // Create new Collection Token. The following account will be initialize
    // MintAccount + Metadata + Edition + Token Account
    function _createCollectionToken(
        address payer, // payer account
        address mint, // mint account to be created
        address metadata, // metadata account PDA to be created
        address edition, // edition account PDA to be created
        address tokenAccount, // Associated Token Account
        string collectionUri // uri for the metadata account
    ) internal {
        // Collection NFT
        // Create Mint Account
        SplToken.create_mint_account(
            payer,           // payer account
            mint,            // mint account
            0                // decimals
        );

        // Create Metadata Account
        MplMetadata.create_metadata_account_collection(
            metadata, // metadata account
            mint,  // mint account
            payer, // mint authority
            _name, // name
            _symbol, // symbol
            collectionUri // uri (off-chain metadata json)
        );


        // Create Token Account to store token
        SplAssociatedToken.create_associated_token_account(
            payer,
            tokenAccount,
            payer,
		    mint
        );

        // Mint token to
        SplToken.mint_to(
            mint, // mint account
            tokenAccount, // token account
            payer, // mint authority
            1 // amount
        );

        // Create Master Edition Account
        MplMetadata.create_master_edition_v3_collection(
            edition, // edition
            mint,  // mint account
            payer, // payer
            metadata // metadata
        );
    }

    function mintToken(
        address payer, // payer account
        address mint, // mint account to be created
        address metadata, // metadata account to be created
        address edition,  // edition account to be created
        address tokenAccount // token account PDA to be created,
    ) public {
        // Normal NFT
        // Create Mint Account
        SplToken.create_mint_account(
            payer,           // payer account
            mint,            // mint account
            0                // decimals
        );

        // Create Metadata Account
        _totalSupply = _totalSupply + 1;
        string tokenName = "{} #{}".format(_name, _totalSupply);
        string tokenUri = "{}{}".format(_baseURI, _totalSupply);
        MplMetadata.create_metadata_account_normal(
            metadata, // metadata account
            mint,  // mint account
            payer, // mint authority
            _collectionMint, // collection nft mint account
            tokenName, // name
            _symbol, // symbol
            tokenUri // uri (off-chain metadata json)
        );

        // Create Token Account to store token
        SplAssociatedToken.create_associated_token_account(
            payer,
            tokenAccount,
            payer,
		    mint
        );

        // Mint token to
        SplToken.mint_to(
            mint, // mint account
            tokenAccount, // token account
            payer, // mint authority
            1 // amount
        );

        // Create Master Edition Account
        MplMetadata.create_master_edition_v3_nft(
            edition, // edition
            mint,  // mint account
            payer, // payer
            metadata // metadata
        );
    }

    function verifyNft(
        address payer,
        address nft_metadata
    ) public {
        MplMetadata.verify_collection(
            nft_metadata, // metadata account
            payer,  // collection update authority
            payer, // payer
            _collectionMint, // collection mint account
            _collectionMeta, // collection metadata account
            _collectionEdition // collection master edition account
        );
    }
}
