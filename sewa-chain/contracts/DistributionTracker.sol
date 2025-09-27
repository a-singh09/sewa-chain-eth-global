// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title DistributionTracker
 * @dev Smart contract for tracking aid distribution to prevent duplicates
 * @notice This contract records all aid distributions and enforces cooldown periods
 */
contract DistributionTracker {
    
    // Enum for different types of aid
    enum AidType { 
        FOOD,       // 0 - Food packages, meals
        MEDICAL,    // 1 - Medicine, first aid
        SHELTER,    // 2 - Temporary housing, tents
        CLOTHING,   // 3 - Clothes, blankets
        WATER,      // 4 - Clean water, purification
        CASH        // 5 - Direct cash assistance
    }

    // Struct to store distribution information
    struct Distribution {
        bytes32 uridHash;
        bytes32 volunteerNullifier;
        AidType aidType;
        uint256 timestamp;
        uint256 quantity;
        string location;
        bool confirmed;
        bool exists;
    }

    // Events
    event DistributionRecorded(
        bytes32 indexed uridHash,
        bytes32 indexed volunteerNullifier,
        AidType indexed aidType,
        uint256 quantity,
        string location,
        uint256 timestamp
    );
    
    event DistributionConfirmed(
        bytes32 indexed distributionId,
        bytes32 indexed uridHash,
        address confirmedBy
    );

    event CooldownPeriodUpdated(
        AidType indexed aidType,
        uint256 oldPeriod,
        uint256 newPeriod
    );

    // State variables
    mapping(bytes32 => Distribution) public distributions;
    mapping(bytes32 => Distribution[]) public familyDistributions;
    mapping(bytes32 => mapping(AidType => uint256)) public lastDistribution;
    mapping(AidType => uint256) public cooldownPeriods;
    mapping(bytes32 => uint256) public volunteerDistributionCount;
    
    uint256 public totalDistributions;
    address public owner;
    
    // Default cooldown periods (in seconds)
    uint256 public constant DEFAULT_FOOD_COOLDOWN = 24 hours;
    uint256 public constant DEFAULT_MEDICAL_COOLDOWN = 1 hours;
    uint256 public constant DEFAULT_SHELTER_COOLDOWN = 7 days;
    uint256 public constant DEFAULT_CLOTHING_COOLDOWN = 30 days;
    uint256 public constant DEFAULT_WATER_COOLDOWN = 12 hours;
    uint256 public constant DEFAULT_CASH_COOLDOWN = 30 days;

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier validURIDHash(bytes32 _uridHash) {
        require(_uridHash != bytes32(0), "Invalid URID hash");
        _;
    }
    
    modifier validVolunteerNullifier(bytes32 _volunteerNullifier) {
        require(_volunteerNullifier != bytes32(0), "Invalid volunteer nullifier");
        _;
    }

    // Constructor
    constructor() {
        owner = msg.sender;
        totalDistributions = 0;
        
        // Set default cooldown periods
        cooldownPeriods[AidType.FOOD] = DEFAULT_FOOD_COOLDOWN;
        cooldownPeriods[AidType.MEDICAL] = DEFAULT_MEDICAL_COOLDOWN;
        cooldownPeriods[AidType.SHELTER] = DEFAULT_SHELTER_COOLDOWN;
        cooldownPeriods[AidType.CLOTHING] = DEFAULT_CLOTHING_COOLDOWN;
        cooldownPeriods[AidType.WATER] = DEFAULT_WATER_COOLDOWN;
        cooldownPeriods[AidType.CASH] = DEFAULT_CASH_COOLDOWN;
    }

    /**
     * @dev Record a new aid distribution
     * @param _uridHash Hashed URID of the beneficiary family
     * @param _volunteerNullifier World ID nullifier of the volunteer
     * @param _aidType Type of aid being distributed
     * @param _quantity Quantity of aid (standardized units)
     * @param _location Location where aid was distributed
     */
    function recordDistribution(
        bytes32 _uridHash,
        bytes32 _volunteerNullifier,
        AidType _aidType,
        uint256 _quantity,
        string calldata _location
    ) 
        external 
        validURIDHash(_uridHash)
        validVolunteerNullifier(_volunteerNullifier)
        returns (bytes32 distributionId)
    {
        require(_quantity > 0, "Quantity must be greater than 0");
        require(bytes(_location).length > 0, "Location cannot be empty");
        
        // Check for duplicate distribution (cooldown period)
        uint256 timeSinceLastDistribution = block.timestamp - lastDistribution[_uridHash][_aidType];
        require(
            timeSinceLastDistribution >= cooldownPeriods[_aidType],
            "Cooldown period not met for this aid type"
        );

        // Generate unique distribution ID
        distributionId = keccak256(
            abi.encodePacked(
                _uridHash,
                _volunteerNullifier,
                _aidType,
                block.timestamp,
                totalDistributions
            )
        );

        // Create distribution record
        Distribution memory newDistribution = Distribution({
            uridHash: _uridHash,
            volunteerNullifier: _volunteerNullifier,
            aidType: _aidType,
            timestamp: block.timestamp,
            quantity: _quantity,
            location: _location,
            confirmed: true, // Auto-confirmed for now
            exists: true
        });

        // Store distribution
        distributions[distributionId] = newDistribution;
        familyDistributions[_uridHash].push(newDistribution);
        lastDistribution[_uridHash][_aidType] = block.timestamp;
        
        // Update counters
        volunteerDistributionCount[_volunteerNullifier]++;
        totalDistributions++;

        emit DistributionRecorded(
            _uridHash,
            _volunteerNullifier,
            _aidType,
            _quantity,
            _location,
            block.timestamp
        );

        return distributionId;
    }

    /**
     * @dev Check if a family can receive a specific type of aid
     * @param _uridHash Hashed URID of the family
     * @param _aidType Type of aid to check
     * @return eligible True if family is eligible for this aid type
     * @return timeUntilEligible Seconds until family becomes eligible
     */
    function checkEligibility(bytes32 _uridHash, AidType _aidType) 
        external 
        view 
        validURIDHash(_uridHash)
        returns (bool eligible, uint256 timeUntilEligible) 
    {
        uint256 lastDistributionTime = lastDistribution[_uridHash][_aidType];
        
        if (lastDistributionTime == 0) {
            // Never received this aid type
            return (true, 0);
        }
        
        uint256 timeSinceLastDistribution = block.timestamp - lastDistributionTime;
        uint256 requiredCooldown = cooldownPeriods[_aidType];
        
        if (timeSinceLastDistribution >= requiredCooldown) {
            return (true, 0);
        } else {
            return (false, requiredCooldown - timeSinceLastDistribution);
        }
    }

    /**
     * @dev Get distribution history for a family
     * @param _uridHash Hashed URID of the family
     * @return Distribution[] Array of all distributions for this family
     */
    function getDistributionHistory(bytes32 _uridHash) 
        external 
        view 
        validURIDHash(_uridHash)
        returns (Distribution[] memory) 
    {
        return familyDistributions[_uridHash];
    }

    /**
     * @dev Get recent distributions (last N distributions)
     * @param _limit Maximum number of distributions to return
     * @return recentDistributions Array of recent distribution IDs
     */
    function getRecentDistributions(uint256 _limit) 
        external 
        view 
        returns (bytes32[] memory recentDistributions) 
    {
        require(_limit > 0 && _limit <= 100, "Invalid limit");
        
        // This is a simplified implementation
        // In production, you'd want a more efficient way to track recent distributions
        recentDistributions = new bytes32[](_limit);
        // Implementation would require additional state tracking
        
        return recentDistributions;
    }

    /**
     * @dev Get distribution statistics
     * @return totalDist Total number of distributions
     * @return foodDist Total food distributions
     * @return medicalDist Total medical distributions
     * @return shelterDist Total shelter distributions
     */
    function getDistributionStats() 
        external 
        view 
        returns (
            uint256 totalDist,
            uint256 foodDist,
            uint256 medicalDist,
            uint256 shelterDist
        ) 
    {
        totalDist = totalDistributions;
        
        // Note: For gas efficiency, these counters should be tracked separately
        // This is a simplified version
        foodDist = 0;    // Would need separate tracking
        medicalDist = 0; // Would need separate tracking
        shelterDist = 0; // Would need separate tracking
        
        return (totalDist, foodDist, medicalDist, shelterDist);
    }

    /**
     * @dev Update cooldown period for an aid type
     * @param _aidType Type of aid to update
     * @param _newPeriod New cooldown period in seconds
     */
    function updateCooldownPeriod(AidType _aidType, uint256 _newPeriod) 
        external 
        onlyOwner 
    {
        require(_newPeriod > 0, "Cooldown period must be greater than 0");
        require(_newPeriod <= 365 days, "Cooldown period too long");
        
        uint256 oldPeriod = cooldownPeriods[_aidType];
        cooldownPeriods[_aidType] = _newPeriod;
        
        emit CooldownPeriodUpdated(_aidType, oldPeriod, _newPeriod);
    }

    /**
     * @dev Get volunteer distribution count
     * @param _volunteerNullifier World ID nullifier of the volunteer
     * @return count Number of distributions by this volunteer
     */
    function getVolunteerDistributionCount(bytes32 _volunteerNullifier) 
        external 
        view 
        validVolunteerNullifier(_volunteerNullifier)
        returns (uint256 count) 
    {
        return volunteerDistributionCount[_volunteerNullifier];
    }

    /**
     * @dev Check if distribution exists
     * @param _distributionId ID of the distribution to check
     * @return exists True if distribution exists
     */
    function distributionExists(bytes32 _distributionId) 
        external 
        view 
        returns (bool exists) 
    {
        return distributions[_distributionId].exists;
    }

    /**
     * @dev Get cooldown period for aid type
     * @param _aidType Type of aid
     * @return period Cooldown period in seconds
     */
    function getCooldownPeriod(AidType _aidType) 
        external 
        view 
        returns (uint256 period) 
    {
        return cooldownPeriods[_aidType];
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
     * @dev Batch record multiple distributions (for efficiency)
     * @param _uridHashes Array of family URID hashes
     * @param _volunteerNullifiers Array of volunteer nullifiers
     * @param _aidTypes Array of aid types
     * @param _quantities Array of quantities
     * @param _locations Array of locations
     */
    function batchRecordDistributions(
        bytes32[] calldata _uridHashes,
        bytes32[] calldata _volunteerNullifiers,
        AidType[] calldata _aidTypes,
        uint256[] calldata _quantities,
        string[] calldata _locations
    ) external {
        require(_uridHashes.length == _volunteerNullifiers.length, "Array length mismatch");
        require(_uridHashes.length == _aidTypes.length, "Array length mismatch");
        require(_uridHashes.length == _quantities.length, "Array length mismatch");
        require(_uridHashes.length == _locations.length, "Array length mismatch");
        require(_uridHashes.length <= 20, "Too many distributions in batch");
        
        for (uint256 i = 0; i < _uridHashes.length; i++) {
            recordDistribution(
                _uridHashes[i],
                _volunteerNullifiers[i],
                _aidTypes[i],
                _quantities[i],
                _locations[i]
            );
        }
    }
}