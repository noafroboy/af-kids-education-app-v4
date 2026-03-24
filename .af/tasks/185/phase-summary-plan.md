## Plan Summary
Files to modify: [object Object], [object Object], [object Object], [object Object], [object Object], [object Object], [object Object]
Files to create: [object Object], [object Object], [object Object]
Approach: A-Conservative
Steps:
- 1. Create git branch af/185-task-parent-area-security-ux-pin-guard-h/1
- 2. Create src/hooks/useParentAuth.ts per exact spec
- 3. Modify src/app/parent/page.tsx: set sessionStorage on success, handle empty pinHash
- 4. Modify src/app/parent/dashboard/page.tsx: add auth guard, add childName fetch and display
- 5. Modify src/app/parent/settings/page.tsx: add auth guard
- 6. Modify src/components/parent/ChangePinSection.tsx: add error feedback in catch
- 7. Create src/__tests__/useParentAuth.test.ts
- 8. Create src/__tests__/ChangePinSection.test.tsx
- 9. Update src/__tests__/ParentPin.test.tsx with new tests
- 10. Update src/__tests__/ParentDashboard.test.tsx with useParentAuth mock and childName tests
- 11. Update src/__tests__/ParentSettings.test.tsx with useParentAuth mock
- 12. Run npm test and fix failures
- 13. Commit and push
- 14. Write .af/tasks/185/pr-body.md