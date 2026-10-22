# Device Inventory (stub, Phase 2b)

> Stub: confirm against mcsu-app before Phase 2b starts (Q12).

## Purpose
Track company devices (laptops, phones, peripherals) and who holds them, so equipment is recovered when someone resigns.

## Proposed shape
- `Device` (asset tag, type, brand/model, serial, purchase date, status: In stock / Assigned / Repair / Retired) + `DeviceAssignment` history (employee, from/to, condition notes).
- The employee detail page gets a "Devices" tab. Setting a resignation date creates an ACTION notification `device.return_due` for the inventory manager.
- Proposed permissions: `device.view` (S; employees see their own), `device.manage` (—).

## Open questions
Is this already tracked elsewhere (IT asset system)? Are client-provided devices tracked too?
