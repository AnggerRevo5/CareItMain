Feature: Fix INACBG Total Claim Calculation

Problem:
When a user adds a new INACBG code, the total claim amount does not increase as expected. Instead, it seems to reset or absorb the new code's value into the base offset. This happens because the Base Offset calculation logic uses the *current* list of selected codes (which includes the new code) to calculate the offset from the *original* total.
Formula used: Offset = OriginalTotal - Sum(CurrentCodes)
If user adds code: Offset = Original - (Old + New)
Final Total = Offset + (Old + New) = Original.

Solution:
We must distinguish between "Original Codes" (loaded from DB) and "Current Codes" (live state).
The Base Offset should strictly be:
BaseOffset = OriginalTotal - Sum(OriginalCodes)

Steps:
1. Add `initialLoadedCodes` state to `INACBG_Admin_Ruangan.tsx`.
2. Populate checking `initialLoadedCodes` in `loadBillingAktifHistory` when data is loaded from DB.
3. Update `useEffect` calculation logic to validly calculate Base Offset using `initialLoadedCodes` instead of `selectedInacbgCodes` during initialization.
4. Ensure `baseKlaimOffset` is calculated only once.

Refined Logic:
- If `!hasInitializedBaseRef.current`:
   - Calculate `Sum(InitialCodes)`.
   - `Offset = OriginalTotal - Sum(InitialCodes)`.
   - Set `BaseOffset`.
   - Mark initialized.
- Always:
   - `FinalTotal = BaseOffset + Sum(CurrentCodes)`.
