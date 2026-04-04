export const TEST_KEY = "test-secret-key-abc";
export const TEST_IV = "test-iv-abc";
export const TEST_METHOD = "aes-256-cbc";

export function setEncryptionEnv() {
    process.env.SECRET_KEY = TEST_KEY;
    process.env.SECRET_IV = TEST_IV;
    process.env.ENCRYPTION_METHOD = TEST_METHOD;
}

export function clearEncryptionEnv() {
    delete process.env.SECRET_KEY;
    delete process.env.SECRET_IV;
    delete process.env.ENCRYPTION_METHOD;
}
