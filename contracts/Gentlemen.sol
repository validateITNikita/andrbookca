// SPDX-License-Identifier: UNLICENCED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

interface USDT {
    event Transfer(address indexed from, address indexed to, uint256 value);

    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );

    function totalSupply() external view returns (uint256);

    function balanceOf(address account) external view returns (uint256);

    function transfer(address to, uint256 amount) external returns (bool);

    function allowance(
        address owner,
        address spender
    ) external view returns (uint256);

    function approve(address spender, uint256 amount) external returns (bool);

    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external returns (bool);
}

contract Gentlemen is ERC721, ERC721Enumerable, ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    address public _BUSD_TESNET_ADDRESS =
        0xaB1a4d4f1D656d2450692D237fdD6C7f9146e814;
    USDT public usdt = USDT(_BUSD_TESNET_ADDRESS);

    uint256 public _mintPrice = 1 ether;
    uint16 public _maxSupply = 333;

    bool public _isMintEnabled;

    mapping(address => uint256) public walletMints;

    address payable[2] public recipients = [
        // TESTNET

        // FIRST
        payable(0x731c33e080e2eD100A26FB4346a9487fD1716b02),
        // SECOND
        payable(0xC5669da4aF25d78382683a69f3E13364894c756D)
    ];

    event TransferReceived(address _from, uint256 _amount);
    event Minted(address _from);

    constructor() ERC721("Gentelmen", "MEN") {}

    function _baseURI() internal pure override returns (string memory) {
        return "https://www.mentevisionaria.pt/api/metadata/";
    }

    function _splitAndSendValue() internal {
        uint256 share = _mintPrice / 2;

        for (uint256 i = 0; i < recipients.length; i++) {
            usdt.transferFrom(msg.sender, recipients[i], share);
        }

        emit TransferReceived(msg.sender, msg.value);
    }

    function safeMint(string memory uri) public payable {
        require(_isMintEnabled, "Minting is not enabled.");
        require((totalSupply() + 1) <= _maxSupply, "Sold out!");
        require(
            usdt.balanceOf(msg.sender) >= _mintPrice,
            "Not enough funds. Add more USDT!"
        );

        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();

        _splitAndSendValue();

        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, uri);

        walletMints[msg.sender] += 1;
        emit Minted(msg.sender);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function _burn(
        uint256 tokenId
    ) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function setMaxSupply(uint16 maxSupply) external onlyOwner {
        _maxSupply = maxSupply;
    }

    function supportsInterface(
        bytes4 interfaceId
    )
        public
        view
        override(ERC721, ERC721Enumerable, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function changeTokenURI(
        uint256 tokenID,
        string memory newTokenURI
    ) external onlyOwner {
        _setTokenURI(tokenID, newTokenURI);
    }

    function changeMintPrice(uint256 newMintPrice) external onlyOwner {
        _mintPrice = newMintPrice;
    }

    function toggleMinting(bool enabled) external onlyOwner {
        _isMintEnabled = enabled;
    }

    function withdraw() public payable onlyOwner {
        (bool success, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(success);
    }

    function changeRecipients(
        address _new,
        address _new2
    ) public payable onlyOwner {
        recipients[0] = payable(_new);
        recipients[1] = payable(_new2);
    }

    function setUSDTAddress(address _usdt) external onlyOwner {
        usdt = USDT(_usdt);
    }

    function withdrawUSDT() public payable onlyOwner {
        usdt.transferFrom(address(this), msg.sender, balanceOf(address(this)));
    }

    receive() external payable {
        uint256 share = _mintPrice / 2;

        for (uint256 i = 0; i < recipients.length; i++) {
            usdt.transferFrom(address(this), recipients[i], share);
        }

        emit TransferReceived(msg.sender, msg.value);
    }
}
