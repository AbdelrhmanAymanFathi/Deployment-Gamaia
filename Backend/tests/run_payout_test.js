const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const axios = require('axios');
const FormDataLib = require('form-data');

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';
const ADMIN_CREDENTIALS = {
    nationalId: process.env.TEST_ADMIN_NATIONAL_ID,
    password: process.env.TEST_ADMIN_PASSWORD,
};
const USER_CREDENTIALS_PREFIX = 'testuser';
const ASSOCIATION_CONFIG = {
    namePrefix: `TestPayoutAssoc_`,
    monthlyAmount: 100, // Amount each user contributes monthly
    duration: 3,        // number of months == number of users
    type: 'B',
    startDate: new Date().toISOString().split('T')[0]
};
// Interval for checking payouts, slightly more than server's 10 seconds
const PAYOUT_CHECK_INTERVAL = 11 * 1000;

let adminToken;
let associationId;
const testUsers = [];

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
const log = (message) => console.log(`[${new Date().toISOString()}] ${message}`);

async function loginUser(nationalId, password) {
    try {
        log(`Attempting login for: ${nationalId}`);
        const response = await axios.post(`${BASE_URL}/auth/login`, { nationalId, password });
        return response.data.token;
    } catch (e) {
        const errorMsg = e.response ? JSON.stringify(e.response.data.error || e.response.data) : e.message;
        log(`Login failed for ${nationalId}: ${errorMsg}`);
        return null;
    }
}

