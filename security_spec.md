# Security Specification - BudgetQuest

## 1. Data Invariants
- A `User` public profile must exist for any authenticated user.
- A `User` private settings document must only be accessible by the owner.
- `Pockets`, `Transactions`, `Categories`, and `Quests` are strictly owned by the user and not shared.
- Points and streaks can only be incremented/updated based on valid actions (e.g., completing a quest, adding a transaction).
- All timestamps must be server-generated.
- Amounts in transactions and pocket balances must be numbers.

## 2. The "Dirty Dozen" Payloads (PERMISSION_DENIED)

1. **Identity Spoofing**: Attempt to create a user profile with a different UID.
   ```json
   { "path": "users/attacker-uid", "data": { "name": "Fake Me", "points": 1000 }, "auth": { "uid": "victim-uid" } }
   ```
2. **PII Leak**: Non-owner trying to read private settings.
   ```json
   { "path": "users/victim-uid/private/settings", "auth": { "uid": "attacker-uid" }, "op": "get" }
   ```
3. **Points Injection**: Attempt to set arbitrary high points.
   ```json
   { "path": "users/my-uid", "data": { "points": 999999 }, "auth": { "uid": "my-uid" }, "op": "update" }
   ```
4. **Cross-User Pocket Write**: Attempt to create a pocket in another user's collection.
   ```json
   { "path": "users/victim-uid/pockets/new-pocket", "data": { "name": "Steal", "type": "Spendable", "currentBalance": 0 }, "auth": { "uid": "attacker-uid" } }
   ```
5. **Ghost Field Injection**: Adding an unmapped field to a categories document.
   ```json
   { "path": "users/my-uid/categories/cat1", "data": { "name": "Food", "budget": 100, "isVerified": true }, "auth": { "uid": "my-uid" } }
   ```
6. **Quest Skip**: Marking a quest as completed without reaching the target.
   ```json
   { "path": "users/my-uid/quests/quest1", "data": { "isCompleted": true, "progress": 0, "target": 5 }, "auth": { "uid": "my-uid" }, "op": "update" }
   ```
7. **Negative Balance**: Setting a pocket balance to negative if logic forbids it.
   ```json
   { "path": "users/my-uid/pockets/p1", "data": { "currentBalance": -1000 }, "auth": { "uid": "my-uid" }, "op": "update" }
   ```
8. **Invalid ID Poisoning**: Using a very long string as a document ID to exhaust resources.
   ```json
   { "path": "users/my-uid/transactions/very-long-id-string-exceeding-128-chars...", "data": { ... }, "auth": { "uid": "my-uid" } }
   ```
9. **Email Spoofing (Unverified)**: Accessing features that require verified email with an unverified account.
   ```json
   { "path": "users/my-uid/private/settings", "auth": { "uid": "my-uid", "token": { "email_verified": false } } }
   ```
10. **Transaction Amount Type Mismatch**: Sending a string instead of a number for amount.
    ```json
    { "path": "users/my-uid/transactions/tx1", "data": { "amount": "100.0", ... }, "auth": { "uid": "my-uid" } }
    ```
11. **Quest XP Manipulation**: Updating a quest to have more XP than allowed.
    ```json
    { "path": "users/my-uid/quests/quest1", "data": { "xp": 10000 }, "auth": { "uid": "my-uid" }, "op": "update" }
    ```
12. **Immutable Field Change**: Trying to change `createdAt` (if implemented).

## 3. Test Runner
(This would be a firestore.rules.test.ts, but we will focus on the actual rules implementation first and use the principles to ensure they pass.)
