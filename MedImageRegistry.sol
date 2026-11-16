// SPDX-License-Identifier: MIT
pragma solidity ^0.7.5;

/**
 * @title MedImageRegistry
 * @dev Stores medical image CIDs and metadata on Ganache blockchain
 */
contract MedImageRegistry {

    struct ImageRecord {
        string  cid;
        string  sha256Hash;
        string  imageType;
        string  filename;
        uint256 timestamp;
        address uploader;
        bool    encrypted;
    }

    ImageRecord[] public records;
    mapping(address => uint256[]) public ownerRecords;

    event ImageStored(
        uint256 indexed recordId,
        address indexed uploader,
        string cid,
        string imageType,
        uint256 timestamp
    );

    function storeImage(
        string memory _cid,
        string memory _sha256Hash,
        string memory _imageType,
        string memory _filename,
        bool _encrypted
    ) public returns (uint256) {
        uint256 recordId = records.length;

        records.push(ImageRecord({
            cid:        _cid,
            sha256Hash: _sha256Hash,
            imageType:  _imageType,
            filename:   _filename,
            timestamp:  block.timestamp,
            uploader:   msg.sender,
            encrypted:  _encrypted
        }));

        ownerRecords[msg.sender].push(recordId);

        emit ImageStored(recordId, msg.sender, _cid, _imageType, block.timestamp);
        return recordId;
    }

    function getRecord(uint256 _id) public view returns (
        string memory cid,
        string memory sha256Hash,
        string memory imageType,
        string memory filename,
        uint256 timestamp,
        address uploader,
        bool encrypted
    ) {
        require(_id < records.length, "Record does not exist");
        ImageRecord storage r = records[_id];
        return (r.cid, r.sha256Hash, r.imageType, r.filename, r.timestamp, r.uploader, r.encrypted);
    }

    function getMyRecords() public view returns (uint256[] memory) {
        return ownerRecords[msg.sender];
    }

    function totalRecords() public view returns (uint256) {
        return records.length;
    }
}
