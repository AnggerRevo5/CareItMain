# Debug Guide: INACBG Modal - Existing Codes Not Displaying

## Problem
When clicking "Edit INACBG" button, the modal opens but existing INACBG codes from the database are not appearing. The modal shows "Belum ada kode INA CBG yang dipilih" instead of displaying saved codes.

## Solution: Comprehensive Logging Added

I've added detailed console logging throughout the data flow to help identify where the data is being lost.

## How to Debug

### Step 1: Open Browser Developer Console
- Press **F12** or Right-click → "Inspect" → "Console" tab
- Keep this open while testing

### Step 2: Trigger the Data Load
1. In the application, select a patient record
2. Load a billing record
3. Look for these console logs in order:

```
📊 Billing data from API: { ... complete object ... }
📊 data.kode_inacbg: (value or undefined)
📊 data.kode_inacbg type: (string, array, undefined, etc)
📊 data.kode_inacbg is Array?: (true/false)
```

**If you see codes here:** ✅ API is returning data correctly

### Step 3: Click "Edit INACBG" Button

You should see:
```
🔓 Edit INACBG button clicked
📋 originalInacbgCodes: [code1, code2, ...]
📋 originalInacbgCodes length: (number)
📋 totalKlaimOriginal: (number)
```

**If you see codes in originalInacbgCodes:** ✅ Parent component has loaded data correctly

### Step 4: Modal Opens

Look for:
```
📋 Edit INACBG Modal opened
📋 currentData received: { 
    kode_inacbg: [...], 
    tipe_inacbg: "...", 
    kelas: "...", 
    total_klaim: ... 
}
📋 currentData.kode_inacbg: [code1, code2, ...]
📋 currentData.kode_inacbg is Array?: true
📋 Codes to set in modal: [code1, code2, ...]
📋 Codes length: (number)
```

### Step 5: Monitor State Changes

Watch for:
```
🎯 selectedInacbgCodes updated: [code1, code2, ...]
🎯 selectedInacbgCodes length: (number)
```

**These logs appear every time the state changes.**

## Diagnostic Checklist

| Log Message | Indicates | If Missing = Problem |
|---|---|---|
| `📊 Billing data from API:` | API returned data successfully | API not returning response |
| `📊 data.kode_inacbg type:` | Format of kode_inacbg from database | Data structure issue |
| `📝 Loaded INACBG codes from DB:` | Codes successfully parsed | Parsing/parsing logic failed |
| `🔓 Edit INACBG button clicked` | Button click registered | Button handler not triggering |
| `originalInacbgCodes length:` (> 0) | Parent component has data | State not loading correctly |
| `📋 currentData received:` | Modal received props | Props not being passed |
| `📋 Codes to set in modal:` | Modal initialized with codes | Modal initialization failed |
| `🎯 selectedInacbgCodes updated:` | Modal state updated with codes | React state not updating |

## Common Issues & Solutions

### Issue 1: API logs show `kode_inacbg: undefined`
**Cause:** Backend not returning `kode_inacbg` field
**Solution:** Check backend API response format

### Issue 2: Codes loaded but `originalInacbgCodes` is empty
**Cause:** State not setting correctly
**Solution:** May need to check React component lifecycle

### Issue 3: Modal shows empty but `currentData received` has codes
**Cause:** Data not flowing from props to component state
**Solution:** Check `setSelectedInacbgCodes` initialization

### Issue 4: `selectedInacbgCodes` shows codes but UI is empty
**Cause:** Rendering logic issue
**Solution:** Check the display condition that shows codes in template

## Data Flow Path

```
Backend Database
        ↓
API Response (kode_inacbg: [])
        ↓
INACBG_Admin_Ruangan component loads data
        ↓
setOriginalInacbgCodes([...])
        ↓
User clicks "Edit INACBG"
        ↓
Modal receives: currentData={{ kode_inacbg: originalInacbgCodes, ... }}
        ↓
edit-INACBG Modal setSelectedInacbgCodes(codes)
        ↓
UI displays codes with delete buttons
```

## Next Steps

1. **Run the application**
2. **Open F12 console**
3. **Follow the steps above**
4. **Screenshot the console output**
5. **Identify which logs are missing or show wrong values**
6. **Share the logs with specific details about what's missing**

Based on the logs, we can pinpoint exactly where the data flow is broken and fix it accordingly.

## Files Modified

- `INACBG_Admin_Ruangan.tsx` - Added detailed logging at API fetch and button click
- `edit-INACBG.tsx` - Added detailed logging in modal initialization and state updates
