# Security Spec: System Lab Firestore

## 1. Data Invariants
1. A **Product** document must belong to the authenticated user who created it (`userId == request.auth.uid`). No user can write or modify another user's products.
2. A **Landing** document must belong to the authenticated user (`userId == request.auth.uid`).
3. **Landing Sections** must always reside under a parent Landing document which belongs to the authenticated user.
4. **Generation Jobs** can only be created by signed-in users, and cannot be tampered with once completed (terminal state locking).
5. **AI Usage** logs must be immutable and only created by signed-in users for their own UID.
6. Identity spoofing is strictly prohibited: fields like `userId` or `id` must be matching the authenticating client `request.auth.uid`.

---

## 2. The "Dirty Dozen" Spoof/Vulnerability Payloads (Expected: PERMISSION_DENIED)

1. **Identity Spoofing on Product Create**: User A attempts to create a Product specifying `userId: "user_B"` to inject fake products on user B's account.
2. **Identity Spoofing on Landing Create**: User A tries to create a Landing specifying `userId: "user_C"`.
3. **Ghost Field Injection on Product**: User A tries to inject a ghost field `isAdminPrivilege: true` into their product payload.
4. **Illegal Update of Owner ID**: User A tries to update a Product's `userId` field to "user_B" to transfer ownership or spoof identity.
5. **Modification of Other's Product**: User A attempts to edit User B's product details.
6. **Malicious Resolution Injection**: User A creates a GenerationJob with an invalid resolution like `"100K"` or a huge payload size.
7. **Bypassing Verification**: An unverified email user attempts to write to `/products/` while verification is required (`request.auth.token.email_verified == true`).
8. **Tampering with Terminal Generation State**: Attempting to manually change a `COMPLETED` GenerationJob's state back to `QUEUED` or inject custom completed results.
9. **Reading Other User's Usage Logs**: User A attempts to list or read user B's `ai_usage` documents.
10. **Shadow Section Hijack**: User A attempts to create a section under User B's landing page.
11. **Immortal Field Override**: Attempting to update `createdAt` timestamp of a landing page.
12. **Self-Allocating Unbound AI Credits**: User A attempts to write a positive increment or direct custom amount to their `creditsUsed` without validation.

---

## 3. Test Runner Specification (Verifying PERMISSION_DENIED)
All rules are modeled with a default-deny gate. Since we are in a sandboxed, automated deployment container, we implement these checks directly in `firestore.rules` and verify them.
Below is the blueprint for our validation tests.
