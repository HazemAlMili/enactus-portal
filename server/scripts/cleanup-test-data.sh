    #!/bin/bash
# MongoDB Test Data Cleanup Script
# Run this in MongoDB Atlas Data Explorer or MongoDB Shell

echo "======================================"
echo "ENACTUS PORTAL - TEST DATA CLEANUP"
echo "======================================"
echo ""
echo "WARNING: This script will DELETE all test data from production!"
echo "Only run this BEFORE official production launch."
echo ""
echo "Press Ctrl+C to cancel, or Enter to continue..."
read

echo ""
echo "Step 1: Checking for test data..."
echo "======================================"

# Count test users
echo "Test Users:"
db.users.countDocuments({ isTest: true })

echo ""
echo "Test HighBoard:"
db.highboards.countDocuments({ isTest: true })

echo ""
echo "Test Tasks:"
db.tasks.countDocuments({ isTest: true })

echo ""
echo "Test Hour Logs:"
db.hourlogs.countDocuments({ isTest: true })

echo ""
echo "======================================"
echo "Step 2: Estimating storage impact..."
echo "======================================"

# Get estimated size
db.users.stats().storageSize
db.tasks.stats().storageSize
db.hourlogs.stats().storageSize

echo ""
echo "======================================"
echo "Step 3: DELETING test data..."
echo "======================================"
echo ""
echo "Are you SURE you want to delete all test data?"
echo "Type 'DELETE' to confirm:"
read confirmation

if [ "$confirmation" != "DELETE" ]; then
    echo "Cancelled. No data was deleted."
    exit 0
fi

# Delete test data
echo "Deleting test users..."
db.users.deleteMany({ isTest: true })

echo "Deleting test highboard members..."
db.highboards.deleteMany({ isTest: true })

echo "Deleting test tasks..."
db.tasks.deleteMany({ isTest: true })

echo "Deleting test hour logs..."
db.hourlogs.deleteMany({ isTest: true })

echo ""
echo "======================================"
echo "Step 4: Verifying deletion..."
echo "======================================"

echo "Remaining test users:"
db.users.countDocuments({ isTest: true })

echo "Remaining test highboard:"
db.highboards.countDocuments({ isTest: true })

echo "Remaining test tasks:"
db.tasks.countDocuments({ isTest: true })

echo "Remaining test hour logs:"
db.hourlogs.countDocuments({ isTest: true })

echo ""
echo "======================================"
echo "✅ CLEANUP COMPLETE"
echo "======================================"
echo ""
echo "Next steps:"
echo "1. Verify counts above are all 0"
echo "2. Check storage size in Atlas dashboard"
echo "3. Document storage saved"
echo "4. Proceed with production launch"
echo ""
