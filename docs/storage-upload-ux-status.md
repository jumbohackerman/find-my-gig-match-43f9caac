# Storage Upload UX Status

Focused pass on the CV upload UX for candidates.

## Coverage
- **File type validation**: Restricted to `.pdf` with toast feedback on mismatch.
- **File size validation**: Limited to `5MB` maximum with toast feedback.
- **Upload progress**: Visually simulated progress bar (`Progress` from shadcn) during upload for better perceived performance.
- **Replace/remove file behavior**: Distinct active state showing the uploaded file icon with explicit "Change file" (upload icon) and "Remove file" (trash icon) action buttons.
- **Success/failure feedback**: `sonner` toasts trigger on completion or failure.
- **Empty state**: Intuitive drag-and-drop zone with a dashed border for the empty/no-file state.

## Implementation Details
- Handled in `src/pages/MyProfile.tsx`.
- Uses existing `supabaseStorageService` via the provider registry.
- Deleting the file triggers `getProvider("storage").delete`.

## Live Storage / Backend Dependencies
- Actual file processing and secure PDF previewing for employers depend on the live Supabase Storage RLS policies and bucket configurations.
- Replacing files uploads a new file and then updates the DB pointer. Proper garbage collection of old files depends on successful API deletion via Supabase Storage bucket.