async function setupAdminUser() {
    if (ADMIN_CREDENTIALS.nationalId && ADMIN_CREDENTIALS.password) {
        adminToken = await loginUser(ADMIN_CREDENTIALS.nationalId, ADMIN_CREDENTIALS.password);
        if (adminToken) {
            log(`Logged in as existing admin: ${ADMIN_CREDENTIALS.nationalId}`);
            return;
        }
        log(`Failed to login with provided TEST_ADMIN_NATIONAL_ID. Will attempt to register a new admin.`);
    }

    if (!process.env.ADMIN_SECRET) {
        throw new Error("ADMIN_SECRET not found in environment, set TEST_ADMIN_NATIONAL_ID/PASSWORD for an existing admin, or set ADMIN_SECRET.");
    }

    const newAdminNatId = `admin_${Date.now()}`;
    const newAdminPassword = "testadminpassword";
    const adminRegData = {
        fullName: "Test Admin User",
        nationalId: newAdminNatId,
        password: newAdminPassword,
        phone: `01000000${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
        secretKey: process.env.ADMIN_SECRET
    };

    log(`Attempting to register new admin: ${adminRegData.nationalId}`);
    try {
        await axios.post(`${BASE_URL}/auth/register-admin`, adminRegData);
        log(`Admin ${adminRegData.nationalId} registered.`);
        adminToken = await loginUser(adminRegData.nationalId, adminRegData.password);
        if (!adminToken) throw new Error("Failed to login with newly registered admin.");
        ADMIN_CREDENTIALS.nationalId = adminRegData.nationalId;
        ADMIN_CREDENTIALS.password = newAdminPassword;
        log(`Using newly registered admin: ${ADMIN_CREDENTIALS.nationalId}`);
    } catch (e) {
        const errorMsg = e.response ? JSON.stringify(e.response.data.error || e.response.data) : e.message;
        log(`Error registering admin: ${errorMsg}`);
        throw new Error(`Admin registration/login failed: ${errorMsg}`);
    }
}

async function createTestAssociation() {
    const associationDetails = {
        ...ASSOCIATION_CONFIG,
        name: `${ASSOCIATION_CONFIG.namePrefix}${Date.now()}`,
    };
    log(`Creating association: ${associationDetails.name}`);
    const response = await axios.post(`${BASE_URL}/associations`, associationDetails, {
        headers: { Authorization: `Bearer ${adminToken}` }
    });
    associationId = response.data.association.id;
    log(`Association created with ID: ${associationId}, Name: ${associationDetails.name}`);
}

async function registerAndLoginTestUsers() {
    const dummyProfileImagePath = path.join(__dirname, 'dummy_profile.png');
    const dummySalarySlipPath = path.join(__dirname, 'dummy_salary.png');
    if (!fs.existsSync(dummyProfileImagePath)) fs.writeFileSync(dummyProfileImagePath, 'dummy_profile_content_for_test');
    if (!fs.existsSync(dummySalarySlipPath)) fs.writeFileSync(dummySalarySlipPath, 'dummy_salary_content_for_test');

    for (let i = 0; i < ASSOCIATION_CONFIG.duration; i++) {
        const uniqueSuffix = `${Date.now()}_${i}`;
        const userData = {
            fullName: `Test User ${uniqueSuffix}`,
            nationalId: `${USER_CREDENTIALS_PREFIX}_${uniqueSuffix}`,
            password: `password${uniqueSuffix}`,
            phone: `01234567${String(Date.now()).slice(-5)}${i}`,
            address: `Test Address ${uniqueSuffix}`
        };

        const form = new FormDataLib();
        form.append('fullName', userData.fullName);
        form.append('nationalId', userData.nationalId);
        form.append('password', userData.password);
        form.append('phone', userData.phone);
        form.append('address', userData.address);
        form.append('profileImage', fs.createReadStream(dummyProfileImagePath), { filename: 'dummy_profile.png' });
        form.append('salarySlipImage', fs.createReadStream(dummySalarySlipPath), { filename: 'dummy_salary.png' });

        try {
            log(`Registering user: ${userData.nationalId}`);
            const regResponse = await axios.post(`${BASE_URL}/auth/register`, form, {
                headers: { ...form.getHeaders() }
            });
            const userId = regResponse.data.id;
            const token = await loginUser(userData.nationalId, userData.password);
            if (token && userId) {
                testUsers.push({ id: userId, nationalId: userData.nationalId, password: userData.password, token });
                log(`Registered and logged in: ${userData.nationalId} (ID: ${userId})`);
            } else {
                log(`Registered ${userData.nationalId} but login or getting ID failed.`);
            }
        } catch (e) {
            const errorMsg = e.response ? JSON.stringify(e.response.data.error || e.response.data) : e.message;
            log(`Registration failed for ${userData.nationalId}: ${errorMsg}`);
        }
    }
    if (testUsers.length !== ASSOCIATION_CONFIG.duration) {
        throw new Error(`Failed to register all ${ASSOCIATION_CONFIG.duration} users. Registered: ${testUsers.length}`);
    }
}

async function joinUsersToAssociation() {
    for (const user of testUsers) {
        try {
            log(`User ${user.nationalId} joining association ${associationId}`);
            await axios.post(`${BASE_URL}/associations/${associationId}/join`, {}, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            log(`User ${user.nationalId} successfully joined association ${associationId}`);
        } catch (e) {
            const errorMsg = e.response ? JSON.stringify(e.response.data.error || e.response.data) : e.message;
            log(`User ${user.nationalId} failed to join ${associationId}: ${errorMsg}`);
            throw new Error(`User ${user.nationalId} join failed.`);
        }
    }
}

async function getUserWalletBalance(userToken) {
    const response = await axios.get(`${BASE_URL}/userData/wallet`, {
        headers: { Authorization: `Bearer ${userToken}` }
    });
    return response.data.walletBalance;
}

async function getAssociationMembers(assocId) {
    try {
        const response = await axios.get(`${BASE_URL}/associations/${assocId}/members`);
        return response.data.data || [];
    } catch (e) {
        log(`Error fetching association members for ${assocId}: ${e.response ? JSON.stringify(e.response.data) : e.message}`);
        return [];
    }
}

async function recordInitialStates() {
    log("--- Recording Initial User States ---");
    const members = await getAssociationMembers(associationId);

    for (const user of testUsers) {
        user.initialWalletBalance = await getUserWalletBalance(user.token);
        const memberData = members.find(m => m.userId === user.id);
        if (memberData) {
            user.initialHasReceived = memberData.hasReceived;
            user.initialTurnNumber = memberData.turnNumber;
        } else {
            user.initialHasReceived = false;
            user.initialTurnNumber = null;
            log(`WARNING: User ${user.nationalId} (ID: ${user.id}) not found in association member list after joining.`);
        }
        log(`User ${user.nationalId} (ID: ${user.id}): Wallet = ${user.initialWalletBalance}, HasReceived = ${user.initialHasReceived}, Turn = ${user.initialTurnNumber || 'N/A'}`);
    }
}

async function triggerPayoutCycle() {
    log(`Triggering payout cycle for association ID: ${associationId}`);
    await axios.post(`${BASE_URL}/associations/test-cycle`, { associationId: associationId });
    log("Payout cycle initiated. Waiting for payouts to process...");
}

async function runTest() {
    try {
        log("======== Starting Payout Test ========");

        await setupAdminUser();
        await createTestAssociation();
        await registerAndLoginTestUsers();
        await joinUsersToAssociation();
        await recordInitialStates();
        await triggerPayoutCycle();

        const totalPot = parseFloat(ASSOCIATION_CONFIG.monthlyAmount) * ASSOCIATION_CONFIG.duration;
        log(`Total pot amount per payout: ${totalPot}`);
        let paidUserIdsInThisCycle = new Set();

        for (let round = 1; round <= ASSOCIATION_CONFIG.duration; round++) {
            log(`\nWaiting ${PAYOUT_CHECK_INTERVAL / 1000} seconds for Payout Round ${round}...`);
            await delay(PAYOUT_CHECK_INTERVAL);
            log(`--- Checking Payouts for Round ${round} ---`);

            const currentMembersState = await getAssociationMembers(associationId);
            let newlyPaidUserThisRound = null;

            for (const member of currentMembersState) {
                const userInTest = testUsers.find(u => u.id === member.userId);
                if (!userInTest) continue;

                if (member.hasReceived && !paidUserIdsInThisCycle.has(member.userId)) {
                    newlyPaidUserThisRound = userInTest;
                    paidUserIdsInThisCycle.add(member.userId);

                    log(`Recipient in Round ${round}: User ${userInTest.nationalId} (ID: ${userInTest.id})`);
                    log(`  Status: HasReceived = ${member.hasReceived} (Initial: ${userInTest.initialHasReceived}), LastReceivedDate = ${member.lastReceivedDate}`);

                    const currentWallet = await getUserWalletBalance(userInTest.token);
                    log(`  Wallet: Initial = ${userInTest.initialWalletBalance}, Current = ${currentWallet}`);

                    const expectedWallet = parseFloat(userInTest.initialWalletBalance) + totalPot;
                    if (Math.abs(currentWallet - expectedWallet) < 0.01) {
                        log(`  SUCCESS: Wallet balance for ${userInTest.nationalId} updated correctly to ${currentWallet}.`);
                    } else {
                        log(`  WARNING: Wallet for ${userInTest.nationalId} is ${currentWallet}, expected approx ${expectedWallet}. (Pot: ${totalPot})`);
                    }
                    break;
                }
            }
            if (!newlyPaidUserThisRound) {
                log(`WARNING: No new user was identified as paid in Round ${round}. Check server logs. Test will continue.`);
                log(`  Current member states (IDs that have received so far in this test: ${Array.from(paidUserIdsInThisCycle).join(', ')}):`);
                currentMembersState.forEach(m => {
                    const u = testUsers.find(usr => usr.id === m.userId);
                    log(`    User ID ${m.userId} (NatID: ${u ? u.nationalId : 'N/A'}): API_HasReceived=${m.hasReceived}`);
                });
            }
        }

        log("\n--- Final State Verification After All Rounds ---");
        let allSuccessfullyPaidCount = 0;
        const finalMembersList = await getAssociationMembers(associationId);

        for (const user of testUsers) {
            const finalMemberData = finalMembersList.find(m => m.userId === user.id);
            const finalWallet = await getUserWalletBalance(user.token);
            const wasPaidInThisTest = paidUserIdsInThisCycle.has(user.id);

            log(`User ${user.nationalId} (ID: ${user.id}):`);
            log(`  Initial Wallet: ${user.initialWalletBalance}, Final Wallet: ${finalWallet}`);
            log(`  API Reported HasReceived: ${finalMemberData ? finalMemberData.hasReceived : 'N/A (not in members list?)'}`);
            log(`  Verified as Paid in this Test Cycle: ${wasPaidInThisTest}`);

            if (finalMemberData && finalMemberData.hasReceived && wasPaidInThisTest) {
                allSuccessfullyPaidCount++;
                const expectedFinalBalance = parseFloat(user.initialWalletBalance) + totalPot;
                if (Math.abs(finalWallet - expectedFinalBalance) < 0.01) {
                    log(`  Wallet check: OK (Final: ${finalWallet} vs Expected: ${expectedFinalBalance})`);
                } else {
                    log(`  Wallet check: WARN (Final: ${finalWallet} vs Expected: ${expectedFinalBalance})`);
                }
            } else if (finalMemberData && finalMemberData.hasReceived && !wasPaidInThisTest) {
                log(`  INFO: User was marked as 'hasReceived' by API, but not verified during this test's rounds (possibly pre-paid or timing issue). Wallet: ${finalWallet}`);
            } else {
                log(`  INFO: User not marked as 'hasReceived' by API or not verified in this test. Wallet: ${finalWallet}`);
            }
        }

        log(`\n======== Test Summary ========`);
        log(`Total users expected to be paid: ${ASSOCIATION_CONFIG.duration}`);
        log(`Total users verified as paid in this test cycle: ${allSuccessfullyPaidCount}`);

        if (allSuccessfullyPaidCount === ASSOCIATION_CONFIG.duration) {
            log("SUCCESS: All users appear to have been paid correctly during the test cycle.");
        } else {
            log(`WARNING: Only ${allSuccessfullyPaidCount} out of ${ASSOCIATION_CONFIG.duration} users were fully verified as paid. Review logs.`);
        }
        log("==============================");

    } catch (error) {
        log(`\n!!!!!!!!!! TEST FAILED !!!!!!!!!!!`);
        log(`Error: ${error.message}`);
        if (error.response && error.response.data) {
            log(`Error details: ${JSON.stringify(error.response.data)}`);
        }
        if (error.stack) {
            log(`Stack: ${error.stack}`);
        }
        log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    }
}

runTest();