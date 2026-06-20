# Archived One-Off Scripts

This folder contains various ad-hoc scripts that were previously cluttering the root directory of the project. 

These include:
- Data repair scripts (`fix-days.js`, `fix-prisma.js`, `clean-truncated.js`, etc.)
- Debug and inspection scripts (`debug-acts.js`, `check-trips.js`, `count-packages.js`)
- Initial seeding or migration utilities (`seed-packages.js`)

**Why are they here?**
None of these scripts are actively referenced by the running application or wired into the `package.json` build/start processes. They are kept here rather than deleted outright because some (like `seed-packages.js`) might still serve as useful references or one-off utilities for future database maintenance or local testing.
