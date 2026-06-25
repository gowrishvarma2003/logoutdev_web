"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chatCrypto_1 = require("/Users/deepak/Documents/logoutdev/logoutdev_web/lib/chatCrypto");
async function main() {
    try {
        console.log("Starting E2EE PIN cryptography test...");
        const pin = "4829";
        const saltBase64 = "YWJjZGVmZ2hpamtsbW5vcA=="; // 16 bytes base64 salt
        console.log("1. Deriving keys from PIN:", pin);
        const { backupKey, authKeyHash } = await (0, chatCrypto_1.deriveE2EEKeys)(pin, saltBase64);
        console.log("Keys derived successfully!");
        console.log("Auth Key Hash:", authKeyHash);
        console.log("2. Creating a new KeyVault...");
        const vault = await (0, chatCrypto_1.createKeyVault)();
        vault.backup_salt = saltBase64;
        console.log("KeyVault created successfully!");
        console.log("3. Encrypting KeyVault...");
        const encrypted = await (0, chatCrypto_1.encryptKeyVault)(vault, backupKey);
        console.log("Vault encrypted successfully!");
        console.log("Ciphertext length:", encrypted.ciphertext.length);
        console.log("Nonce/IV:", encrypted.nonceOrIv);
        console.log("4. Decrypting KeyVault...");
        const decrypted = await (0, chatCrypto_1.decryptKeyVault)(encrypted.ciphertext, backupKey, encrypted.nonceOrIv);
        console.log("Vault decrypted successfully!");
        console.log("Decrypted Master Key matches original:", decrypted.account_master_key === vault.account_master_key);
        console.log("Decrypted Backup Salt:", decrypted.backup_salt);
        if (decrypted.account_master_key === vault.account_master_key && decrypted.backup_salt === saltBase64) {
            console.log("E2EE PIN Cryptography verification: SUCCESS!");
        }
        else {
            console.error("Verification failed: master key or salt mismatch.");
        }
    }
    catch (error) {
        console.error("Test failed with error:", error);
    }
}
main();
