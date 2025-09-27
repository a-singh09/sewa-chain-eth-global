// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title URIDRegistry
 * @dev Smart contract for registering and managing Unique Relief Identifiers (URIDs)
 * @notice This contract stores hashed URIDs to prevent duplicate aid distribution
 */
contract URIDRegistry {
    // Events
    event FamilyRegistered(
        bytes32 indexed uridHash,
        uint256 familySize,
        uint256 registrationTime,
        address registeredBy
    );

    event FamilyStatusUpdated(
        bytes32 indexed uridHash,
        bool isActive,
        address updatedBy
    );

    // Struct to store family information
    struct Family {
        bytes32 uridHash;
        uint256 familySize;
        uint256 registrationTime;
        address registeredBy;
        bool isActive;
        bool exists;
    }

    // State variables
    mapping(bytes32 => Family) public families;
    mapping(bytes32 => bool) public registeredURIDs;
    mapping(address => uint256) public registrationCount;

    uint256 public totalFamilies;
    address public owner;

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier validURIDHash(bytes32 _uridHash) {
        require(_uridHash != bytes32(0), "Invalid URID hash");
        _;
    }

    modifier familyNotExists(bytes32 _uridHash) {
        require(!families[_uridHash].exists, "Family already registered");
        _;
    }

    modifier familyExists(bytes32 _uridHash) {
        require(families[_uridHash].exists, "Family not found");
        _;
    }

    // Constructor
    constructor() {
        owner = msg.sender;
        totalFamilies = 0;
    }

    /**
     * @dev Register a new family with their URID hash
     * @param _uridHash Hashed URID for privacy
     * @param _familySize Number of family members
     */
    function registerFamily(
        bytes32 _uridHash,
        uint256 _familySize
    ) external validURIDHash(_uridHash) familyNotExists(_uridHash) {
        require(_familySize > 0 && _familySize <= 20, "Invalid family size");

        // Create family record
        families[_uridHash] = Family({
            uridHash: _uridHash,
            familySize: _familySize,
            registrationTime: block.timestamp,
            registeredBy: msg.sender,
            isActive: true,
            exists: true
        });

        // Mark URID as registered
        registeredURIDs[_uridHash] = true;

        // Update counters
        registrationCount[msg.sender]++;
        totalFamilies++;

        emit FamilyRegistered(
            _uridHash,
            _familySize,
            block.timestamp,
            msg.sender
        );
    }

    /**
     * @dev Check if a family is valid and active
     * @param _uridHash Hashed URID to validate
     * @return bool True if family is valid and active
     */
    function isValidFamily(
        bytes32 _uridHash
    ) external view validURIDHash(_uridHash) returns (bool) {
        return families[_uridHash].exists && families[_uridHash].isActive;
    }

    /**
     * @dev Get family information
     * @param _uridHash Hashed URID to query
     * @return Family struct with all family data
     */
    function getFamilyInfo(
        bytes32 _uridHash
    )
        external
        view
        validURIDHash(_uridHash)
        familyExists(_uridHash)
        returns (Family memory)
    {
        return families[_uridHash];
    }

    /**
     * @dev Update family status (activate/deactivate)
     * @param _uridHash Hashed URID to update
     * @param _isActive New status for the family
     */
    function updateFamilyStatus(
        bytes32 _uridHash,
        bool _isActive
    ) external onlyOwner validURIDHash(_uridHash) familyExists(_uridHash) {
        families[_uridHash].isActive = _isActive;
        emit FamilyStatusUpdated(_uridHash, _isActive, msg.sender);
    }

    /**
     * @dev Check if URID hash is already registered
     * @param _uridHash Hashed URID to check
     * @return bool True if URID is already registered
     */
    function isURIDRegistered(
        bytes32 _uridHash
    ) external view validURIDHash(_uridHash) returns (bool) {
        return registeredURIDs[_uridHash];
    }

    /**
     * @dev Get total number of registered families
     * @return uint256 Total count of registered families
     */
    function getTotalFamilies() external view returns (uint256) {
        return totalFamilies;
    }

    /**
     * @dev Get registration count for a specific registrar
     * @param _registrar Address of the registrar
     * @return uint256 Number of families registered by this address
     */
    function getRegistrationCount(
        address _registrar
    ) external view returns (uint256) {
        return registrationCount[_registrar];
    }

    /**
     * @dev Batch register multiple families (for efficiency)
     * @param _uridHashes Array of hashed URIDs
     * @param _familySizes Array of family sizes
     */
    function batchRegisterFamilies(
        bytes32[] calldata _uridHashes,
        uint256[] calldata _familySizes
    ) external {
        require(
            _uridHashes.length == _familySizes.length,
            "Array length mismatch"
        );
        require(_uridHashes.length <= 50, "Too many families in batch");

        for (uint256 i = 0; i < _uridHashes.length; i++) {
            if (
                !families[_uridHashes[i]].exists && _uridHashes[i] != bytes32(0)
            ) {
                this.registerFamily(_uridHashes[i], _familySizes[i]);
            }
        }
    }

    /**
     * @dev Emergency function to transfer ownership
     * @param _newOwner Address of the new owner
     */
    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "Invalid new owner address");
        owner = _newOwner;
    }

    /**
     * @dev Get contract statistics
     * @return totalFamilies_ Total registered families
     * @return activeFamilies Total active families
     * @return contractBalance Contract balance in wei
     */
    function getContractStats()
        external
        view
        returns (
            uint256 totalFamilies_,
            uint256 activeFamilies,
            uint256 contractBalance
        )
    {
        totalFamilies_ = totalFamilies;

        // Note: In a real implementation, you'd need to track active families separately
        // for gas efficiency. This is a simplified version.
        activeFamilies = totalFamilies; // Simplified - assume all are active

        contractBalance = address(this).balance;
    }
}
